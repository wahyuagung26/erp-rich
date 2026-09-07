import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Channel } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.channel.filter((c) => !c.deleted_at)

// Uniqueness is per company — two companies may each have their own CH01 code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((c) => c.company_id === companyId && c.code.toLowerCase() === code.trim().toLowerCase() && c.id !== exceptId)

// Client never sends id / code / company_id / deleted_at on update — code is
// immutable, the rest are server-owned.
type ChannelUpdateInput = { name: string; notes: string }

// Contract: docs/channel/ — code is user-entered at create, immutable after
// (ignored on update). Soft delete (deleted_at), never hard-removed. Company-scoped
// — see docs/conventions.md#company-scoping.
export function registerChannel(mock: MockAdapter) {
	mock.onGet('/channel').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((c) => c.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(q))
		}
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/channel\/\d+$/).reply((config) => {
		const found = live().find((c) => c.id === idOf(config.url) && c.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Channel tidak ditemukan' }]
	})

	mock.onPost('/channel').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as { code: string; name: string; notes: string }
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode channel sudah dipakai'] } }]
		const id = nextId(db.channel)
		const row: Channel = { id, company_id: companyId, code: body.code.trim(), name: body.name, notes: body.notes, deleted_at: null }
		db.channel.unshift(row)
		return [201, { data: row, message: 'Channel ditambahkan' }]
	})

	mock.onPut(/\/channel\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as ChannelUpdateInput
		const idx = db.channel.findIndex((c) => c.id === idOf(config.url) && !c.deleted_at && c.company_id === companyIdOf(config))
		if (idx === -1) return [404, { message: 'Channel tidak ditemukan' }]
		// code is immutable — ignored even if the client sends it
		db.channel[idx] = { ...db.channel[idx], name: body.name, notes: body.notes }
		return [200, { data: db.channel[idx], message: 'Channel diperbarui' }]
	})

	mock.onDelete(/\/channel\/\d+$/).reply((config) => {
		const found = db.channel.find((c) => c.id === idOf(config.url) && !c.deleted_at && c.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Channel tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Channel dihapus' }]
	})
}
