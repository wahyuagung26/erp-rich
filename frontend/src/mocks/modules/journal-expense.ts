import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import type { JournalExpense, JournalExpenseLine, JournalStatus } from '@/utils/types'

type JournalExpenseRequest = Omit<
	JournalExpense,
	| 'id'
	| 'number'
	| 'total'
	| 'cash_out'
	| 'status'
	| 'rejection_reason'
	| 'approved_by'
	| 'approved_at'
	| 'cash_account_code'
	| 'cash_account_name'
	| 'department_code'
	| 'department_name'
	| 'cash_flow_name'
> & { number?: string }

const idOf = (url?: string) => Number(url?.split('/').at(-1))
const statusIdOf = (url?: string) => Number(url?.split('/').at(-2))
const validStatus = (value: unknown): value is JournalStatus => ['submitted', 'approved', 'rejected'].includes(String(value))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))

function currentUserName(): string {
	try {
		return JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin'
	} catch {
		return 'Admin'
	}
}

function lineOf(line: JournalExpenseLine): JournalExpenseLine {
	const account = db.account.find((a) => a.id === Number(line.account_id) && !a.deleted_at)
	const department = db.department.find((d) => d.id === Number(line.department_id) && !d.deleted_at)
	return {
		account_id: Number(line.account_id),
		account_code: account?.code,
		account_name: account?.name,
		department_id: line.department_id ? Number(line.department_id) : null,
		department_code: department?.code,
		department_name: department?.name,
		detail_description: String(line.detail_description ?? '').trim(),
		debit: Number(line.debit) || 0,
		credit: Number(line.credit) || 0
	}
}

// Re-resolve every denormalized label from the current db state.
function resolve(row: JournalExpense): JournalExpense {
	const cashAccount = db.account.find((a) => a.id === Number(row.cash_account_id) && !a.deleted_at)
	const department = db.department.find((d) => d.id === Number(row.department_id) && !d.deleted_at)
	const cashFlow = db.cashFlow.find((f) => f.code === row.cash_flow)
	return {
		...row,
		cash_account_code: cashAccount?.code,
		cash_account_name: cashAccount?.name,
		department_code: department?.code,
		department_name: department?.name,
		cash_flow_name: cashFlow?.name,
		lines: row.lines.map(lineOf)
	}
}

function validateRequest(body: JournalExpenseRequest): string | null {
	if (!String(body.voucher ?? '').trim()) return 'Voucher wajib diisi'
	if (!String(body.description ?? '').trim()) return 'Keterangan wajib diisi'
	if (!body.attachment) return 'Lampiran wajib diunggah'

	const cashAccount = db.account.find((a) => a.id === Number(body.cash_account_id) && !a.deleted_at)
	if (!cashAccount) return 'Akun kas/bank tidak valid'
	if (cashAccount.type !== 'cash_bank') return 'Akun header harus bertipe kas/bank'
	if (!db.department.find((d) => d.id === Number(body.department_id) && !d.deleted_at)) return 'Departemen tidak valid'
	if (!db.cashFlow.find((f) => f.code === body.cash_flow)) return 'Arus kas wajib diisi'

	if (!Array.isArray(body.lines) || body.lines.length < 1) return 'Minimal satu detail jurnal'
	for (const line of body.lines) {
		if (!db.account.find((a) => a.id === Number(line.account_id) && !a.deleted_at)) return 'Akun perkiraan tidak valid'
		const debit = Number(line.debit) || 0
		const credit = Number(line.credit) || 0
		if (debit < 0 || credit < 0 || (debit > 0 && credit > 0)) return 'Debit dan kredit tidak valid'
		if (debit === 0 && credit === 0) return 'Debit atau kredit wajib diisi'
	}
	const totalDebit = body.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0)
	const totalCredit = body.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0)
	if (totalDebit - totalCredit <= 0) return 'Total beban harus lebih besar dari total potongan'
	return null
}

function buildRow(
	body: JournalExpenseRequest,
	base: Pick<JournalExpense, 'id' | 'number' | 'status' | 'rejection_reason' | 'approved_by' | 'approved_at'>
): JournalExpense {
	const lines = body.lines.map(lineOf)
	const total = lines.reduce((sum, l) => sum + l.debit, 0)
	const cashOut = total - lines.reduce((sum, l) => sum + l.credit, 0)
	return {
		...base,
		date: body.date,
		voucher: body.voucher.trim(),
		description: body.description.trim(),
		attachment: body.attachment,
		cash_account_id: Number(body.cash_account_id),
		department_id: Number(body.department_id),
		cash_flow: String(body.cash_flow),
		lines,
		total,
		cash_out: cashOut
	}
}

function journalNumber(date: string, seq: number): string {
	const d = new Date(date)
	const ym = Number.isNaN(d.getTime()) ? 'MOCK' : `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`
	return `JK-${ym}-${String(seq).padStart(3, '0')}`
}

// Contract: docs/journal-expense/
export function registerJournalExpense(mock: MockAdapter) {
	mock.onGet('/journal-expense').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = db.journalExpense
		if (p.q) rows = rows.filter((j) => `${j.number} ${j.voucher} ${j.description}`.toLowerCase().includes(String(p.q).toLowerCase()))
		if (p.status) rows = rows.filter((j) => j.status === p.status)
		if (p.date_from) rows = rows.filter((j) => j.date >= String(p.date_from))
		if (p.date_to) rows = rows.filter((j) => j.date <= String(p.date_to))
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows.map(resolve), p)]
	})

	mock.onGet(/\/journal-expense\/\d+$/).reply((config) => {
		const row = db.journalExpense.find((r) => r.id === idOf(config.url))
		return row ? [200, { data: resolve(row) }] : [404, { message: 'Jurnal pengeluaran tidak ditemukan' }]
	})

	mock.onPost('/journal-expense').reply((config) => {
		const body = JSON.parse(config.data) as JournalExpenseRequest
		const error = validateRequest(body)
		if (error) return [422, { message: error, errors: { lines: [error] } }]

		const seq = db.journalExpense.length + 1
		const row = buildRow(body, {
			id: nextId(db.journalExpense),
			number: String(body.number ?? '').trim() || journalNumber(body.date, seq),
			status: 'submitted',
			rejection_reason: null,
			approved_by: null,
			approved_at: null
		})
		db.journalExpense.unshift(row)
		return [201, { data: resolve(row), message: 'Jurnal pengeluaran diajukan' }]
	})

	mock.onPut(/\/journal-expense\/\d+$/).reply((config) => {
		const row = db.journalExpense.find((r) => r.id === idOf(config.url))
		if (!row) return [404, { message: 'Jurnal pengeluaran tidak ditemukan' }]
		if (row.status !== 'submitted') return [422, { message: 'Hanya jurnal submitted yang dapat diedit' }]
		const body = JSON.parse(config.data) as JournalExpenseRequest
		const error = validateRequest(body)
		if (error) return [422, { message: error, errors: { lines: [error] } }]

		Object.assign(
			row,
			buildRow(body, {
				id: row.id,
				number: String(body.number ?? '').trim() || row.number,
				status: 'submitted',
				rejection_reason: null,
				approved_by: null,
				approved_at: null
			})
		)
		return [200, { data: resolve(row), message: 'Jurnal pengeluaran diperbarui' }]
	})

	mock.onDelete(/\/journal-expense\/\d+$/).reply((config) => {
		const index = db.journalExpense.findIndex((r) => r.id === idOf(config.url))
		if (index === -1) return [404, { message: 'Jurnal pengeluaran tidak ditemukan' }]
		if (db.journalExpense[index].status !== 'submitted') return [422, { message: 'Hanya jurnal submitted yang dapat dihapus' }]
		db.journalExpense.splice(index, 1)
		return [200, { message: 'Jurnal pengeluaran dihapus' }]
	})

	mock.onPatch(/\/journal-expense\/\d+\/status$/).reply((config) => {
		const body = JSON.parse(config.data) as { status?: JournalStatus; date?: string }
		const row = db.journalExpense.find((r) => r.id === statusIdOf(config.url))
		if (!row) return [404, { message: 'Jurnal pengeluaran tidak ditemukan' }]
		if (!validStatus(body.status)) return [422, { message: 'Status jurnal tidak valid' }]

		const transitions: Record<JournalStatus, JournalStatus[]> = {
			submitted: ['approved', 'rejected'],
			approved: [],
			rejected: ['submitted']
		}
		if (!transitions[row.status].includes(body.status)) return [422, { message: 'Perubahan status jurnal tidak valid' }]

		if (body.status === 'approved') {
			if (body.date !== undefined && !isDate(body.date)) return [422, { message: 'Tanggal jurnal tidak valid' }]
			if (body.date) row.date = body.date
			row.approved_by = currentUserName()
			row.approved_at = new Date().toISOString()
		}
		if (body.status === 'submitted') {
			row.approved_by = null
			row.approved_at = null
		}

		row.status = body.status
		row.rejection_reason = body.status === 'rejected' ? 'Jurnal ditolak, silakan periksa kembali detailnya.' : null
		return [
			200,
			{
				data: resolve(row),
				message:
					body.status === 'approved'
						? 'Jurnal pengeluaran disetujui'
						: body.status === 'rejected'
							? 'Jurnal pengeluaran ditolak'
							: 'Jurnal pengeluaran diajukan'
			}
		]
	})
}
