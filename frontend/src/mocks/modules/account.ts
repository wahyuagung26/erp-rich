import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Account } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.account.filter((a) => !a.deleted_at)

// Uniqueness is per company — two companies may each have their own 1000101 code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((a) => a.company_id === companyId && a.code === code && a.id !== exceptId)

// sub_account must exist, not be deleted, and belong to the same company.
const subAccountOf = (subAccountId: number, companyId: number) =>
	db.subAccount.find((s) => s.id === subAccountId && !s.deleted_at && s.company_id === companyId)

// Contract: docs/account/ — `code` is server-composed: first 5 digits from
// the sub account's (already 5-digit) code, last 2 from the user-entered `code_suffix`.
// Both `sub_account_id` and the resulting `code` are immutable after create (ignored
// on update). sub_account_code/sub_account_name are denormalized (same pattern as
// SubAccount's account_group_code/account_group_name). Soft delete, company-scoped — see
// docs/conventions.md#company-scoping.
export function registerAccount(mock: MockAdapter) {
	mock.onGet('/account').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((a) => a.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((a) => `${a.code} ${a.name}`.toLowerCase().includes(q))
		}
		if (p.type) rows = rows.filter((a) => a.type === p.type)
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/account\/\d+$/).reply((config) => {
		const found = live().find((a) => a.id === idOf(config.url) && a.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Akun perkiraan tidak ditemukan' }]
	})

	mock.onPost('/account').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { sub_account_id: number; code_suffix: string; name: string; type: Account['type'] }
		const subAccount = subAccountOf(Number(body.sub_account_id), companyId)
		if (!subAccount) return [422, { message: 'Validasi gagal', errors: { sub_account_id: ['Sub akun tidak valid'] } }]
		if (!/^\d{2}$/.test(String(body.code_suffix ?? '').trim()))
			return [422, { message: 'Validasi gagal', errors: { code_suffix: ['Kode harus angka, tepat 2 digit'] } }]
		const code = `${subAccount.code}${body.code_suffix.trim()}`
		if (codeTaken(code, companyId)) return [422, { message: 'Validasi gagal', errors: { code_suffix: ['Kode akun perkiraan sudah dipakai'] } }]
		const id = nextId(db.account)
		const row: Account = {
			id,
			company_id: companyId,
			sub_account_id: subAccount.id,
			sub_account_code: subAccount.code,
			sub_account_name: subAccount.name,
			code,
			name: body.name,
			type: body.type,
			deleted_at: null
		}
		db.account.unshift(row)
		return [201, { data: row, message: 'Akun perkiraan ditambahkan' }]
	})

	mock.onPut(/\/account\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as { name: string; type: Account['type'] }
		const idx = db.account.findIndex((a) => a.id === idOf(config.url) && !a.deleted_at && a.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Akun perkiraan tidak ditemukan' }]
		// sub_account_id and code are immutable — ignored even if sent
		db.account[idx] = { ...db.account[idx], name: body.name, type: body.type }
		return [200, { data: db.account[idx], message: 'Akun perkiraan diperbarui' }]
	})

	mock.onDelete(/\/account\/\d+$/).reply((config) => {
		const found = db.account.find((a) => a.id === idOf(config.url) && !a.deleted_at && a.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Akun perkiraan tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Akun perkiraan dihapus' }]
	})
}
