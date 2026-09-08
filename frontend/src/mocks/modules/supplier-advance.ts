import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import type { SupplierAdvance, SupplierAdvanceUsage } from '@/utils/types'

type SupplierAdvanceRequest = Omit<
	SupplierAdvance,
	| 'id'
	| 'number'
	| 'used'
	| 'remaining'
	| 'last_payable_number'
	| 'department_code'
	| 'department_name'
	| 'supplier_code'
	| 'supplier_name'
	| 'cash_account_code'
	| 'cash_account_name'
	| 'cash_flow_name'
>

const idOf = (url?: string) => Number(url?.split('/').at(-1))
const usageAdvanceIdOf = (url?: string) => Number(url?.split('/').at(-2))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))

// Chronological usage rows (date then id) — the basis for the running balance.
function usagesOf(supplierAdvanceId: number): SupplierAdvanceUsage[] {
	return db.supplierAdvanceUsage
		.filter((u) => u.supplier_advance_id === supplierAdvanceId)
		.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
}

// Re-resolve every denormalized label AND recompute used/remaining/last_payable_number
// from the usage rows (single source of truth — totals are never stored).
function resolve(row: SupplierAdvance): SupplierAdvance {
	const department = db.department.find((d) => d.id === Number(row.department_id) && !d.deleted_at)
	const supplier = db.supplier.find((s) => s.id === Number(row.supplier_id) && !s.deleted_at)
	const cashAccount = db.account.find((a) => a.id === Number(row.cash_account_id) && !a.deleted_at)
	const cashFlow = row.cash_flow ? db.cashFlow.find((f) => f.code === row.cash_flow) : undefined
	const usages = usagesOf(row.id)
	const used = usages.reduce((sum, u) => sum + u.amount, 0)
	return {
		...row,
		department_code: department?.code,
		department_name: department?.name,
		supplier_code: supplier?.code,
		supplier_name: supplier?.name,
		cash_account_code: cashAccount?.code,
		cash_account_name: cashAccount?.name,
		cash_flow_name: cashFlow?.name,
		used,
		remaining: row.amount - used,
		last_payable_number: usages[usages.length - 1]?.payable_number ?? null
	}
}

function validateRequest(body: SupplierAdvanceRequest): string | null {
	if (!isDate(body.date)) return 'Tanggal wajib diisi'
	if (!db.department.find((d) => d.id === Number(body.department_id) && !d.deleted_at)) return 'Departemen tidak valid'
	if (!db.supplier.find((s) => s.id === Number(body.supplier_id) && !s.deleted_at)) return 'Supplier tidak valid'
	const amount = Number(body.amount) || 0
	if (amount <= 0) return 'Nominal wajib diisi'

	const cashAccount = db.account.find((a) => a.id === Number(body.cash_account_id) && !a.deleted_at)
	if (!cashAccount) return 'Akun kas/bank tidak valid'
	if (cashAccount.type !== 'cash_bank') return 'Akun kas/bank harus bertipe kas/bank'

	if (!String(body.advance_type ?? '').trim()) return 'Jenis uang muka wajib dipilih'
	if (body.cash_flow && !db.cashFlow.find((f) => f.code === body.cash_flow)) return 'Arus kas tidak valid'
	if (!body.attachment) return 'Lampiran wajib diunggah'
	return null
}

function buildRow(body: SupplierAdvanceRequest, base: Pick<SupplierAdvance, 'id' | 'number'>): SupplierAdvance {
	const amount = Number(body.amount) || 0
	return {
		...base,
		date: body.date,
		department_id: Number(body.department_id),
		supplier_id: Number(body.supplier_id),
		amount,
		used: 0,
		remaining: amount,
		last_payable_number: null,
		description: String(body.description ?? '').trim(),
		cash_account_id: Number(body.cash_account_id),
		advance_type: String(body.advance_type).trim(),
		cash_flow: body.cash_flow || null,
		attachment: body.attachment
	}
}

function advanceNumber(date: string, seq: number): string {
	const d = new Date(date)
	const mm = Number.isNaN(d.getTime()) ? '00' : String(d.getMonth() + 1).padStart(2, '0')
	const yyyy = Number.isNaN(d.getTime()) ? '0000' : String(d.getFullYear())
	return `UMS-RICH/${String(seq).padStart(4, '0')}/${mm}/${yyyy}`
}

// Contract: docs/supplier-advance/
export function registerSupplierAdvance(mock: MockAdapter) {
	mock.onGet('/supplier-advance').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = db.supplierAdvance.map(resolve)
		if (p.q) {
			const f = String(p.field ?? '')
			const q = String(p.q).toLowerCase()
			rows = rows.filter((a) => {
				const textByField: Record<string, string> = {
					number: a.number,
					supplier: `${a.supplier_code} ${a.supplier_name}`,
					date: a.date,
					description: a.description
				}
				if (f && textByField[f]) return textByField[f].toLowerCase().includes(q)
				return Object.values(textByField).some((t) => t.toLowerCase().includes(q))
			})
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/supplier-advance\/\d+\/usage$/).reply((config) => {
		const row = db.supplierAdvance.find((r) => r.id === usageAdvanceIdOf(config.url))
		if (!row) return [404, { message: 'Uang muka supplier tidak ditemukan' }]
		return [200, { data: usagesOf(row.id) }]
	})

	mock.onGet(/\/supplier-advance\/\d+$/).reply((config) => {
		const row = db.supplierAdvance.find((r) => r.id === idOf(config.url))
		return row ? [200, { data: resolve(row) }] : [404, { message: 'Uang muka supplier tidak ditemukan' }]
	})

	mock.onPost('/supplier-advance').reply((config) => {
		const body = JSON.parse(config.data) as SupplierAdvanceRequest
		const error = validateRequest(body)
		if (error) return [422, { message: error, errors: { amount: [error] } }]

		const seq = db.supplierAdvance.length + 1
		const row = buildRow(body, { id: nextId(db.supplierAdvance), number: advanceNumber(body.date, seq) })
		db.supplierAdvance.unshift(row)
		return [201, { data: resolve(row), message: 'Uang muka supplier ditambahkan' }]
	})

	mock.onPut(/\/supplier-advance\/\d+$/).reply((config) => {
		const row = db.supplierAdvance.find((r) => r.id === idOf(config.url))
		if (!row) return [404, { message: 'Uang muka supplier tidak ditemukan' }]
		if (usagesOf(row.id).length > 0) return [422, { message: 'Uang muka yang sudah dipakai di Hutang Supplier tidak boleh diubah' }]

		const body = JSON.parse(config.data) as SupplierAdvanceRequest
		const error = validateRequest(body)
		if (error) return [422, { message: error, errors: { amount: [error] } }]

		Object.assign(row, buildRow(body, { id: row.id, number: row.number }))
		return [200, { data: resolve(row), message: 'Uang muka supplier diperbarui' }]
	})

	mock.onDelete(/\/supplier-advance\/\d+$/).reply((config) => {
		const index = db.supplierAdvance.findIndex((r) => r.id === idOf(config.url))
		if (index === -1) return [404, { message: 'Uang muka supplier tidak ditemukan' }]
		if (usagesOf(db.supplierAdvance[index].id).length > 0)
			return [422, { message: 'Uang muka yang sudah dipakai di Hutang Supplier tidak boleh dihapus' }]
		db.supplierAdvance.splice(index, 1)
		return [200, { message: 'Uang muka supplier dihapus' }]
	})
}
