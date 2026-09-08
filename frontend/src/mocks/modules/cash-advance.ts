import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import type { CashAdvance, CashAdvanceSettlement, JournalStatus } from '@/utils/types'

type CashAdvanceSettlementRequest = Pick<CashAdvanceSettlement, 'date' | 'amount' | 'attachment'>

type CashAdvanceRequest = Omit<
	CashAdvance,
	| 'id'
	| 'number'
	| 'used'
	| 'remaining'
	| 'status'
	| 'rejection_reason'
	| 'approved_by'
	| 'approved_at'
	| 'department_code'
	| 'department_name'
	| 'cash_account_code'
	| 'cash_account_name'
	| 'advance_account_code'
	| 'advance_account_name'
	| 'cash_flow_name'
>

const idOf = (url?: string) => Number(url?.split('/').at(-1))
const statusIdOf = (url?: string) => Number(url?.split('/').at(-2))
// /cash-advance/:id/settlement (list/create)
const settlementListAdvanceIdOf = (url?: string) => Number(url?.split('/').at(-2))
// /cash-advance/:id/settlement/:settlementId (update/delete)
const settlementAdvanceIdOf = (url?: string) => Number(url?.split('/').at(-3))
const settlementIdOf = (url?: string) => Number(url?.split('/').at(-1))
const validStatus = (value: unknown): value is JournalStatus => ['submitted', 'approved', 'rejected'].includes(String(value))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))

function currentUserName(): string {
	try {
		return JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin'
	} catch {
		return 'Admin'
	}
}

// Re-resolve every denormalized label from the current db state.
function resolve(row: CashAdvance): CashAdvance {
	const department = db.department.find((d) => d.id === Number(row.department_id) && !d.deleted_at)
	const cashAccount = db.account.find((a) => a.id === Number(row.cash_account_id) && !a.deleted_at)
	const advanceAccount = db.account.find((a) => a.id === Number(row.advance_account_id) && !a.deleted_at)
	const cashFlow = row.cash_flow ? db.cashFlow.find((f) => f.code === row.cash_flow) : undefined
	return {
		...row,
		department_code: department?.code,
		department_name: department?.name,
		cash_account_code: cashAccount?.code,
		cash_account_name: cashAccount?.name,
		advance_account_code: advanceAccount?.code,
		advance_account_name: advanceAccount?.name,
		cash_flow_name: cashFlow?.name
	}
}

function validateRequest(body: CashAdvanceRequest, existingUsed = 0): string | null {
	if (!isDate(body.date)) return 'Tanggal wajib diisi'
	if (!db.department.find((d) => d.id === Number(body.department_id) && !d.deleted_at)) return 'Departemen tidak valid'
	if (!String(body.recipient ?? '').trim()) return 'Penerima wajib diisi'
	const amount = Number(body.amount) || 0
	if (amount <= 0) return 'Nilai wajib diisi'
	if (amount < existingUsed) return `Nilai tidak boleh kurang dari nilai yang sudah terpakai (${existingUsed})`

	const cashAccount = db.account.find((a) => a.id === Number(body.cash_account_id) && !a.deleted_at)
	if (!cashAccount) return 'Akun kas/bank tidak valid'
	if (cashAccount.type !== 'cash_bank') return 'Akun kas/bank harus bertipe kas/bank'

	const advanceAccount = db.account.find((a) => a.id === Number(body.advance_account_id) && !a.deleted_at)
	if (!advanceAccount) return 'Akun uang muka tidak valid'
	if (advanceAccount.type !== 'asset') return 'Akun uang muka harus bertipe aset'

	if (body.cash_flow && !db.cashFlow.find((f) => f.code === body.cash_flow)) return 'Arus kas tidak valid'
	if (!body.attachment) return 'Lampiran wajib diunggah'
	return null
}

function buildRow(
	body: CashAdvanceRequest,
	base: Pick<CashAdvance, 'id' | 'number' | 'used' | 'status' | 'rejection_reason' | 'approved_by' | 'approved_at'>
): CashAdvance {
	const amount = Number(body.amount) || 0
	return {
		...base,
		date: body.date,
		department_id: Number(body.department_id),
		recipient: String(body.recipient).trim(),
		description: String(body.description ?? '').trim(),
		amount,
		remaining: amount - base.used,
		cash_account_id: Number(body.cash_account_id),
		advance_account_id: Number(body.advance_account_id),
		cash_flow: body.cash_flow || null,
		attachment: body.attachment
	}
}

function advanceNumber(date: string, seq: number): string {
	const d = new Date(date)
	const ym = Number.isNaN(d.getTime()) ? 'MOCK' : `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`
	return `UM-${ym}-${String(seq).padStart(3, '0')}`
}

function settlementNumber(date: string, seq: number): string {
	const d = new Date(date)
	const ym = Number.isNaN(d.getTime()) ? 'MOCK' : `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`
	return `PU-${ym}-${String(seq).padStart(3, '0')}`
}

// Chronological order (date then id) — the basis for the running "sisa setelah" balance.
function settlementsOf(cashAdvanceId: number): CashAdvanceSettlement[] {
	return db.cashAdvanceSettlement.filter((s) => s.cash_advance_id === cashAdvanceId).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
}

// Recompute the parent's used/remaining from its settlement rows (source of truth).
function recalcAdvance(advance: CashAdvance) {
	advance.used = settlementsOf(advance.id).reduce((sum, s) => sum + s.amount, 0)
	advance.remaining = advance.amount - advance.used
}

function withRemainingAfter(rows: CashAdvanceSettlement[], advanceAmount: number): CashAdvanceSettlement[] {
	let cumulative = 0
	return rows.map((row) => {
		cumulative += row.amount
		return { ...row, remaining_after: advanceAmount - cumulative }
	})
}

function validateSettlementRequest(body: CashAdvanceSettlementRequest, advance: CashAdvance, excludeId?: number): string | null {
	if (!isDate(body.date)) return 'Tanggal wajib diisi'
	const amount = Number(body.amount) || 0
	if (amount <= 0) return 'Nilai wajib diisi'
	const otherUsed = settlementsOf(advance.id)
		.filter((s) => s.id !== excludeId)
		.reduce((sum, s) => sum + s.amount, 0)
	const cap = advance.amount - otherUsed
	if (amount > cap) return `Nilai tidak boleh melebihi sisa uang muka (${cap})`
	if (!body.attachment) return 'Lampiran wajib diunggah'
	return null
}

// Contract: docs/cash-advance/
export function registerCashAdvance(mock: MockAdapter) {
	mock.onGet('/cash-advance').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = db.cashAdvance
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((a) => `${a.number} ${a.recipient} ${a.date} ${a.description}`.toLowerCase().includes(q))
		}
		if (p.approved === 'true') rows = rows.filter((a) => a.status === 'approved')
		else if (p.approved === 'false') rows = rows.filter((a) => a.status !== 'approved')
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows.map(resolve), p)]
	})

	mock.onGet(/\/cash-advance\/\d+$/).reply((config) => {
		const row = db.cashAdvance.find((r) => r.id === idOf(config.url))
		return row ? [200, { data: resolve(row) }] : [404, { message: 'Uang muka operasional tidak ditemukan' }]
	})

	mock.onPost('/cash-advance').reply((config) => {
		const body = JSON.parse(config.data) as CashAdvanceRequest
		const error = validateRequest(body)
		if (error) return [422, { message: error, errors: { amount: [error] } }]

		const seq = db.cashAdvance.length + 1
		const row = buildRow(body, {
			id: nextId(db.cashAdvance),
			number: advanceNumber(body.date, seq),
			used: 0,
			status: 'submitted',
			rejection_reason: null,
			approved_by: null,
			approved_at: null
		})
		db.cashAdvance.unshift(row)
		return [201, { data: resolve(row), message: 'Uang muka operasional diajukan' }]
	})

	mock.onPut(/\/cash-advance\/\d+$/).reply((config) => {
		const row = db.cashAdvance.find((r) => r.id === idOf(config.url))
		if (!row) return [404, { message: 'Uang muka operasional tidak ditemukan' }]
		if (row.status !== 'submitted') return [422, { message: 'Hanya uang muka submitted yang dapat diedit' }]
		const body = JSON.parse(config.data) as CashAdvanceRequest
		const error = validateRequest(body, row.used)
		if (error) return [422, { message: error, errors: { amount: [error] } }]

		Object.assign(
			row,
			buildRow(body, {
				id: row.id,
				number: row.number,
				used: row.used,
				status: 'submitted',
				rejection_reason: null,
				approved_by: null,
				approved_at: null
			})
		)
		return [200, { data: resolve(row), message: 'Uang muka operasional diperbarui' }]
	})

	mock.onDelete(/\/cash-advance\/\d+$/).reply((config) => {
		const index = db.cashAdvance.findIndex((r) => r.id === idOf(config.url))
		if (index === -1) return [404, { message: 'Uang muka operasional tidak ditemukan' }]
		if (db.cashAdvance[index].status !== 'submitted') return [422, { message: 'Hanya uang muka submitted yang dapat dihapus' }]
		db.cashAdvance.splice(index, 1)
		return [200, { message: 'Uang muka operasional dihapus' }]
	})

	mock.onPatch(/\/cash-advance\/\d+\/status$/).reply((config) => {
		const body = JSON.parse(config.data) as { status?: JournalStatus; date?: string }
		const row = db.cashAdvance.find((r) => r.id === statusIdOf(config.url))
		if (!row) return [404, { message: 'Uang muka operasional tidak ditemukan' }]
		if (!validStatus(body.status)) return [422, { message: 'Status uang muka tidak valid' }]

		const transitions: Record<JournalStatus, JournalStatus[]> = {
			submitted: ['approved', 'rejected'],
			approved: [],
			rejected: ['submitted']
		}
		if (!transitions[row.status].includes(body.status)) return [422, { message: 'Perubahan status uang muka tidak valid' }]

		if (body.status === 'approved') {
			if (body.date !== undefined && !isDate(body.date)) return [422, { message: 'Tanggal uang muka tidak valid' }]
			if (body.date) row.date = body.date
			row.approved_by = currentUserName()
			row.approved_at = new Date().toISOString()
		}
		if (body.status === 'submitted') {
			row.approved_by = null
			row.approved_at = null
		}

		row.status = body.status
		row.rejection_reason = body.status === 'rejected' ? 'Uang muka ditolak, silakan periksa kembali detailnya.' : null
		return [
			200,
			{
				data: resolve(row),
				message:
					body.status === 'approved'
						? 'Uang muka operasional disetujui'
						: body.status === 'rejected'
							? 'Uang muka operasional ditolak'
							: 'Uang muka operasional diajukan'
			}
		]
	})

	mock.onGet(/\/cash-advance\/\d+\/settlement$/).reply((config) => {
		const advance = db.cashAdvance.find((r) => r.id === settlementListAdvanceIdOf(config.url))
		if (!advance) return [404, { message: 'Uang muka operasional tidak ditemukan' }]
		return [200, { data: withRemainingAfter(settlementsOf(advance.id), advance.amount) }]
	})

	mock.onPost(/\/cash-advance\/\d+\/settlement$/).reply((config) => {
		const advance = db.cashAdvance.find((r) => r.id === settlementListAdvanceIdOf(config.url))
		if (!advance) return [404, { message: 'Uang muka operasional tidak ditemukan' }]
		if (advance.status !== 'approved') return [422, { message: 'Penyelesaian hanya dapat ditambahkan untuk uang muka yang sudah disetujui' }]

		const body = JSON.parse(config.data) as CashAdvanceSettlementRequest
		const error = validateSettlementRequest(body, advance)
		if (error) return [422, { message: error, errors: { amount: [error] } }]

		const seq = db.cashAdvanceSettlement.length + 1
		const row: CashAdvanceSettlement = {
			id: nextId(db.cashAdvanceSettlement),
			cash_advance_id: advance.id,
			number: settlementNumber(body.date, seq),
			date: body.date,
			amount: Number(body.amount) || 0,
			remaining_after: 0,
			attachment: body.attachment
		}
		db.cashAdvanceSettlement.push(row)
		recalcAdvance(advance)
		const saved = withRemainingAfter(settlementsOf(advance.id), advance.amount).find((s) => s.id === row.id)
		return [201, { data: saved, message: 'Penyelesaian uang muka ditambahkan' }]
	})

	mock.onPut(/\/cash-advance\/\d+\/settlement\/\d+$/).reply((config) => {
		const advance = db.cashAdvance.find((r) => r.id === settlementAdvanceIdOf(config.url))
		if (!advance) return [404, { message: 'Uang muka operasional tidak ditemukan' }]
		const row = db.cashAdvanceSettlement.find((s) => s.id === settlementIdOf(config.url) && s.cash_advance_id === advance.id)
		if (!row) return [404, { message: 'Penyelesaian tidak ditemukan' }]
		if (advance.status !== 'approved') return [422, { message: 'Penyelesaian hanya dapat diubah untuk uang muka yang sudah disetujui' }]

		const body = JSON.parse(config.data) as CashAdvanceSettlementRequest
		const error = validateSettlementRequest(body, advance, row.id)
		if (error) return [422, { message: error, errors: { amount: [error] } }]

		row.date = body.date
		row.amount = Number(body.amount) || 0
		row.attachment = body.attachment
		recalcAdvance(advance)
		const saved = withRemainingAfter(settlementsOf(advance.id), advance.amount).find((s) => s.id === row.id)
		return [200, { data: saved, message: 'Penyelesaian uang muka diperbarui' }]
	})

	mock.onDelete(/\/cash-advance\/\d+\/settlement\/\d+$/).reply((config) => {
		const advance = db.cashAdvance.find((r) => r.id === settlementAdvanceIdOf(config.url))
		if (!advance) return [404, { message: 'Uang muka operasional tidak ditemukan' }]
		const index = db.cashAdvanceSettlement.findIndex((s) => s.id === settlementIdOf(config.url) && s.cash_advance_id === advance.id)
		if (index === -1) return [404, { message: 'Penyelesaian tidak ditemukan' }]
		if (advance.status !== 'approved') return [422, { message: 'Penyelesaian hanya dapat dihapus untuk uang muka yang sudah disetujui' }]

		db.cashAdvanceSettlement.splice(index, 1)
		recalcAdvance(advance)
		return [200, { message: 'Penyelesaian uang muka dihapus' }]
	})
}
