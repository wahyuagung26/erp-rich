import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'

// Contract: docs/dashboard/
export function registerDashboard(mock: MockAdapter) {
	mock.onGet('/dashboard/summary').reply(() => {
		const totalDebit = db.journal.reduce((s, j) => s + j.total, 0)
		return [
			200,
			{
				data: {
					cash_bank: 128_450_000,
					receivables: 54_200_000,
					payables: 71_800_000,
					period_profit: 39_650_000,
					journal_entries_this_period: db.journal.length,
					transaction_value: totalDebit,
					recent_journals: db.journal.slice(0, 5)
				}
			}
		]
	})
}
