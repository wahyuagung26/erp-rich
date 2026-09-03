import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import type { Supplier } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.supplier.filter((s) => !s.deleted_at)
const supplierCode = (id: number) => `SUP-${String(id).padStart(4, '0')}`

// Client never sends id / code / deleted_at — the server owns them.
type SupplierInput = Omit<Supplier, 'id' | 'code' | 'deleted_at'>

// Contract: docs/supplier/ — soft delete (deleted_at), never hard-removed.
export function registerSupplier(mock: MockAdapter) {
	mock.onGet('/supplier').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = live()
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((s) => `${s.code} ${s.name} ${s.contact_person}`.toLowerCase().includes(q))
		}
		if (p.pkp !== undefined && p.pkp !== '') rows = rows.filter((s) => s.pkp === (p.pkp === 'true' || p.pkp === true))
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/supplier\/\d+$/).reply((config) => {
		const found = live().find((s) => s.id === idOf(config.url))
		return found ? [200, { data: found }] : [404, { message: 'Supplier tidak ditemukan' }]
	})

	mock.onPost('/supplier').reply((config) => {
		const body = JSON.parse(config.data) as SupplierInput
		const id = nextId(db.supplier)
		const row: Supplier = { ...body, id, code: supplierCode(id), deleted_at: null }
		db.supplier.unshift(row)
		return [201, { data: row, message: 'Supplier ditambahkan' }]
	})

	mock.onPut(/\/supplier\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as Partial<SupplierInput>
		const idx = db.supplier.findIndex((s) => s.id === idOf(config.url) && !s.deleted_at)
		if (idx === -1) return [404, { message: 'Supplier tidak ditemukan' }]
		const current = db.supplier[idx]
		db.supplier[idx] = { ...current, ...body, id: current.id, code: current.code, deleted_at: current.deleted_at }
		return [200, { data: db.supplier[idx], message: 'Supplier diperbarui' }]
	})

	mock.onDelete(/\/supplier\/\d+$/).reply((config) => {
		const found = db.supplier.find((s) => s.id === idOf(config.url) && !s.deleted_at)
		if (!found) return [404, { message: 'Supplier tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Supplier dihapus' }]
	})
}
