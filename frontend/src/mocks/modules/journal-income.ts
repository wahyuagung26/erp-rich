import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import type { JournalIncome, JournalIncomeLine, JournalStatus } from '@/utils/types'

type JournalIncomeRequest = Omit<
	JournalIncome,
	| 'id'
	| 'number'
	| 'total'
	| 'cash_in'
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

function lineOf(line: JournalIncomeLine): JournalIncomeLine {
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
function resolve(row: JournalIncome): JournalIncome {
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

function validateRequest(body: JournalIncomeRequest): string | null {
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
		if (Number(line.debit) > 0) return 'Baris pemasukan hanya boleh mengisi kredit'
		if (!(Number(line.credit) > 0)) return 'Setiap baris wajib mengisi kredit'
	}
	if (body.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0) <= 0) return 'Total pemasukan harus lebih dari nol'
	return null
}

function buildRow(
	body: JournalIncomeRequest,
	base: Pick<JournalIncome, 'id' | 'number' | 'status' | 'rejection_reason' | 'approved_by' | 'approved_at'>
): JournalIncome {
	// Income lines are credit-only; the cash/bank account is debited with the total.
	const lines = body.lines.map((line) => ({ ...lineOf(line), debit: 0 }))
	const total = lines.reduce((sum, l) => sum + l.credit, 0)
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
		cash_in: total
	}
}

function journalNumber(date: string, seq: number): string {
	const d = new Date(date)
	const ym = Number.isNaN(d.getTime()) ? 'MOCK' : `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`
	return `JM-${ym}-${String(seq).padStart(3, '0')}`
}

// Contract: docs/journal-income/
export function registerJournalIncome(mock: MockAdapter) {
	mock.onGet('/journal-income').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = db.journalIncome
		if (p.q) rows = rows.filter((j) => `${j.number} ${j.voucher} ${j.description}`.toLowerCase().includes(String(p.q).toLowerCase()))
		if (p.status) rows = rows.filter((j) => j.status === p.status)
		if (p.date_from) rows = rows.filter((j) => j.date >= String(p.date_from))
		if (p.date_to) rows = rows.filter((j) => j.date <= String(p.date_to))
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows.map(resolve), p)]
	})

	mock.onGet(/\/journal-income\/\d+$/).reply((config) => {
		const row = db.journalIncome.find((r) => r.id === idOf(config.url))
		return row ? [200, { data: resolve(row) }] : [404, { message: 'Jurnal pemasukan tidak ditemukan' }]
	})

	mock.onPost('/journal-income').reply((config) => {
		const body = JSON.parse(config.data) as JournalIncomeRequest
		const error = validateRequest(body)
		if (error) return [422, { message: error, errors: { lines: [error] } }]

		const seq = db.journalIncome.length + 1
		const row = buildRow(body, {
			id: nextId(db.journalIncome),
			number: String(body.number ?? '').trim() || journalNumber(body.date, seq),
			status: 'submitted',
			rejection_reason: null,
			approved_by: null,
			approved_at: null
		})
		db.journalIncome.unshift(row)
		return [201, { data: resolve(row), message: 'Jurnal pemasukan diajukan' }]
	})

	mock.onPut(/\/journal-income\/\d+$/).reply((config) => {
		const row = db.journalIncome.find((r) => r.id === idOf(config.url))
		if (!row) return [404, { message: 'Jurnal pemasukan tidak ditemukan' }]
		if (row.status !== 'submitted') return [422, { message: 'Hanya jurnal submitted yang dapat diedit' }]
		const body = JSON.parse(config.data) as JournalIncomeRequest
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
		return [200, { data: resolve(row), message: 'Jurnal pemasukan diperbarui' }]
	})

	mock.onDelete(/\/journal-income\/\d+$/).reply((config) => {
		const index = db.journalIncome.findIndex((r) => r.id === idOf(config.url))
		if (index === -1) return [404, { message: 'Jurnal pemasukan tidak ditemukan' }]
		if (db.journalIncome[index].status !== 'submitted') return [422, { message: 'Hanya jurnal submitted yang dapat dihapus' }]
		db.journalIncome.splice(index, 1)
		return [200, { message: 'Jurnal pemasukan dihapus' }]
	})

	mock.onPatch(/\/journal-income\/\d+\/status$/).reply((config) => {
		const body = JSON.parse(config.data) as { status?: JournalStatus; date?: string }
		const row = db.journalIncome.find((r) => r.id === statusIdOf(config.url))
		if (!row) return [404, { message: 'Jurnal pemasukan tidak ditemukan' }]
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
						? 'Jurnal pemasukan disetujui'
						: body.status === 'rejected'
							? 'Jurnal pemasukan ditolak'
							: 'Jurnal pemasukan diajukan'
			}
		]
	})
}
