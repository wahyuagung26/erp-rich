import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Gudang } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.gudang.filter((g) => !g.deleted_at)

// Uniqueness is per company — two companies may each have their own GD1 code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((g) => g.company_id === companyId && g.code.toLowerCase() === code.trim().toLowerCase() && g.id !== exceptId)

// cabang must exist, not be deleted, and belong to the same company.
const cabangOf = (cabangId: number, companyId: number) => db.cabang.find((c) => c.id === cabangId && !c.deleted_at && c.company_id === companyId)

// Contract: docs/gudang/ — code is user-entered at create, immutable after
// (ignored on update). cabang_id must belong to the active company; cabang_code/
// cabang_name are denormalized onto the row (same pattern as JurnalLine's akun_code/
// akun_name). Soft delete (deleted_at), never hard-removed. Company-scoped — see
// docs/conventions.md#company-scoping.
export function registerGudang(mock: MockAdapter) {
	mock.onGet('/gudang').reply((config) => {
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

	mock.onGet(/\/gudang\/\d+$/).reply((config) => {
		const found = live().find((g) => g.id === idOf(config.url) && g.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Gudang tidak ditemukan' }]
	})

	mock.onPost('/gudang').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { code: string; name: string; cabang_id: number; address?: string }
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode gudang sudah dipakai'] } }]
		const cabang = cabangOf(Number(body.cabang_id), companyId)
		if (!cabang) return [422, { message: 'Validasi gagal', errors: { cabang_id: ['Cabang tidak valid'] } }]
		const id = nextId(db.gudang)
		const row: Gudang = {
			id,
			company_id: companyId,
			code: body.code.trim(),
			name: body.name,
			cabang_id: cabang.id,
			cabang_code: cabang.code,
			cabang_name: cabang.name,
			address: body.address ?? '',
			deleted_at: null
		}
		db.gudang.unshift(row)
		return [201, { data: row, message: 'Gudang ditambahkan' }]
	})

	mock.onPut(/\/gudang\/\d+$/).reply((config) => {
		const companyId = companyIdOf(config)
		const body = JSON.parse(config.data) as { name: string; cabang_id: number; address?: string }
		const idx = db.gudang.findIndex((g) => g.id === idOf(config.url) && !g.deleted_at && g.company_id === companyId)
		if (idx === -1) return [404, { message: 'Gudang tidak ditemukan' }]
		const cabang = cabangOf(Number(body.cabang_id), companyId as number)
		if (!cabang) return [422, { message: 'Validasi gagal', errors: { cabang_id: ['Cabang tidak valid'] } }]
		// code is immutable — ignored even if the client sends it
		db.gudang[idx] = {
			...db.gudang[idx],
			name: body.name,
			cabang_id: cabang.id,
			cabang_code: cabang.code,
			cabang_name: cabang.name,
			address: body.address ?? ''
		}
		return [200, { data: db.gudang[idx], message: 'Gudang diperbarui' }]
	})

	mock.onDelete(/\/gudang\/\d+$/).reply((config) => {
		const found = db.gudang.find((g) => g.id === idOf(config.url) && !g.deleted_at && g.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Gudang tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Gudang dihapus' }]
	})
}
