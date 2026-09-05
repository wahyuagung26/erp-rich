import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Warehouse } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.warehouse.filter((w) => !w.deleted_at)

// Uniqueness is per company — two companies may each have their own GD1 code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((w) => w.company_id === companyId && w.code.toLowerCase() === code.trim().toLowerCase() && w.id !== exceptId)

// branch must exist, not be deleted, and belong to the same company.
const branchOf = (branchId: number, companyId: number) => db.branch.find((b) => b.id === branchId && !b.deleted_at && b.company_id === companyId)

// Contract: docs/warehouse/ — code is user-entered at create, immutable after
// (ignored on update). branch_id must belong to the active company; branch_code/
// branch_name are denormalized onto the row (same pattern as JournalLine's account_code/
// account_name). Soft delete (deleted_at), never hard-removed. Company-scoped — see
// docs/conventions.md#company-scoping.
export function registerWarehouse(mock: MockAdapter) {
	mock.onGet('/warehouse').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((w) => w.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((w) => `${w.code} ${w.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/warehouse\/\d+$/).reply((config) => {
		const found = live().find((w) => w.id === idOf(config.url) && w.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Gudang tidak ditemukan' }]
	})

	mock.onPost('/warehouse').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { code: string; name: string; branch_id: number; address?: string }
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode gudang sudah dipakai'] } }]
		const branch = branchOf(Number(body.branch_id), companyId)
		if (!branch) return [422, { message: 'Validasi gagal', errors: { branch_id: ['Cabang tidak valid'] } }]
		const id = nextId(db.warehouse)
		const row: Warehouse = {
			id,
			company_id: companyId,
			code: body.code.trim(),
			name: body.name,
			branch_id: branch.id,
			branch_code: branch.code,
			branch_name: branch.name,
			address: body.address ?? '',
			deleted_at: null
		}
		db.warehouse.unshift(row)
		return [201, { data: row, message: 'Gudang ditambahkan' }]
	})

	mock.onPut(/\/warehouse\/\d+$/).reply((config) => {
		const companyId = companyIdOf(config)
		const body = JSON.parse(config.data) as { name: string; branch_id: number; address?: string }
		const idx = db.warehouse.findIndex((w) => w.id === idOf(config.url) && !w.deleted_at && w.company_id === companyId)
		if (idx === -1) return [404, { message: 'Gudang tidak ditemukan' }]
		const branch = branchOf(Number(body.branch_id), companyId as number)
		if (!branch) return [422, { message: 'Validasi gagal', errors: { branch_id: ['Cabang tidak valid'] } }]
		// code is immutable — ignored even if the client sends it
		db.warehouse[idx] = {
			...db.warehouse[idx],
			name: body.name,
			branch_id: branch.id,
			branch_code: branch.code,
			branch_name: branch.name,
			address: body.address ?? ''
		}
		return [200, { data: db.warehouse[idx], message: 'Gudang diperbarui' }]
	})

	mock.onDelete(/\/warehouse\/\d+$/).reply((config) => {
		const found = db.warehouse.find((w) => w.id === idOf(config.url) && !w.deleted_at && w.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Gudang tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Gudang dihapus' }]
	})
}
