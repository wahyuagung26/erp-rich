import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { TipePembayaran } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.tipePembayaran.filter((t) => !t.deleted_at)

// Uniqueness is per company — two companies may each have their own TP01 code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((t) => t.company_id === companyId && t.code.toLowerCase() === code.trim().toLowerCase() && t.id !== exceptId)

// The referenced akun perkiraan must exist, not be deleted, and belong to the same company.
const akunOf = (akunId: number, companyId: number) => db.akunPerkiraan.find((a) => a.id === akunId && !a.deleted_at && a.company_id === companyId)

interface Body {
	code: string
	name: string
	akun_perkiraan_id: number
	transaksi: TipePembayaran['transaksi']
	jenis: TipePembayaran['jenis']
}

// Contract: docs/tipe-pembayaran/ — code is user-entered at create, immutable
// after (ignored on update). akun_perkiraan_id must belong to the active company;
// its code/name are denormalized onto the row (same pattern as Gudang's
// cabang_code/cabang_name). Soft delete, company-scoped — see
// docs/conventions.md#company-scoping.
export function registerTipePembayaran(mock: MockAdapter) {
	mock.onGet('/tipe-pembayaran').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((t) => t.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((t) => `${t.code} ${t.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/tipe-pembayaran\/\d+$/).reply((config) => {
		const found = live().find((t) => t.id === idOf(config.url) && t.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Tipe pembayaran tidak ditemukan' }]
	})

	mock.onPost('/tipe-pembayaran').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as Body
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode tipe pembayaran sudah dipakai'] } }]
		const akun = akunOf(Number(body.akun_perkiraan_id), companyId)
		if (!akun) return [422, { message: 'Validasi gagal', errors: { akun_perkiraan_id: ['Akun perkiraan tidak valid'] } }]
		const id = nextId(db.tipePembayaran)
		const row: TipePembayaran = {
			id,
			company_id: companyId,
			code: body.code.trim(),
			name: body.name,
			akun_perkiraan_id: akun.id,
			akun_perkiraan_code: akun.code,
			akun_perkiraan_name: akun.name,
			transaksi: body.transaksi,
			jenis: body.jenis,
			deleted_at: null
		}
		db.tipePembayaran.unshift(row)
		return [201, { data: row, message: 'Tipe pembayaran ditambahkan' }]
	})

	mock.onPut(/\/tipe-pembayaran\/\d+$/).reply((config) => {
		const companyId = companyIdOf(config)
		const body = JSON.parse(config.data) as Pick<Body, 'name' | 'akun_perkiraan_id' | 'transaksi' | 'jenis'>
		const idx = db.tipePembayaran.findIndex((t) => t.id === idOf(config.url) && !t.deleted_at && t.company_id === companyId)
		if (idx === -1) return [404, { message: 'Tipe pembayaran tidak ditemukan' }]
		const akun = akunOf(Number(body.akun_perkiraan_id), companyId as number)
		if (!akun) return [422, { message: 'Validasi gagal', errors: { akun_perkiraan_id: ['Akun perkiraan tidak valid'] } }]
		// code is immutable — ignored even if the client sends it
		db.tipePembayaran[idx] = {
			...db.tipePembayaran[idx],
			name: body.name,
			akun_perkiraan_id: akun.id,
			akun_perkiraan_code: akun.code,
			akun_perkiraan_name: akun.name,
			transaksi: body.transaksi,
			jenis: body.jenis
		}
		return [200, { data: db.tipePembayaran[idx], message: 'Tipe pembayaran diperbarui' }]
	})

	mock.onDelete(/\/tipe-pembayaran\/\d+$/).reply((config) => {
		const found = db.tipePembayaran.find((t) => t.id === idOf(config.url) && !t.deleted_at && t.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Tipe pembayaran tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Tipe pembayaran dihapus' }]
	})
}
