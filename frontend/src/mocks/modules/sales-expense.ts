import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { SalesExpense } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.salesExpense.filter((t) => !t.deleted_at)

// Uniqueness is per company — two companies may each have their own BP01 code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((t) => t.company_id === companyId && t.code.toLowerCase() === code.trim().toLowerCase() && t.id !== exceptId)

// The referenced account must exist, not be deleted, and belong to the same company.
const accountOf = (accountId: number, companyId: number) => db.account.find((a) => a.id === accountId && !a.deleted_at && a.company_id === companyId)

interface Body {
	code: string
	name: string
	account_id: number
	notes?: string
}

// Contract: docs/sales-expense/ — code is user-entered at create, immutable
// after (ignored on update). account_id must belong to the active company;
// its code/name are denormalized onto the row (same pattern as Warehouse's
// branch_code/branch_name). Soft delete, company-scoped — see
// docs/conventions.md#company-scoping.
export function registerSalesExpense(mock: MockAdapter) {
	mock.onGet('/sales-expense').reply((config) => {
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

	mock.onGet(/\/sales-expense\/\d+$/).reply((config) => {
		const found = live().find((t) => t.id === idOf(config.url) && t.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Biaya penjualan tidak ditemukan' }]
	})

	mock.onPost('/sales-expense').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as Body
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode biaya sudah dipakai'] } }]
		const account = accountOf(Number(body.account_id), companyId)
		if (!account) return [422, { message: 'Validasi gagal', errors: { account_id: ['Akun biaya tidak valid'] } }]
		const id = nextId(db.salesExpense)
		const row: SalesExpense = {
			id,
			company_id: companyId,
			code: body.code.trim(),
			name: body.name,
			account_id: account.id,
			account_code: account.code,
			account_name: account.name,
			notes: body.notes ?? '',
			deleted_at: null
		}
		db.salesExpense.unshift(row)
		return [201, { data: row, message: 'Biaya penjualan ditambahkan' }]
	})

	mock.onPut(/\/sales-expense\/\d+$/).reply((config) => {
		const companyId = companyIdOf(config)
		const body = JSON.parse(config.data) as Pick<Body, 'name' | 'account_id' | 'notes'>
		const idx = db.salesExpense.findIndex((t) => t.id === idOf(config.url) && !t.deleted_at && t.company_id === companyId)
		if (idx === -1) return [404, { message: 'Biaya penjualan tidak ditemukan' }]
		const account = accountOf(Number(body.account_id), companyId as number)
		if (!account) return [422, { message: 'Validasi gagal', errors: { account_id: ['Akun biaya tidak valid'] } }]
		// code is immutable — ignored even if the client sends it
		db.salesExpense[idx] = {
			...db.salesExpense[idx],
			name: body.name,
			account_id: account.id,
			account_code: account.code,
			account_name: account.name,
			notes: body.notes ?? ''
		}
		return [200, { data: db.salesExpense[idx], message: 'Biaya penjualan diperbarui' }]
	})

	mock.onDelete(/\/sales-expense\/\d+$/).reply((config) => {
		const found = db.salesExpense.find((t) => t.id === idOf(config.url) && !t.deleted_at && t.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Biaya penjualan tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Biaya penjualan dihapus' }]
	})
}
