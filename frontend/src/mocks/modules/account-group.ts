import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { AccountGroup } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.accountGroup.filter((g) => !g.deleted_at)

// Uniqueness is per company — two companies may each have their own code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((g) => g.company_id === companyId && g.code.toLowerCase() === code.trim().toLowerCase() && g.id !== exceptId)

// Contract: docs/account-group/ — code is user-entered at create, immutable after
// (ignored on update). Soft delete (deleted_at), never hard-removed. Company-scoped
// — see docs/conventions.md#company-scoping.
export function registerAccountGroup(mock: MockAdapter) {
	mock.onGet('/account-group').reply((config) => {
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

	mock.onGet(/\/account-group\/\d+$/).reply((config) => {
		const found = live().find((g) => g.id === idOf(config.url) && g.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Group akun tidak ditemukan' }]
	})

	mock.onPost('/account-group').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as {
			code: string
			name: string
			category: AccountGroup['category']
			normal_balance: AccountGroup['normal_balance']
		}
		if (!/^\d{1,2}$/.test(body.code.trim())) return [422, { message: 'Validasi gagal', errors: { code: ['Kode harus angka, maksimal 2 digit'] } }]
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode group akun sudah dipakai'] } }]
		const id = nextId(db.accountGroup)
		const row: AccountGroup = {
			id,
			company_id: companyId,
			code: body.code.trim(),
			name: body.name,
			category: body.category,
			normal_balance: body.normal_balance,
			deleted_at: null
		}
		db.accountGroup.unshift(row)
		return [201, { data: row, message: 'Group akun ditambahkan' }]
	})

	mock.onPut(/\/account-group\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as { name: string; category: AccountGroup['category']; normal_balance: AccountGroup['normal_balance'] }
		const idx = db.accountGroup.findIndex((g) => g.id === idOf(config.url) && !g.deleted_at && g.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Group akun tidak ditemukan' }]
		// code is immutable — ignored even if the client sends it
		db.accountGroup[idx] = { ...db.accountGroup[idx], name: body.name, category: body.category, normal_balance: body.normal_balance }
		return [200, { data: db.accountGroup[idx], message: 'Group akun diperbarui' }]
	})

	mock.onDelete(/\/account-group\/\d+$/).reply((config) => {
		const found = db.accountGroup.find((g) => g.id === idOf(config.url) && !g.deleted_at && g.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Group akun tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Group akun dihapus' }]
	})
}
