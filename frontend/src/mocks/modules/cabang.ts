import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Cabang } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.cabang.filter((c) => !c.deleted_at)

// Uniqueness is per company — two companies may each have their own PST code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((c) => c.company_id === companyId && c.code.toLowerCase() === code.trim().toLowerCase() && c.id !== exceptId)

// Client never sends id / code / company_id / deleted_at on update — code is
// immutable, the rest are server-owned.
type CabangUpdateInput = { name: string; address: string }

// Contract: docs/cabang/ — code is user-entered at create, immutable after
// (ignored on update). Soft delete (deleted_at), never hard-removed. Company-scoped
// — see docs/conventions.md#company-scoping.
export function registerCabang(mock: MockAdapter) {
	mock.onGet('/cabang').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((c) => c.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/cabang\/\d+$/).reply((config) => {
		const found = live().find((c) => c.id === idOf(config.url) && c.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Cabang tidak ditemukan' }]
	})

	mock.onPost('/cabang').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { code: string; name: string; address: string }
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode cabang sudah dipakai'] } }]
		const id = nextId(db.cabang)
		const row: Cabang = { id, company_id: companyId, code: body.code.trim(), name: body.name, address: body.address, deleted_at: null }
		db.cabang.unshift(row)
		return [201, { data: row, message: 'Cabang ditambahkan' }]
	})

	mock.onPut(/\/cabang\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as CabangUpdateInput
		const idx = db.cabang.findIndex((c) => c.id === idOf(config.url) && !c.deleted_at && c.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Cabang tidak ditemukan' }]
		// code is immutable — ignored even if the client sends it
		db.cabang[idx] = { ...db.cabang[idx], name: body.name, address: body.address }
		return [200, { data: db.cabang[idx], message: 'Cabang diperbarui' }]
	})

	mock.onDelete(/\/cabang\/\d+$/).reply((config) => {
		const found = db.cabang.find((c) => c.id === idOf(config.url) && !c.deleted_at && c.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Cabang tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Cabang dihapus' }]
	})
}
