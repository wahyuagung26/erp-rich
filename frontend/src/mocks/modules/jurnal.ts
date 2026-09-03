import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { paginate, sortBy, type ListParams } from '../lib'
import type { Jurnal } from '@/utils/types'

// Contract: docs/jurnal/
export function registerJurnal(mock: MockAdapter) {
	mock.onGet('/jurnal').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = db.jurnal
		if (p.q) rows = rows.filter((j) => `${j.number} ${j.description}`.toLowerCase().includes(String(p.q).toLowerCase()))
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onPost('/jurnal').reply((config) => {
		const body = JSON.parse(config.data) as Omit<Jurnal, 'id' | 'number' | 'total'>
		const total = body.lines.reduce((s, l) => s + Number(l.debit || 0), 0)
		const seqNo = String(db.jurnal.length + 1).padStart(3, '0')
		// resolve denormalized code/name from the akun store (backend does this too)
		const lines = body.lines.map((l) => {
			const akun = db.akun.find((a) => a.id === l.akun_id)
			return { ...l, akun_code: akun?.code, akun_name: akun?.name }
		})
		const row: Jurnal = { ...body, lines, id: `j-${Date.now()}`, number: `JU-MOCK-${seqNo}`, total }
		db.jurnal.unshift(row)
		return [201, { data: row, message: 'Jurnal disimpan' }]
	})
}
