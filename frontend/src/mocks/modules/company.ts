import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import type { Company } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.company.filter((p) => !p.deleted_at)

// Client supplies `code`; server owns id / deleted_at only.
type CompanyInput = Omit<Company, 'id' | 'deleted_at'>

const codeTaken = (code: string, exceptId?: number) => live().some((p) => p.code.toLowerCase() === code.trim().toLowerCase() && p.id !== exceptId)

// Contract: docs/company/ — soft delete (deleted_at), never hard-removed.
export function registerCompany(mock: MockAdapter) {
	mock.onGet('/company').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = live()
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((c) => `${c.code} ${c.short_name} ${c.legal_name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/company\/\d+$/).reply((config) => {
		const found = live().find((c) => c.id === idOf(config.url))
		return found ? [200, { data: found }] : [404, { message: 'Perusahaan tidak ditemukan' }]
	})

	mock.onPost('/company').reply((config) => {
		const body = JSON.parse(config.data) as CompanyInput
		if (codeTaken(body.code)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode perusahaan sudah dipakai'] } }]
		const id = nextId(db.company)
		const row: Company = { ...body, code: body.code.trim(), id, deleted_at: null }
		db.company.unshift(row)
		return [201, { data: row, message: 'Perusahaan ditambahkan' }]
	})

	mock.onPut(/\/company\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as Partial<CompanyInput>
		const idx = db.company.findIndex((c) => c.id === idOf(config.url) && !c.deleted_at)
		if (idx === -1) return [404, { message: 'Perusahaan tidak ditemukan' }]
		const current = db.company[idx]
		if (body.code && codeTaken(body.code, current.id))
			return [422, { message: 'Validasi gagal', errors: { code: ['Kode perusahaan sudah dipakai'] } }]
		// empty logo_url on update keeps the current logo
		const logo_url = body.logo_url ? body.logo_url : current.logo_url
		db.company[idx] = { ...current, ...body, logo_url, id: current.id, deleted_at: current.deleted_at }
		return [200, { data: db.company[idx], message: 'Perusahaan diperbarui' }]
	})

	mock.onDelete(/\/company\/\d+$/).reply((config) => {
		const found = db.company.find((c) => c.id === idOf(config.url) && !c.deleted_at)
		if (!found) return [404, { message: 'Perusahaan tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Perusahaan dihapus' }]
	})
}
