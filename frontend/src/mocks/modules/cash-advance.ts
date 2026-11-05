import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, summarize, type ListParams } from '../lib'
import {
	diffFields,
	fmtCount,
	fmtDate,
	fmtMoney,
	purgeHistory,
	recordHistory,
	recordStatusChange,
	recordUpdate,
	registerHistoryRoute,
	type FieldSpec
} from '../history'
import type { CashAdvance, CashAdvanceSettlement, JournalStatus } from '@/utils/types'

type CashAdvanceSettlementRequest = Pick<CashAdvanceSettlement, 'date' | 'description' | 'attachments' | 'lines'>

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
	| 'created_by'
	| 'created_at'
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
	if (!String(body.voucher ?? '').trim()) return 'Nomor voucher wajib diisi'
	if (!db.department.find((d) => d.id === Number(body.department_id) && !d.deleted_at)) return 'Departemen tidak valid'
	if (!String(body.recipient ?? '').trim()) return 'Penerima wajib diisi'
	const amount = Number(body.amount) || 0
	if (amount <= 0) return 'Nominal wajib diisi'
	if (amount < existingUsed) return `Nominal tidak boleh kurang dari nominal yang sudah terpakai (${existingUsed})`

	const cashAccount = db.account.find((a) => a.id === Number(body.cash_account_id) && !a.deleted_at)
	if (!cashAccount) return 'Akun kas/bank tidak valid'
	if (cashAccount.type !== 'cash_bank') return 'Akun kas/bank harus bertipe kas/bank'

	const advanceAccount = db.account.find((a) => a.id === Number(body.advance_account_id) && !a.deleted_at)
	if (!advanceAccount) return 'Akun uang muka tidak valid'
	if (advanceAccount.type !== 'asset') return 'Akun uang muka harus bertipe aset'

	if (body.cash_flow && !db.cashFlow.find((f) => f.code === body.cash_flow)) return 'Arus kas tidak valid'
	if (!Array.isArray(body.attachments) || !body.attachments.length) return 'Lampiran wajib diunggah'
	if (body.attachments.length > 5) return 'Maksimal 5 lampiran'
	return null
}

function buildRow(
	body: CashAdvanceRequest,
	base: Pick<CashAdvance, 'id' | 'number' | 'created_by' | 'created_at' | 'used' | 'status' | 'rejection_reason' | 'approved_by' | 'approved_at'>
): CashAdvance {
	const amount = Number(body.amount) || 0
	return {
		...base,
		voucher: String(body.voucher).trim(),
		date: body.date,
		department_id: Number(body.department_id),
		recipient: String(body.recipient).trim(),
		description: String(body.description ?? '').trim(),
		amount,
		remaining: amount - base.used,
		cash_account_id: Number(body.cash_account_id),
		advance_account_id: Number(body.advance_account_id),
		cash_flow: body.cash_flow || null,
		attachments: body.attachments
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

// Re-resolve the denormalized account / department / cash-flow labels of every settlement line.
function resolveLines(lines: CashAdvanceSettlement['lines']): CashAdvanceSettlement['lines'] {
	return lines.map((line) => {
		const account = db.account.find((a) => a.id === Number(line.account_id))
		const department = line.department_id ? db.department.find((d) => d.id === Number(line.department_id)) : undefined
		const flow = line.cash_flow ? db.cashFlow.find((f) => f.code === line.cash_flow) : undefined
		return {
			...line,
			account_code: account?.code,
			account_name: account?.name,
			department_code: department?.code,
			department_name: department?.name,
			cash_flow_name: flow?.name
		}
	})
}

function withRemainingAfter(rows: CashAdvanceSettlement[], advanceAmount: number): CashAdvanceSettlement[] {
	let cumulative = 0
	return rows.map((row) => {
		cumulative += row.amount
		return { ...row, lines: resolveLines(row.lines), remaining_after: advanceAmount - cumulative }
	})
}

const lineTotal = (lines: CashAdvanceSettlement['lines']) => lines.reduce((sum, l) => sum + (Number(l.debit) || 0) - (Number(l.credit) || 0), 0)

function validateSettlementRequest(body: CashAdvanceSettlementRequest, advance: CashAdvance, excludeId?: number): string | null {
	if (!isDate(body.date)) return 'Tanggal wajib diisi'
	if (!Array.isArray(body.lines) || !body.lines.length) return 'Minimal satu detail biaya harus ditambahkan'
	for (const line of body.lines) {
		const account = db.account.find((a) => a.id === Number(line.account_id) && !a.deleted_at)
		if (!account) return 'Akun perkiraan tidak valid'
		if (!db.department.find((d) => d.id === Number(line.department_id) && !d.deleted_at)) return 'Departemen wajib dipilih'
		if (line.cash_flow && !db.cashFlow.find((f) => f.code === line.cash_flow)) return 'Arus kas tidak valid'
		const debit = Number(line.debit) || 0
		const credit = Number(line.credit) || 0
		if (debit < 0 || credit < 0) return 'Nominal tidak boleh negatif'
		if (debit > 0 === credit > 0) return 'Setiap detail biaya harus berisi debit atau kredit saja'
	}
	const amount = lineTotal(body.lines)
	if (amount <= 0) return 'Total debit harus lebih besar dari total kredit'
	const otherUsed = settlementsOf(advance.id)
		.filter((s) => s.id !== excludeId)
		.reduce((sum, s) => sum + s.amount, 0)
	const cap = advance.amount - otherUsed
	if (amount > cap) return `Total biaya tidak boleh melebihi sisa uang muka (${cap})`
	if (!Array.isArray(body.attachments) || !body.attachments.length) return 'Lampiran wajib diunggah'
	if (body.attachments.length > 10) return 'Maksimal 10 lampiran'
	return null
}

const FIELDS: FieldSpec<CashAdvance>[] = [
	{ key: 'date', label: 'Tanggal', format: fmtDate },
	{ key: 'voucher', label: 'Voucher' },
	{ key: 'department_name', label: 'Departemen' },
	{ key: 'recipient', label: 'Penerima' },
	{ key: 'amount', label: 'Nominal', format: fmtMoney },
	{ key: 'cash_account_name', label: 'Sumber Dana (Kas / Bank)' },
	{ key: 'advance_account_name', label: 'Akun Uang Muka' },
	{ key: 'cash_flow_name', label: 'Arus Kas' },
	{ key: 'description', label: 'Keterangan' },
	{ key: 'attachments', label: 'Lampiran', format: fmtCount('file') }
]
const SETTLEMENT_FIELDS: FieldSpec<Pick<CashAdvanceSettlement, 'date' | 'amount' | 'description'>>[] = [
	{ key: 'date', label: 'Tanggal Penyelesaian', format: fmtDate },
	{ key: 'amount', label: 'Nominal Penyelesaian', format: fmtMoney },
	{ key: 'description', label: 'Keterangan' }
]

// Contract: docs/cash-advance/
export function registerCashAdvance(mock: MockAdapter) {
	registerHistoryRoute(mock, 'cash-advance', (id) => db.cashAdvance.some((r) => r.id === id), 'Uang muka operasional tidak ditemukan')

	mock.onGet('/cash-advance').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = db.cashAdvance
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((a) => `${a.number} ${a.voucher} ${a.recipient} ${a.date} ${a.description}`.toLowerCase().includes(q))
		}
		// KPI tiles: honour search, ignore the status filter below (docs/conventions.md).
		const summary = summarize(
			rows,
			{ pending: (a) => a.status === 'submitted', approved: (a) => a.status === 'approved', rejected: (a) => a.status === 'rejected' },
			(a) => a.amount,
			['pending', 'approved']
		)
		if (p.status) rows = rows.filter((a) => a.status === p.status)
		rows = sortBy(rows, p.sort_by, p.sort_order)
		const page = paginate(rows.map(resolve), p)
		return [200, { data: page.data, meta: { ...page.meta, summary } }]
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
			created_by: currentUserName(),
			created_at: new Date().toISOString(),
			used: 0,
			status: 'submitted',
			rejection_reason: null,
			approved_by: null,
			approved_at: null
		})
		db.cashAdvance.unshift(row)
		recordHistory('cash-advance', row.id, { title: 'Dibuat', kind: 'created' })
		return [201, { data: resolve(row), message: 'Uang muka operasional diajukan' }]
	})

	mock.onPut(/\/cash-advance\/\d+$/).reply((config) => {
		const row = db.cashAdvance.find((r) => r.id === idOf(config.url))
		if (!row) return [404, { message: 'Uang muka operasional tidak ditemukan' }]
		if (row.status !== 'submitted') return [422, { message: 'Hanya uang muka submitted yang dapat diedit' }]
		const body = JSON.parse(config.data) as CashAdvanceRequest
		const error = validateRequest(body, row.used)
		if (error) return [422, { message: error, errors: { amount: [error] } }]

		const before = resolve(row)
		Object.assign(
			row,
			buildRow(body, {
				id: row.id,
				number: row.number,
				created_by: row.created_by,
				created_at: row.created_at,
				used: row.used,
				status: 'submitted',
				rejection_reason: null,
				approved_by: null,
				approved_at: null
			})
		)
		const after = resolve(row)
		recordUpdate('cash-advance', row.id, diffFields(before, after, FIELDS))
		return [200, { data: after, message: 'Uang muka operasional diperbarui' }]
	})

	mock.onDelete(/\/cash-advance\/\d+$/).reply((config) => {
		const index = db.cashAdvance.findIndex((r) => r.id === idOf(config.url))
		if (index === -1) return [404, { message: 'Uang muka operasional tidak ditemukan' }]
		if (db.cashAdvance[index].status !== 'submitted') return [422, { message: 'Hanya uang muka submitted yang dapat dihapus' }]
		const [removed] = db.cashAdvance.splice(index, 1)
		purgeHistory('cash-advance', removed.id)
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
		recordStatusChange('cash-advance', row.id, body.status, row.rejection_reason)
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
		if (error) return [422, { message: error, errors: { lines: [error] } }]

		const seq = db.cashAdvanceSettlement.length + 1
		const row: CashAdvanceSettlement = {
			id: nextId(db.cashAdvanceSettlement),
			cash_advance_id: advance.id,
			number: settlementNumber(body.date, seq),
			created_by: currentUserName(),
			date: body.date,
			description: String(body.description ?? '').trim(),
			attachments: body.attachments,
			lines: body.lines,
			amount: lineTotal(body.lines),
			remaining_after: 0
		}
		db.cashAdvanceSettlement.push(row)
		recalcAdvance(advance)
		recordHistory('cash-advance', advance.id, {
			title: 'Penyelesaian Ditambahkan',
			kind: 'info',
			summary: `${row.number} · Rp ${fmtMoney(row.amount)}`
		})
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
		if (error) return [422, { message: error, errors: { lines: [error] } }]

		const beforeSettlement = { date: row.date, amount: row.amount, description: row.description }
		row.date = body.date
		row.description = String(body.description ?? '').trim()
		row.attachments = body.attachments
		row.lines = body.lines
		row.amount = lineTotal(body.lines)
		recalcAdvance(advance)
		recordHistory('cash-advance', advance.id, {
			title: 'Penyelesaian Diubah',
			kind: 'info',
			summary: row.number,
			changes: diffFields(beforeSettlement, row, SETTLEMENT_FIELDS)
		})
		const saved = withRemainingAfter(settlementsOf(advance.id), advance.amount).find((s) => s.id === row.id)
		return [200, { data: saved, message: 'Penyelesaian uang muka diperbarui' }]
	})

	mock.onDelete(/\/cash-advance\/\d+\/settlement\/\d+$/).reply((config) => {
		const advance = db.cashAdvance.find((r) => r.id === settlementAdvanceIdOf(config.url))
		if (!advance) return [404, { message: 'Uang muka operasional tidak ditemukan' }]
		const index = db.cashAdvanceSettlement.findIndex((s) => s.id === settlementIdOf(config.url) && s.cash_advance_id === advance.id)
		if (index === -1) return [404, { message: 'Penyelesaian tidak ditemukan' }]
		if (advance.status !== 'approved') return [422, { message: 'Penyelesaian hanya dapat dihapus untuk uang muka yang sudah disetujui' }]

		const [removedSettlement] = db.cashAdvanceSettlement.splice(index, 1)
		recalcAdvance(advance)
		recordHistory('cash-advance', advance.id, {
			title: 'Penyelesaian Dihapus',
			kind: 'info',
			summary: `${removedSettlement.number} · Rp ${fmtMoney(removedSettlement.amount)}`
		})
		return [200, { message: 'Penyelesaian uang muka dihapus' }]
	})
}
