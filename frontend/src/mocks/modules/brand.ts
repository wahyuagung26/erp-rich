import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Brand } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.brand.filter((b) => !b.deleted_at)

// Uniqueness is per company — two companies may each have their own SGT code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((b) => b.company_id === companyId && b.code.toLowerCase() === code.trim().toLowerCase() && b.id !== exceptId)

// Contract: docs/brand/ — code is user-entered at create, immutable after (ignored on
// update). Soft delete (deleted_at), never hard-removed. Company-scoped — see
// docs/conventions.md#company-scoping.
export function registerBrand(mock: MockAdapter) {
	mock.onGet('/brand').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((b) => b.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((b) => `${b.code} ${b.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/brand\/\d+$/).reply((config) => {
		const found = live().find((b) => b.id === idOf(config.url) && b.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Merk tidak ditemukan' }]
	})

	mock.onPost('/brand').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { code: string; name: string }
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode merk sudah dipakai'] } }]
		const id = nextId(db.brand)
		const row: Brand = { id, company_id: companyId, code: body.code.trim(), name: body.name, deleted_at: null }
		db.brand.unshift(row)
		return [201, { data: row, message: 'Merk ditambahkan' }]
	})

	mock.onPut(/\/brand\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as { name: string }
		const idx = db.brand.findIndex((b) => b.id === idOf(config.url) && !b.deleted_at && b.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Merk tidak ditemukan' }]
		// code is immutable — ignored even if the client sends it
		db.brand[idx] = { ...db.brand[idx], name: body.name }
		return [200, { data: db.brand[idx], message: 'Merk diperbarui' }]
	})

	mock.onDelete(/\/brand\/\d+$/).reply((config) => {
		const found = db.brand.find((b) => b.id === idOf(config.url) && !b.deleted_at && b.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Merk tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Merk dihapus' }]
	})
}
