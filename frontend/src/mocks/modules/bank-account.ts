import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { BankAccount } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.bankAccount.filter((t) => !t.deleted_at)

// The referenced account must exist, not be deleted, and belong to the same company.
const accountOf = (accountId: number, companyId: number) => db.account.find((a) => a.id === accountId && !a.deleted_at && a.company_id === companyId)

interface Body {
	bank_code: string
	bank_name: string
	account_number: string
	account_holder?: string
	account_id: number
	notes: string
}

// Contract: docs/bank-account/ — no unique code; every field editable on update. account_id must
// belong to the active company; its code/name are denormalized onto the row. Soft delete, company-scoped —
// see docs/conventions.md#company-scoping.
export function registerBankAccount(mock: MockAdapter) {
	mock.onGet('/bank-account').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((t) => t.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((t) => `${t.bank_code} ${t.bank_name} ${t.account_number}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/bank-account\/\d+$/).reply((config) => {
		const found = live().find((t) => t.id === idOf(config.url) && t.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Rekening bank tidak ditemukan' }]
	})

	mock.onPost('/bank-account').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as Body
		const account = accountOf(Number(body.account_id), companyId)
		if (!account) return [422, { message: 'Validasi gagal', errors: { account_id: ['Akun perkiraan tidak valid'] } }]
		const id = nextId(db.bankAccount)
		const row: BankAccount = {
			id,
			company_id: companyId,
			bank_code: body.bank_code.trim(),
			bank_name: body.bank_name.trim(),
			account_number: body.account_number.trim(),
			account_holder: body.account_holder ?? '',
			account_id: account.id,
			account_code: account.code,
			account_name: account.name,
			notes: body.notes,
			deleted_at: null
		}
		db.bankAccount.unshift(row)
		return [201, { data: row, message: 'Rekening bank ditambahkan' }]
	})

	mock.onPut(/\/bank-account\/\d+$/).reply((config) => {
		const companyId = companyIdOf(config)
		const body = JSON.parse(config.data) as Body
		const idx = db.bankAccount.findIndex((t) => t.id === idOf(config.url) && !t.deleted_at && t.company_id === companyId)
		if (idx === -1) return [404, { message: 'Rekening bank tidak ditemukan' }]
		const account = accountOf(Number(body.account_id), companyId as number)
		if (!account) return [422, { message: 'Validasi gagal', errors: { account_id: ['Akun perkiraan tidak valid'] } }]
		db.bankAccount[idx] = {
			...db.bankAccount[idx],
			bank_code: body.bank_code.trim(),
			bank_name: body.bank_name.trim(),
			account_number: body.account_number.trim(),
			account_holder: body.account_holder ?? '',
			account_id: account.id,
			account_code: account.code,
			account_name: account.name,
			notes: body.notes
		}
		return [200, { data: db.bankAccount[idx], message: 'Rekening bank diperbarui' }]
	})

	mock.onDelete(/\/bank-account\/\d+$/).reply((config) => {
		const found = db.bankAccount.find((t) => t.id === idOf(config.url) && !t.deleted_at && t.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Rekening bank tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Rekening bank dihapus' }]
	})
}
