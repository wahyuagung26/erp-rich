import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { PurchaseType } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.purchaseType.filter((t) => !t.deleted_at)

// Code is uppercase A-Z only, 1-5 characters — no digits, no symbols.
const CODE_PATTERN = /^[A-Z]{1,5}$/

// Uniqueness is per company — two companies may each have their own LOKAL code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((t) => t.company_id === companyId && t.code.toLowerCase() === code.trim().toLowerCase() && t.id !== exceptId)

// Client never sends id / code / company_id / deleted_at on update — code is
// immutable, the rest are server-owned.
type PurchaseTypeUpdateInput = { name: string; notes: string }

// Contract: docs/purchase-type/ — code is user-entered at create (uppercase A-Z,
// max 5 chars), immutable after (ignored on update). Soft delete (deleted_at),
// never hard-removed. Company-scoped — see docs/conventions.md#company-scoping.
export function registerPurchaseType(mock: MockAdapter) {
	mock.onGet('/purchase-type').reply((config) => {
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

	mock.onGet(/\/purchase-type\/\d+$/).reply((config) => {
		const found = live().find((t) => t.id === idOf(config.url) && t.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Jenis pembelian tidak ditemukan' }]
	})

	mock.onPost('/purchase-type').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { code: string; name: string; notes: string }
		const code = body.code.trim()
		if (!CODE_PATTERN.test(code)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode harus huruf kapital A-Z, maksimal 5 karakter'] } }]
		if (codeTaken(code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode jenis pembelian sudah dipakai'] } }]
		const id = nextId(db.purchaseType)
		const row: PurchaseType = { id, company_id: companyId, code, name: body.name, notes: body.notes, deleted_at: null }
		db.purchaseType.unshift(row)
		return [201, { data: row, message: 'Jenis pembelian ditambahkan' }]
	})

	mock.onPut(/\/purchase-type\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as PurchaseTypeUpdateInput
		const idx = db.purchaseType.findIndex((t) => t.id === idOf(config.url) && !t.deleted_at && t.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Jenis pembelian tidak ditemukan' }]
		// code is immutable — ignored even if the client sends it
		db.purchaseType[idx] = { ...db.purchaseType[idx], name: body.name, notes: body.notes }
		return [200, { data: db.purchaseType[idx], message: 'Jenis pembelian diperbarui' }]
	})

	mock.onDelete(/\/purchase-type\/\d+$/).reply((config) => {
		const found = db.purchaseType.find((t) => t.id === idOf(config.url) && !t.deleted_at && t.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Jenis pembelian tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Jenis pembelian dihapus' }]
	})
}
