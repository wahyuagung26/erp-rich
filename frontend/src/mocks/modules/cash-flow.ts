import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { paginate, sortBy, type ListParams } from '../lib'

// Contract: docs/cash-flow/ — read-only master data for journal cash-flow picks.
export function registerCashFlow(mock: MockAdapter) {
	mock.onGet('/cash-flow').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = db.cashFlow
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((row) => `${row.code} ${row.name} ${row.group} ${row.position}`.toLowerCase().includes(q))
		}
		return [200, paginate(sortBy(rows, p.sort_by, p.sort_order), p)]
	})
}
