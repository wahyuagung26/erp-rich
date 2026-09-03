import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'

// Contract: docs/dashboard/
export function registerDashboard(mock: MockAdapter) {
	mock.onGet('/dashboard/summary').reply(() => {
		const totalDebit = db.jurnal.reduce((s, j) => s + j.total, 0)
		return [
			200,
			{
				data: {
					kas_bank: 128_450_000,
					piutang: 54_200_000,
					utang: 71_800_000,
					laba_bulan: 39_650_000,
					posting_bulan_ini: db.jurnal.length,
					nilai_transaksi: totalDebit,
					jurnal_terakhir: db.jurnal.slice(0, 5)
				}
			}
		]
	})
}
