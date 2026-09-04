import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { AkunPerkiraan } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.akunPerkiraan.filter((a) => !a.deleted_at)

// Uniqueness is per company — two companies may each have their own 1000101 code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((a) => a.company_id === companyId && a.code === code && a.id !== exceptId)

// sub_akun must exist, not be deleted, and belong to the same company.
const subAkunOf = (subAkunId: number, companyId: number) => db.subAkun.find((s) => s.id === subAkunId && !s.deleted_at && s.company_id === companyId)

// Contract: docs/akun-perkiraan/ — `code` is server-composed: first 5 digits from
// the sub akun's (already 5-digit) code, last 2 from the user-entered `code_suffix`.
// Both `sub_akun_id` and the resulting `code` are immutable after create (ignored
// on update). sub_akun_code/sub_akun_name are denormalized (same pattern as
// SubAkun's group_akun_code/group_akun_name). Soft delete, company-scoped — see
// docs/conventions.md#company-scoping.
export function registerAkunPerkiraan(mock: MockAdapter) {
	mock.onGet('/akun-perkiraan').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((a) => a.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((a) => `${a.code} ${a.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/akun-perkiraan\/\d+$/).reply((config) => {
		const found = live().find((a) => a.id === idOf(config.url) && a.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Akun perkiraan tidak ditemukan' }]
	})

	mock.onPost('/akun-perkiraan').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { sub_akun_id: number; code_suffix: string; name: string; type: AkunPerkiraan['type'] }
		const subAkun = subAkunOf(Number(body.sub_akun_id), companyId)
		if (!subAkun) return [422, { message: 'Validasi gagal', errors: { sub_akun_id: ['Sub akun tidak valid'] } }]
		if (!/^\d{2}$/.test(String(body.code_suffix ?? '').trim()))
			return [422, { message: 'Validasi gagal', errors: { code_suffix: ['Kode harus angka, tepat 2 digit'] } }]
		const code = `${subAkun.code}${body.code_suffix.trim()}`
		if (codeTaken(code, companyId)) return [422, { message: 'Validasi gagal', errors: { code_suffix: ['Kode akun perkiraan sudah dipakai'] } }]
		const id = nextId(db.akunPerkiraan)
		const row: AkunPerkiraan = {
			id,
			company_id: companyId,
			sub_akun_id: subAkun.id,
			sub_akun_code: subAkun.code,
			sub_akun_name: subAkun.name,
			code,
			name: body.name,
			type: body.type,
			deleted_at: null
		}
		db.akunPerkiraan.unshift(row)
		return [201, { data: row, message: 'Akun perkiraan ditambahkan' }]
	})

	mock.onPut(/\/akun-perkiraan\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as { name: string; type: AkunPerkiraan['type'] }
		const idx = db.akunPerkiraan.findIndex((a) => a.id === idOf(config.url) && !a.deleted_at && a.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Akun perkiraan tidak ditemukan' }]
		// sub_akun_id and code are immutable — ignored even if sent
		db.akunPerkiraan[idx] = { ...db.akunPerkiraan[idx], name: body.name, type: body.type }
		return [200, { data: db.akunPerkiraan[idx], message: 'Akun perkiraan diperbarui' }]
	})

	mock.onDelete(/\/akun-perkiraan\/\d+$/).reply((config) => {
		const found = db.akunPerkiraan.find((a) => a.id === idOf(config.url) && !a.deleted_at && a.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Akun perkiraan tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Akun perkiraan dihapus' }]
	})
}
