import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { ProductCategory } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.productCategory.filter((p) => !p.deleted_at)

// Uniqueness is per company — two companies may each have their own ELK code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((p) => p.company_id === companyId && p.code.toLowerCase() === code.trim().toLowerCase() && p.id !== exceptId)

// Contract: docs/product-category/ — code is user-entered at create, immutable after
// (ignored on update). Soft delete (deleted_at), never hard-removed. Company-scoped
// — see docs/conventions.md#company-scoping.
export function registerProductCategory(mock: MockAdapter) {
	mock.onGet('/product-category').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((p) => p.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((p) => `${p.code} ${p.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/product-category\/\d+$/).reply((config) => {
		const found = live().find((p) => p.id === idOf(config.url) && p.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Kategori tidak ditemukan' }]
	})

	mock.onPost('/product-category').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { code: string; name: string }
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode kategori sudah dipakai'] } }]
		const id = nextId(db.productCategory)
		const row: ProductCategory = { id, company_id: companyId, code: body.code.trim(), name: body.name, deleted_at: null }
		db.productCategory.unshift(row)
		return [201, { data: row, message: 'Kategori ditambahkan' }]
	})

	mock.onPut(/\/product-category\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as { name: string }
		const idx = db.productCategory.findIndex((p) => p.id === idOf(config.url) && !p.deleted_at && p.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Kategori tidak ditemukan' }]
		// code is immutable — ignored even if the client sends it
		db.productCategory[idx] = { ...db.productCategory[idx], name: body.name }
		return [200, { data: db.productCategory[idx], message: 'Kategori diperbarui' }]
	})

	mock.onDelete(/\/product-category\/\d+$/).reply((config) => {
		const found = db.productCategory.find((p) => p.id === idOf(config.url) && !p.deleted_at && p.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Kategori tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Kategori dihapus' }]
	})
}
