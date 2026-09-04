import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Departemen } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.departemen.filter((d) => !d.deleted_at)

// Uniqueness is per company — two companies may each have their own FIN code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((d) => d.company_id === companyId && d.code.toLowerCase() === code.trim().toLowerCase() && d.id !== exceptId)

// Contract: docs/departemen/ — code is user-entered at create, immutable after
// (ignored on update). Soft delete (deleted_at), never hard-removed. Company-scoped
// — see docs/conventions.md#company-scoping.
export function registerDepartemen(mock: MockAdapter) {
	mock.onGet('/departemen').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((d) => d.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((d) => `${d.code} ${d.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/departemen\/\d+$/).reply((config) => {
		const found = live().find((d) => d.id === idOf(config.url) && d.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Departemen tidak ditemukan' }]
	})

	mock.onPost('/departemen').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { code: string; name: string }
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode departemen sudah dipakai'] } }]
		const id = nextId(db.departemen)
		const row: Departemen = { id, company_id: companyId, code: body.code.trim(), name: body.name, deleted_at: null }
		db.departemen.unshift(row)
		return [201, { data: row, message: 'Departemen ditambahkan' }]
	})

	mock.onPut(/\/departemen\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as { name: string }
		const idx = db.departemen.findIndex((d) => d.id === idOf(config.url) && !d.deleted_at && d.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Departemen tidak ditemukan' }]
		// code is immutable — ignored even if the client sends it
		db.departemen[idx] = { ...db.departemen[idx], name: body.name }
		return [200, { data: db.departemen[idx], message: 'Departemen diperbarui' }]
	})

	mock.onDelete(/\/departemen\/\d+$/).reply((config) => {
		const found = db.departemen.find((d) => d.id === idOf(config.url) && !d.deleted_at && d.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Departemen tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Departemen dihapus' }]
	})
}
