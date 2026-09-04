import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { JenisPenjualan } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.jenisPenjualan.filter((j) => !j.deleted_at)

// Uniqueness is per company — two companies may each have their own RC0007 code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((j) => j.company_id === companyId && j.code.toLowerCase() === code.trim().toLowerCase() && j.id !== exceptId)

// The referenced akun perkiraan must exist, not be deleted, and belong to the same company.
const akunOf = (akunId: number, companyId: number) => db.akunPerkiraan.find((a) => a.id === akunId && !a.deleted_at && a.company_id === companyId)

interface Body {
	code: string
	name: string
	akun_pendapatan_id: number
	akun_hpp_id: number
	akun_persediaan_id: number
}

// Contract: docs/jenis-penjualan/ — code is user-entered at create, immutable
// after (ignored on update). The three akun_*_id references must each belong to
// the active company; their code/name are denormalized onto the row (same
// pattern as Gudang's cabang_code/cabang_name). Soft delete, company-scoped —
// see docs/conventions.md#company-scoping.
export function registerJenisPenjualan(mock: MockAdapter) {
	mock.onGet('/jenis-penjualan').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((j) => j.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((j) => `${j.code} ${j.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/jenis-penjualan\/\d+$/).reply((config) => {
		const found = live().find((j) => j.id === idOf(config.url) && j.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Jenis penjualan tidak ditemukan' }]
	})

	mock.onPost('/jenis-penjualan').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as Body
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode jenis sudah dipakai'] } }]
		const pendapatan = akunOf(Number(body.akun_pendapatan_id), companyId)
		if (!pendapatan) return [422, { message: 'Validasi gagal', errors: { akun_pendapatan_id: ['Akun pendapatan tidak valid'] } }]
		const hpp = akunOf(Number(body.akun_hpp_id), companyId)
		if (!hpp) return [422, { message: 'Validasi gagal', errors: { akun_hpp_id: ['Akun HPP tidak valid'] } }]
		const persediaan = akunOf(Number(body.akun_persediaan_id), companyId)
		if (!persediaan) return [422, { message: 'Validasi gagal', errors: { akun_persediaan_id: ['Akun persediaan tidak valid'] } }]
		const id = nextId(db.jenisPenjualan)
		const row: JenisPenjualan = {
			id,
			company_id: companyId,
			code: body.code.trim(),
			name: body.name,
			akun_pendapatan_id: pendapatan.id,
			akun_pendapatan_code: pendapatan.code,
			akun_pendapatan_name: pendapatan.name,
			akun_hpp_id: hpp.id,
			akun_hpp_code: hpp.code,
			akun_hpp_name: hpp.name,
			akun_persediaan_id: persediaan.id,
			akun_persediaan_code: persediaan.code,
			akun_persediaan_name: persediaan.name,
			deleted_at: null
		}
		db.jenisPenjualan.unshift(row)
		return [201, { data: row, message: 'Jenis penjualan ditambahkan' }]
	})

	mock.onPut(/\/jenis-penjualan\/\d+$/).reply((config) => {
		const companyId = companyIdOf(config)
		const body = JSON.parse(config.data) as Pick<Body, 'name' | 'akun_pendapatan_id' | 'akun_hpp_id' | 'akun_persediaan_id'>
		const idx = db.jenisPenjualan.findIndex((j) => j.id === idOf(config.url) && !j.deleted_at && j.company_id === companyId)
		if (idx === -1) return [404, { message: 'Jenis penjualan tidak ditemukan' }]
		const pendapatan = akunOf(Number(body.akun_pendapatan_id), companyId as number)
		if (!pendapatan) return [422, { message: 'Validasi gagal', errors: { akun_pendapatan_id: ['Akun pendapatan tidak valid'] } }]
		const hpp = akunOf(Number(body.akun_hpp_id), companyId as number)
		if (!hpp) return [422, { message: 'Validasi gagal', errors: { akun_hpp_id: ['Akun HPP tidak valid'] } }]
		const persediaan = akunOf(Number(body.akun_persediaan_id), companyId as number)
		if (!persediaan) return [422, { message: 'Validasi gagal', errors: { akun_persediaan_id: ['Akun persediaan tidak valid'] } }]
		// code is immutable — ignored even if the client sends it
		db.jenisPenjualan[idx] = {
			...db.jenisPenjualan[idx],
			name: body.name,
			akun_pendapatan_id: pendapatan.id,
			akun_pendapatan_code: pendapatan.code,
			akun_pendapatan_name: pendapatan.name,
			akun_hpp_id: hpp.id,
			akun_hpp_code: hpp.code,
			akun_hpp_name: hpp.name,
			akun_persediaan_id: persediaan.id,
			akun_persediaan_code: persediaan.code,
			akun_persediaan_name: persediaan.name
		}
		return [200, { data: db.jenisPenjualan[idx], message: 'Jenis penjualan diperbarui' }]
	})

	mock.onDelete(/\/jenis-penjualan\/\d+$/).reply((config) => {
		const found = db.jenisPenjualan.find((j) => j.id === idOf(config.url) && !j.deleted_at && j.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Jenis penjualan tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Jenis penjualan dihapus' }]
	})
}
