import type { BudgetDocument, BudgetLine, RevisionPeriod } from '@/views/budgeting/types'
import { sumDocument } from '@/views/budgeting/types'

const year = new Date().getFullYear()
const lines: BudgetLine[] = [
	{
		account_id: 5,
		account_code: '4000101',
		account_name: 'Penjualan Produk',
		section: 'Pendapatan',
		prefix: 'EXP',
		sign: 1,
		code: `EXP/OBG${year}/FAT/001`,
		description: 'Penjualan produk',
		months: Array(12).fill(50000000)
	},
	{
		account_id: 90002,
		account_code: '5000101',
		account_name: 'Harga Pokok Penjualan',
		section: 'Harga Pokok Penjualan',
		prefix: 'EXP',
		sign: -1,
		code: `EXP/OBG${year}/FAT/003`,
		description: 'Cadangan HPP',
		months: Array(12).fill(0)
	},
	{
		account_id: 2,
		account_code: '6000101',
		account_name: 'Beban Gaji Pokok',
		section: 'Beban Umum & Administrasi',
		prefix: 'EXP',
		sign: -1,
		code: `EXP/OBG${year}/FAT/002`,
		description: 'Gaji tim',
		months: Array(12).fill(15000000)
	}
]
export const budgetSeed: BudgetDocument[] = [
	{
		id: 1,
		company_id: 1,
		number: `BGT/${year}/001`,
		department_id: 4,
		department_code: 'FAT',
		department_name: 'FAT',
		year,
		description: 'Rencana tahunan departemen FAT',
		status: 'Disetujui',
		created_by: 'Admin',
		created_at: `${year}-01-05T09:00:00`,
		lines,
		total: sumDocument(lines),
		history: [{ action: 'Disetujui', at: `${year}-01-06T09:00:00`, note: 'Disetujui', from: 'Diajukan', to: 'Disetujui', by: 'Admin' }],
		ytd_snapshot: { '4000101': 0, '6000101': 0 },
		ytd_snapshot_year: year,
		ytd_snapshot_month: 0
	}
]
export const revisionSeed: BudgetDocument[] = []
export const budgetPeriodSeed: Record<number, RevisionPeriod> = {}
