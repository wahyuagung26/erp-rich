import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { SalesType } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.salesType.filter((s) => !s.deleted_at)

// Uniqueness is per company — two companies may each have their own RC0007 code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((s) => s.company_id === companyId && s.code.toLowerCase() === code.trim().toLowerCase() && s.id !== exceptId)

// The referenced account must exist, not be deleted, and belong to the same company.
const accountOf = (accountId: number, companyId: number) => db.account.find((a) => a.id === accountId && !a.deleted_at && a.company_id === companyId)

interface Body {
	code: string
	name: string
	revenue_account_id: number
	cogs_account_id: number
	inventory_account_id: number
	expense_account_id: number
}

// Contract: docs/sales-type/ — code is user-entered at create, immutable
// after (ignored on update). The four account_*_id references must each belong to
// the active company; their code/name are denormalized onto the row (same
// pattern as Warehouse's branch_code/branch_name). Soft delete, company-scoped —
// see docs/conventions.md#company-scoping.
export function registerSalesType(mock: MockAdapter) {
	mock.onGet('/sales-type').reply((config) => {
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

	mock.onGet(/\/sales-type\/\d+$/).reply((config) => {
		const found = live().find((s) => s.id === idOf(config.url) && s.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Jenis penjualan tidak ditemukan' }]
	})

	mock.onPost('/sales-type').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as Body
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode jenis sudah dipakai'] } }]
		const revenueAccount = accountOf(Number(body.revenue_account_id), companyId)
		if (!revenueAccount) return [422, { message: 'Validasi gagal', errors: { revenue_account_id: ['Akun pendapatan tidak valid'] } }]
		const cogsAccount = accountOf(Number(body.cogs_account_id), companyId)
		if (!cogsAccount) return [422, { message: 'Validasi gagal', errors: { cogs_account_id: ['Akun HPP tidak valid'] } }]
		const inventoryAccount = accountOf(Number(body.inventory_account_id), companyId)
		if (!inventoryAccount) return [422, { message: 'Validasi gagal', errors: { inventory_account_id: ['Akun persediaan tidak valid'] } }]
		const expenseAccount = accountOf(Number(body.expense_account_id), companyId)
		if (!expenseAccount) return [422, { message: 'Validasi gagal', errors: { expense_account_id: ['Akun biaya tidak valid'] } }]
		const id = nextId(db.salesType)
		const row: SalesType = {
			id,
			company_id: companyId,
			code: body.code.trim(),
			name: body.name,
			revenue_account_id: revenueAccount.id,
			revenue_account_code: revenueAccount.code,
			revenue_account_name: revenueAccount.name,
			cogs_account_id: cogsAccount.id,
			cogs_account_code: cogsAccount.code,
			cogs_account_name: cogsAccount.name,
			inventory_account_id: inventoryAccount.id,
			inventory_account_code: inventoryAccount.code,
			inventory_account_name: inventoryAccount.name,
			expense_account_id: expenseAccount.id,
			expense_account_code: expenseAccount.code,
			expense_account_name: expenseAccount.name,
			deleted_at: null
		}
		db.salesType.unshift(row)
		return [201, { data: row, message: 'Jenis penjualan ditambahkan' }]
	})

	mock.onPut(/\/sales-type\/\d+$/).reply((config) => {
		const companyId = companyIdOf(config)
		const body = JSON.parse(config.data) as Pick<
			Body,
			'name' | 'revenue_account_id' | 'cogs_account_id' | 'inventory_account_id' | 'expense_account_id'
		>
		const idx = db.salesType.findIndex((s) => s.id === idOf(config.url) && !s.deleted_at && s.company_id === companyId)
		if (idx === -1) return [404, { message: 'Jenis penjualan tidak ditemukan' }]
		const revenueAccount = accountOf(Number(body.revenue_account_id), companyId as number)
		if (!revenueAccount) return [422, { message: 'Validasi gagal', errors: { revenue_account_id: ['Akun pendapatan tidak valid'] } }]
		const cogsAccount = accountOf(Number(body.cogs_account_id), companyId as number)
		if (!cogsAccount) return [422, { message: 'Validasi gagal', errors: { cogs_account_id: ['Akun HPP tidak valid'] } }]
		const inventoryAccount = accountOf(Number(body.inventory_account_id), companyId as number)
		if (!inventoryAccount) return [422, { message: 'Validasi gagal', errors: { inventory_account_id: ['Akun persediaan tidak valid'] } }]
		const expenseAccount = accountOf(Number(body.expense_account_id), companyId as number)
		if (!expenseAccount) return [422, { message: 'Validasi gagal', errors: { expense_account_id: ['Akun biaya tidak valid'] } }]
		// code is immutable — ignored even if the client sends it
		db.salesType[idx] = {
			...db.salesType[idx],
			name: body.name,
			revenue_account_id: revenueAccount.id,
			revenue_account_code: revenueAccount.code,
			revenue_account_name: revenueAccount.name,
			cogs_account_id: cogsAccount.id,
			cogs_account_code: cogsAccount.code,
			cogs_account_name: cogsAccount.name,
			inventory_account_id: inventoryAccount.id,
			inventory_account_code: inventoryAccount.code,
			inventory_account_name: inventoryAccount.name,
			expense_account_id: expenseAccount.id,
			expense_account_code: expenseAccount.code,
			expense_account_name: expenseAccount.name
		}
		return [200, { data: db.salesType[idx], message: 'Jenis penjualan diperbarui' }]
	})

	mock.onDelete(/\/sales-type\/\d+$/).reply((config) => {
		const found = db.salesType.find((s) => s.id === idOf(config.url) && !s.deleted_at && s.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Jenis penjualan tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Jenis penjualan dihapus' }]
	})
}
