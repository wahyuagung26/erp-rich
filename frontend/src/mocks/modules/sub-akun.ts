import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { SubAkun } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.subAkun.filter((s) => !s.deleted_at)

// Uniqueness is per company — two companies may each have their own 10001 code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((s) => s.company_id === companyId && s.code === code && s.id !== exceptId)

// group_akun must exist, not be deleted, and belong to the same company.
const groupOf = (groupId: number, companyId: number) => db.groupAkun.find((g) => g.id === groupId && !g.deleted_at && g.company_id === companyId)

// Contract: docs/sub-akun/ — `code` is server-composed: first 2 digits from the
// group's (zero-padded) code, last 3 from the user-entered `code_suffix`. Both
// `group_akun_id` and the resulting `code` are immutable after create (ignored on
// update). group_akun_code/group_akun_name are denormalized (same pattern as
// Gudang's cabang_code/cabang_name). Soft delete, company-scoped — see
// docs/conventions.md#company-scoping.
export function registerSubAkun(mock: MockAdapter) {
	mock.onGet('/sub-akun').reply((config) => {
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

	mock.onGet(/\/sub-akun\/\d+$/).reply((config) => {
		const found = live().find((s) => s.id === idOf(config.url) && s.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Sub akun tidak ditemukan' }]
	})

	mock.onPost('/sub-akun').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { group_akun_id: number; code_suffix: string; name: string; normal_balance: SubAkun['normal_balance'] }
		const group = groupOf(Number(body.group_akun_id), companyId)
		if (!group) return [422, { message: 'Validasi gagal', errors: { group_akun_id: ['Group perkiraan tidak valid'] } }]
		if (!/^\d{3}$/.test(String(body.code_suffix ?? '').trim()))
			return [422, { message: 'Validasi gagal', errors: { code_suffix: ['Kode harus angka, tepat 3 digit'] } }]
		const code = `${group.code.padStart(2, '0')}${body.code_suffix.trim()}`
		if (codeTaken(code, companyId)) return [422, { message: 'Validasi gagal', errors: { code_suffix: ['Kode sub akun sudah dipakai'] } }]
		const id = nextId(db.subAkun)
		const row: SubAkun = {
			id,
			company_id: companyId,
			group_akun_id: group.id,
			group_akun_code: group.code,
			group_akun_name: group.name,
			code,
			name: body.name,
			normal_balance: body.normal_balance,
			deleted_at: null
		}
		db.subAkun.unshift(row)
		return [201, { data: row, message: 'Sub akun ditambahkan' }]
	})

	mock.onPut(/\/sub-akun\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as { name: string; normal_balance: SubAkun['normal_balance'] }
		const idx = db.subAkun.findIndex((s) => s.id === idOf(config.url) && !s.deleted_at && s.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Sub akun tidak ditemukan' }]
		// group_akun_id and code are immutable — ignored even if sent
		db.subAkun[idx] = { ...db.subAkun[idx], name: body.name, normal_balance: body.normal_balance }
		return [200, { data: db.subAkun[idx], message: 'Sub akun diperbarui' }]
	})

	mock.onDelete(/\/sub-akun\/\d+$/).reply((config) => {
		const found = db.subAkun.find((s) => s.id === idOf(config.url) && !s.deleted_at && s.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Sub akun tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Sub akun dihapus' }]
	})
}
