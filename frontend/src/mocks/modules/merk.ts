import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Merk } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.merk.filter((m) => !m.deleted_at)

// Uniqueness is per company — two companies may each have their own SGT code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((m) => m.company_id === companyId && m.code.toLowerCase() === code.trim().toLowerCase() && m.id !== exceptId)

// Contract: docs/merk/ — code is user-entered at create, immutable after (ignored on
// update). Soft delete (deleted_at), never hard-removed. Company-scoped — see
// docs/conventions.md#company-scoping.
export function registerMerk(mock: MockAdapter) {
	mock.onGet('/merk').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((m) => m.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((m) => `${m.code} ${m.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/merk\/\d+$/).reply((config) => {
		const found = live().find((m) => m.id === idOf(config.url) && m.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Merk tidak ditemukan' }]
	})

	mock.onPost('/merk').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { code: string; name: string }
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode merk sudah dipakai'] } }]
		const id = nextId(db.merk)
		const row: Merk = { id, company_id: companyId, code: body.code.trim(), name: body.name, deleted_at: null }
		db.merk.unshift(row)
		return [201, { data: row, message: 'Merk ditambahkan' }]
	})

	mock.onPut(/\/merk\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as { name: string }
		const idx = db.merk.findIndex((m) => m.id === idOf(config.url) && !m.deleted_at && m.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Merk tidak ditemukan' }]
		// code is immutable — ignored even if the client sends it
		db.merk[idx] = { ...db.merk[idx], name: body.name }
		return [200, { data: db.merk[idx], message: 'Merk diperbarui' }]
	})

	mock.onDelete(/\/merk\/\d+$/).reply((config) => {
		const found = db.merk.find((m) => m.id === idOf(config.url) && !m.deleted_at && m.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Merk tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Merk dihapus' }]
	})
}
