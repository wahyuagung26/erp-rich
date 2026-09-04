import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { GroupAkun } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.groupAkun.filter((g) => !g.deleted_at)

// Uniqueness is per company — two companies may each have their own AST code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((g) => g.company_id === companyId && g.code.toLowerCase() === code.trim().toLowerCase() && g.id !== exceptId)

// Contract: docs/group-akun/ — code is user-entered at create, immutable after
// (ignored on update). Soft delete (deleted_at), never hard-removed. Company-scoped
// — see docs/conventions.md#company-scoping.
export function registerGroupAkun(mock: MockAdapter) {
	mock.onGet('/group-akun').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((g) => g.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((g) => `${g.code} ${g.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/group-akun\/\d+$/).reply((config) => {
		const found = live().find((g) => g.id === idOf(config.url) && g.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Group akun tidak ditemukan' }]
	})

	mock.onPost('/group-akun').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as {
			code: string
			name: string
			category: GroupAkun['category']
			normal_balance: GroupAkun['normal_balance']
		}
		if (!/^\d{1,2}$/.test(body.code.trim())) return [422, { message: 'Validasi gagal', errors: { code: ['Kode harus angka, maksimal 2 digit'] } }]
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode group akun sudah dipakai'] } }]
		const id = nextId(db.groupAkun)
		const row: GroupAkun = {
			id,
			company_id: companyId,
			code: body.code.trim(),
			name: body.name,
			category: body.category,
			normal_balance: body.normal_balance,
			deleted_at: null
		}
		db.groupAkun.unshift(row)
		return [201, { data: row, message: 'Group akun ditambahkan' }]
	})

	mock.onPut(/\/group-akun\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as { name: string; category: GroupAkun['category']; normal_balance: GroupAkun['normal_balance'] }
		const idx = db.groupAkun.findIndex((g) => g.id === idOf(config.url) && !g.deleted_at && g.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Group akun tidak ditemukan' }]
		// code is immutable — ignored even if the client sends it
		db.groupAkun[idx] = { ...db.groupAkun[idx], name: body.name, category: body.category, normal_balance: body.normal_balance }
		return [200, { data: db.groupAkun[idx], message: 'Group akun diperbarui' }]
	})

	mock.onDelete(/\/group-akun\/\d+$/).reply((config) => {
		const found = db.groupAkun.find((g) => g.id === idOf(config.url) && !g.deleted_at && g.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Group akun tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Group akun dihapus' }]
	})
}
