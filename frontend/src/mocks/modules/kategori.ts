import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Kategori } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.kategori.filter((k) => !k.deleted_at)

// Uniqueness is per company — two companies may each have their own ELK code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((k) => k.company_id === companyId && k.code.toLowerCase() === code.trim().toLowerCase() && k.id !== exceptId)

// Contract: docs/kategori/ — code is user-entered at create, immutable after
// (ignored on update). Soft delete (deleted_at), never hard-removed. Company-scoped
// — see docs/conventions.md#company-scoping.
export function registerKategori(mock: MockAdapter) {
	mock.onGet('/kategori').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((k) => k.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((k) => `${k.code} ${k.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/kategori\/\d+$/).reply((config) => {
		const found = live().find((k) => k.id === idOf(config.url) && k.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Kategori tidak ditemukan' }]
	})

	mock.onPost('/kategori').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { code: string; name: string }
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode kategori sudah dipakai'] } }]
		const id = nextId(db.kategori)
		const row: Kategori = { id, company_id: companyId, code: body.code.trim(), name: body.name, deleted_at: null }
		db.kategori.unshift(row)
		return [201, { data: row, message: 'Kategori ditambahkan' }]
	})

	mock.onPut(/\/kategori\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as { name: string }
		const idx = db.kategori.findIndex((k) => k.id === idOf(config.url) && !k.deleted_at && k.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Kategori tidak ditemukan' }]
		// code is immutable — ignored even if the client sends it
		db.kategori[idx] = { ...db.kategori[idx], name: body.name }
		return [200, { data: db.kategori[idx], message: 'Kategori diperbarui' }]
	})

	mock.onDelete(/\/kategori\/\d+$/).reply((config) => {
		const found = db.kategori.find((k) => k.id === idOf(config.url) && !k.deleted_at && k.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Kategori tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Kategori dihapus' }]
	})
}
