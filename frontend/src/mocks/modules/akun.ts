import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import type { Akun } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())

// Contract: docs/akun/
export function registerAkun(mock: MockAdapter) {
	mock.onGet('/akun').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = db.akun
		if (p.q) rows = rows.filter((a) => `${a.code} ${a.name}`.toLowerCase().includes(String(p.q).toLowerCase()))
		if (p.type) rows = rows.filter((a) => a.type === p.type)
		if (p.active !== undefined && p.active !== '') rows = rows.filter((a) => a.active === (p.active === 'true' || p.active === true))
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/akun\/\d+$/).reply((config) => {
		const found = db.akun.find((a) => a.id === idOf(config.url))
		return found ? [200, { data: found }] : [404, { message: 'Akun tidak ditemukan' }]
	})

	mock.onPost('/akun').reply((config) => {
		const body = JSON.parse(config.data) as Omit<Akun, 'id'>
		const row: Akun = { ...body, id: nextId(db.akun) }
		db.akun.unshift(row)
		return [201, { data: row, message: 'Akun ditambahkan' }]
	})

	mock.onPut(/\/akun\/\d+$/).reply((config) => {
		const body = JSON.parse(config.data) as Partial<Akun>
		const idx = db.akun.findIndex((a) => a.id === idOf(config.url))
		if (idx === -1) return [404, { message: 'Akun tidak ditemukan' }]
		db.akun[idx] = { ...db.akun[idx], ...body, id: db.akun[idx].id }
		return [200, { data: db.akun[idx], message: 'Akun diperbarui' }]
	})

	mock.onDelete(/\/akun\/\d+$/).reply((config) => {
		db.akun = db.akun.filter((a) => a.id !== idOf(config.url))
		return [200, { message: 'Akun dihapus' }]
	})
}
