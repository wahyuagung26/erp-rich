import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import type { Journal } from '@/utils/types'

// Contract: docs/journal/
export function registerJournal(mock: MockAdapter) {
	mock.onGet('/journal').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = db.journal
		if (p.q) rows = rows.filter((j) => `${j.number} ${j.description}`.toLowerCase().includes(String(p.q).toLowerCase()))
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onPost('/journal').reply((config) => {
		const body = JSON.parse(config.data) as Omit<Journal, 'id' | 'number' | 'total'>
		const total = body.lines.reduce((s, l) => s + Number(l.debit || 0), 0)
		const seqNo = String(db.journal.length + 1).padStart(3, '0')
		// resolve denormalized code/name from the account store (backend does this too)
		const lines = body.lines.map((l) => {
			const account = db.account.find((a) => a.id === Number(l.account_id))
			return { ...l, account_id: Number(l.account_id), account_code: account?.code, account_name: account?.name }
		})
		const row: Journal = { ...body, lines, id: nextId(db.journal), number: `JU-MOCK-${seqNo}`, total }
		db.journal.unshift(row)
		return [201, { data: row, message: 'Jurnal disimpan' }]
	})
}
