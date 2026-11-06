import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { companyCode, customerDepositNumber } from '../numbering'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import { diffFields, fmtDate, fmtMoney, purgeHistory, recordHistory, recordUpdate, registerHistoryRoute, type FieldSpec } from '../history'
import { closedReply, withLock, closedDateReply } from './posting'
import type { CustomerDeposit, CustomerDepositUsage } from '@/utils/types'

type CustomerDepositRequest = Omit<
	CustomerDeposit,
	| 'id'
	| 'number'
	| 'used'
	| 'remaining'
	| 'last_invoice_number'
	| 'department_code'
	| 'department_name'
	| 'customer_code'
	| 'customer_name'
	| 'cash_account_code'
	| 'cash_account_name'
	| 'cash_flow_name'
>

const idOf = (url?: string) => Number(url?.split('/').at(-1))
const usageDepositIdOf = (url?: string) => Number(url?.split('/').at(-2))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))

// Chronological usage rows (date then id) — the basis for the running balance.
function usagesOf(depositId: number): CustomerDepositUsage[] {
	return db.customerDepositUsage.filter((u) => u.customer_deposit_id === depositId).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
}

// Re-resolve every denormalized label AND recompute used/remaining/last_invoice_number
// from the usage rows (single source of truth — totals are never stored).
export function resolve(row: CustomerDeposit): CustomerDeposit {
	const department = db.department.find((d) => d.id === Number(row.department_id) && !d.deleted_at)
	const customer = db.customer.find((c) => c.id === Number(row.customer_id) && !c.deleted_at)
	const cashAccount = db.account.find((a) => a.id === Number(row.cash_account_id) && !a.deleted_at)
	const cashFlow = row.cash_flow ? db.cashFlow.find((f) => f.code === row.cash_flow) : undefined
	const usages = usagesOf(row.id)
	const used = usages.reduce((sum, u) => sum + u.amount, 0)
	return {
		...row,
		department_code: department?.code,
		department_name: department?.name,
		customer_code: customer?.code,
		customer_name: customer?.name,
		cash_account_code: cashAccount?.code,
		cash_account_name: cashAccount?.name,
		cash_flow_name: cashFlow?.name,
		used,
		remaining: row.amount - used,
		last_invoice_number: usages[usages.length - 1]?.invoice_number ?? null
	}
}

// Field-level validation; `used` is the amount already applied to invoices (0 on create).
function validateRequest(body: CustomerDepositRequest, used: number, lockedCustomerId?: number): Record<string, string[]> | null {
	const errors: Record<string, string[]> = {}
	if (!isDate(body.date)) errors.date = ['Tanggal wajib diisi']
	if (!db.department.find((d) => d.id === Number(body.department_id) && !d.deleted_at)) errors.department_id = ['Departemen tidak valid']
	if (!db.customer.find((c) => c.id === Number(body.customer_id) && !c.deleted_at)) errors.customer_id = ['Customer tidak valid']
	else if (lockedCustomerId && Number(body.customer_id) !== lockedCustomerId)
		errors.customer_id = ['Customer tidak boleh diubah karena titipan sudah dipakai di Invoice Penjualan']
	const amount = Number(body.amount) || 0
	if (amount <= 0) errors.amount = ['Nominal wajib diisi']
	else if (amount < used) errors.amount = ['Nominal tidak boleh kurang dari yang sudah dipakai (' + used.toLocaleString('id-ID') + ')']

	const cashAccount = db.account.find((a) => a.id === Number(body.cash_account_id) && !a.deleted_at)
	if (!cashAccount) errors.cash_account_id = ['Akun kas/bank tidak valid']
	else if (cashAccount.type !== 'cash_bank') errors.cash_account_id = ['Akun kas/bank harus bertipe kas/bank']

	if (body.cash_flow && !db.cashFlow.find((f) => f.code === body.cash_flow)) errors.cash_flow = ['Arus kas tidak valid']
	if (!body.attachment) errors.attachment = ['Lampiran wajib diunggah']
	return Object.keys(errors).length ? errors : null
}

function buildRow(body: CustomerDepositRequest, base: Pick<CustomerDeposit, 'id' | 'number'>): CustomerDeposit {
	const amount = Number(body.amount) || 0
	return {
		...base,
		date: body.date,
		department_id: Number(body.department_id),
		customer_id: Number(body.customer_id),
		amount,
		used: 0,
		remaining: amount,
		last_invoice_number: null,
		description: String(body.description ?? '').trim(),
		cash_account_id: Number(body.cash_account_id),
		cash_flow: body.cash_flow || null,
		attachment: body.attachment
	}
}

const FIELDS: FieldSpec<CustomerDeposit>[] = [
	{ key: 'date', label: 'Tanggal', format: fmtDate },
	{ key: 'department_name', label: 'Departemen' },
	{ key: 'customer_name', label: 'Customer' },
	{ key: 'amount', label: 'Nominal', format: fmtMoney },
	{ key: 'cash_account_name', label: 'Akun Kas / Bank' },
	{ key: 'cash_flow_name', label: 'Arus Kas' },
	{ key: 'description', label: 'Keterangan' },
	{ key: 'attachment', label: 'Lampiran', format: (file) => (file as CustomerDeposit['attachment'])?.name ?? '–' }
]

// Contract: docs/customer-deposit/
export function registerCustomerDeposit(mock: MockAdapter) {
	registerHistoryRoute(mock, 'customer-deposit', (id) => db.customerDeposit.some((item) => item.id === id), 'Titipan customer tidak ditemukan')

	mock.onGet('/customer-deposit').reply((config) => {
		const p = (config.params ?? {}) as ListParams & {
			date_from?: string
			date_to?: string
			customer_id?: string | number
			has_balance?: string | number
		}
		let rows = db.customerDeposit.map((item) => withLock(config, resolve(item)))
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((d) => [d.number, d.customer_code, d.customer_name, d.date, d.description].join(' ').toLowerCase().includes(q))
		}
		if (p.customer_id) rows = rows.filter((d) => d.customer_id === Number(p.customer_id))
		if (p.has_balance) rows = rows.filter((d) => d.remaining > 0)
		if (p.date_from) rows = rows.filter((d) => d.date >= String(p.date_from))
		if (p.date_to) rows = rows.filter((d) => d.date <= String(p.date_to))
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/customer-deposit\/\d+\/usage$/).reply((config) => {
		const row = db.customerDeposit.find((r) => r.id === usageDepositIdOf(config.url))
		if (!row) return [404, { message: 'Titipan customer tidak ditemukan' }]
		return [200, { data: usagesOf(row.id) }]
	})

	mock.onGet(/\/customer-deposit\/\d+$/).reply((config) => {
		const row = db.customerDeposit.find((r) => r.id === idOf(config.url))
		return row ? [200, { data: withLock(config, resolve(row)) }] : [404, { message: 'Titipan customer tidak ditemukan' }]
	})

	mock.onPost('/customer-deposit').reply((config) => {
		const body = JSON.parse(config.data) as CustomerDepositRequest
		const closedDate = closedDateReply(config, body.date)
		if (closedDate) return closedDate
		const errors = validateRequest(body, 0)
		if (errors) return [422, { message: 'Validasi gagal', errors }]

		const row = buildRow(body, {
			id: nextId(db.customerDeposit),
			number: customerDepositNumber(
				companyCode(config),
				body.date,
				db.customerDeposit.map((item) => item.number)
			)
		})
		db.customerDeposit.unshift(row)
		recordHistory('customer-deposit', row.id, { title: 'Dibuat', kind: 'created' })
		return [201, { data: resolve(row), message: 'Titipan customer ditambahkan' }]
	})

	mock.onPut(/\/customer-deposit\/\d+$/).reply((config) => {
		const row = db.customerDeposit.find((r) => r.id === idOf(config.url))
		if (!row) return [404, { message: 'Titipan customer tidak ditemukan' }]
		const closed = closedReply(config, row.date, 'titipan customer tidak bisa diubah')
		if (closed) return closed

		const body = JSON.parse(config.data) as CustomerDepositRequest
		const closedDate = closedDateReply(config, body.date)
		if (closedDate) return closedDate
		const before = resolve(row)
		const errors = validateRequest(body, before.used, before.used > 0 ? row.customer_id : undefined)
		if (errors) return [422, { message: 'Validasi gagal', errors }]

		Object.assign(row, buildRow(body, { id: row.id, number: row.number }))
		recordUpdate('customer-deposit', row.id, diffFields(before, resolve(row), FIELDS))
		return [200, { data: resolve(row), message: 'Titipan customer diperbarui' }]
	})

	mock.onDelete(/\/customer-deposit\/\d+$/).reply((config) => {
		const index = db.customerDeposit.findIndex((r) => r.id === idOf(config.url))
		if (index === -1) return [404, { message: 'Titipan customer tidak ditemukan' }]
		const closed = closedReply(config, db.customerDeposit[index].date, 'titipan customer tidak bisa dihapus')
		if (closed) return closed
		if (usagesOf(db.customerDeposit[index].id).length > 0)
			return [422, { message: 'Titipan yang sudah dipakai di Invoice Penjualan tidak boleh dihapus' }]
		const [removed] = db.customerDeposit.splice(index, 1)
		purgeHistory('customer-deposit', removed.id)
		return [200, { message: 'Titipan customer dihapus' }]
	})
}
