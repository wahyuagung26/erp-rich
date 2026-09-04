import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Customer } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.customer.filter((c) => !c.deleted_at)
const customerCode = (id: number) => `CUST-${String(id).padStart(4, '0')}`

// Client never sends id / code / company_id / deleted_at — the server owns them.
type CustomerInput = Omit<Customer, 'id' | 'code' | 'company_id' | 'deleted_at'>

// Contract: docs/customer/ — soft delete (deleted_at), never hard-removed.
// Company-scoped — see docs/conventions.md#company-scoping.
export function registerCustomer(mock: MockAdapter) {
	mock.onGet('/customer').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((c) => c.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(q))
		}
		if (p.pkp !== undefined && p.pkp !== '') rows = rows.filter((c) => c.pkp === (p.pkp === 'true' || p.pkp === true))
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/customer\/\d+$/).reply((config) => {
		const found = live().find((c) => c.id === idOf(config.url) && c.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Customer tidak ditemukan' }]
	})

	mock.onPost('/customer').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as CustomerInput
		const id = nextId(db.customer)
		const row: Customer = { ...body, id, code: customerCode(id), company_id: companyId, deleted_at: null }
		db.customer.unshift(row)
		return [201, { data: row, message: 'Customer ditambahkan' }]
	})

	mock.onPut(/\/customer\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as Partial<CustomerInput>
		const idx = db.customer.findIndex((c) => c.id === idOf(config.url) && !c.deleted_at && c.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Customer tidak ditemukan' }]
		const current = db.customer[idx]
		db.customer[idx] = { ...current, ...body, id: current.id, code: current.code, company_id: current.company_id, deleted_at: current.deleted_at }
		return [200, { data: db.customer[idx], message: 'Customer diperbarui' }]
	})

	mock.onDelete(/\/customer\/\d+$/).reply((config) => {
		const found = db.customer.find((c) => c.id === idOf(config.url) && !c.deleted_at && c.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Customer tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Customer dihapus' }]
	})
}
