import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Sales } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.sales.filter((s) => !s.deleted_at)

// Uniqueness is per company — two companies may each have their own SL01 code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((s) => s.company_id === companyId && s.code.toLowerCase() === code.trim().toLowerCase() && s.id !== exceptId)

// Client never sends id / code / company_id / deleted_at on update — code is
// immutable, the rest are server-owned.
type SalesUpdateInput = { name: string; address: string }

// Contract: docs/sales/ — code is user-entered at create, immutable after
// (ignored on update). Soft delete (deleted_at), never hard-removed. Company-scoped
// — see docs/conventions.md#company-scoping.
export function registerSales(mock: MockAdapter) {
	mock.onGet('/sales').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((s) => s.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((s) => `${s.code} ${s.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/sales\/\d+$/).reply((config) => {
		const found = live().find((s) => s.id === idOf(config.url) && s.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Sales tidak ditemukan' }]
	})

	mock.onPost('/sales').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { code: string; name: string; address: string }
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode sales sudah dipakai'] } }]
		const id = nextId(db.sales)
		const row: Sales = { id, company_id: companyId, code: body.code.trim(), name: body.name, address: body.address, deleted_at: null }
		db.sales.unshift(row)
		return [201, { data: row, message: 'Sales ditambahkan' }]
	})

	mock.onPut(/\/sales\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as SalesUpdateInput
		const idx = db.sales.findIndex((s) => s.id === idOf(config.url) && !s.deleted_at && s.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Sales tidak ditemukan' }]
		// code is immutable — ignored even if the client sends it
		db.sales[idx] = { ...db.sales[idx], name: body.name, address: body.address }
		return [200, { data: db.sales[idx], message: 'Sales diperbarui' }]
	})

	mock.onDelete(/\/sales\/\d+$/).reply((config) => {
		const found = db.sales.find((s) => s.id === idOf(config.url) && !s.deleted_at && s.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Sales tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Sales dihapus' }]
	})
}
