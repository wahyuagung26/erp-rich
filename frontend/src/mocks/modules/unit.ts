import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Unit } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.unit.filter((s) => !s.deleted_at)

// Uniqueness is per company — two companies may each have their own PCS code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((s) => s.company_id === companyId && s.code.toLowerCase() === code.trim().toLowerCase() && s.id !== exceptId)

// Contract: docs/unit/ — code is user-entered at create, immutable after
// (ignored on update). Soft delete (deleted_at), never hard-removed. Company-scoped
// — see docs/conventions.md#company-scoping.
export function registerUnit(mock: MockAdapter) {
	mock.onGet('/unit').reply((config) => {
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

	mock.onGet(/\/unit\/\d+$/).reply((config) => {
		const found = live().find((s) => s.id === idOf(config.url) && s.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Satuan tidak ditemukan' }]
	})

	mock.onPost('/unit').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { code: string; name: string }
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode satuan sudah dipakai'] } }]
		const id = nextId(db.unit)
		const row: Unit = { id, company_id: companyId, code: body.code.trim(), name: body.name, deleted_at: null }
		db.unit.unshift(row)
		return [201, { data: row, message: 'Satuan ditambahkan' }]
	})

	mock.onPut(/\/unit\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as { name: string }
		const idx = db.unit.findIndex((s) => s.id === idOf(config.url) && !s.deleted_at && s.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Satuan tidak ditemukan' }]
		// code is immutable — ignored even if the client sends it
		db.unit[idx] = { ...db.unit[idx], name: body.name }
		return [200, { data: db.unit[idx], message: 'Satuan diperbarui' }]
	})

	mock.onDelete(/\/unit\/\d+$/).reply((config) => {
		const found = db.unit.find((s) => s.id === idOf(config.url) && !s.deleted_at && s.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Satuan tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Satuan dihapus' }]
	})
}
