import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import type { Customer } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.customer.filter((c) => !c.deleted_at)
const customerCode = (id: number) => `CUST-${String(id).padStart(4, '0')}`

// Client never sends id / code / deleted_at — the server owns them.
type CustomerInput = Omit<Customer, 'id' | 'code' | 'deleted_at'>

// Contract: docs/customer/ — soft delete (deleted_at), never hard-removed.
export function registerCustomer(mock: MockAdapter) {
	mock.onGet('/customer').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = live()
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(q))
		}
		if (p.pkp !== undefined && p.pkp !== '') rows = rows.filter((c) => c.pkp === (p.pkp === 'true' || p.pkp === true))
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/customer\/\d+$/).reply((config) => {
		const found = live().find((c) => c.id === idOf(config.url))
		return found ? [200, { data: found }] : [404, { message: 'Customer tidak ditemukan' }]
	})

	mock.onPost('/customer').reply((config) => {
		const body = JSON.parse(config.data) as CustomerInput
		const id = nextId(db.customer)
		const row: Customer = { ...body, id, code: customerCode(id), deleted_at: null }
		db.customer.unshift(row)
		return [201, { data: row, message: 'Customer ditambahkan' }]
	})

	mock.onPut(/\/customer\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as Partial<CustomerInput>
		const idx = db.customer.findIndex((c) => c.id === idOf(config.url) && !c.deleted_at)
		if (idx === -1) return [404, { message: 'Customer tidak ditemukan' }]
		const current = db.customer[idx]
		db.customer[idx] = { ...current, ...body, id: current.id, code: current.code, deleted_at: current.deleted_at }
		return [200, { data: db.customer[idx], message: 'Customer diperbarui' }]
	})

	mock.onDelete(/\/customer\/\d+$/).reply((config) => {
		const found = db.customer.find((c) => c.id === idOf(config.url) && !c.deleted_at)
		if (!found) return [404, { message: 'Customer tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Customer dihapus' }]
	})
}
