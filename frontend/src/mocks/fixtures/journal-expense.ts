import type { JournalExpense } from '@/utils/types'

const sampleAttachment = { name: 'bukti-pengeluaran.pdf', type: 'application/pdf', size: 1024, data_url: 'data:application/pdf;base64,JVBERi0xLjQK' }

// Header refs resolve against the account / department / cash-flow fixtures
// (company 1): cash_account_id 1 = Kas Kecil, department_id 1 = FIN,
// line accounts 2 / 6 = expense accounts. Labels are re-resolved by the mock on read.
export const journalExpenseSeed: JournalExpense[] = [
	{
		id: 1,
		number: 'JK-2608-001',
		date: '2026-08-02',
		voucher: 'BKK-2608-001',
		description: 'Pembayaran listrik & internet kantor Agustus',
		attachment: sampleAttachment,
		cash_account_id: 1,
		department_id: 1,
		cash_flow: 'OPERASI_OUT',
		status: 'submitted',
		rejection_reason: null,
		approved_by: null,
		approved_at: null,
		total: 3200000,
		cash_out: 3200000,
		lines: [{ account_id: 2, department_id: null, detail_description: 'Utilitas kantor', debit: 3200000, credit: 0 }]
	},
	{
		id: 2,
		number: 'JK-2608-002',
		date: '2026-08-05',
		voucher: 'BKK-2608-002',
		description: 'Pembayaran gaji & bahan baku produksi',
		attachment: sampleAttachment,
		cash_account_id: 1,
		department_id: 1,
		cash_flow: 'OPERASI_OUT',
		status: 'approved',
		rejection_reason: null,
		approved_by: 'Sri Wahyuni',
		approved_at: '2026-08-05T10:20:00Z',
		total: 6500000,
		cash_out: 6500000,
		lines: [
			{ account_id: 2, department_id: null, detail_description: 'Gaji karyawan', debit: 5000000, credit: 0 },
			{ account_id: 6, department_id: null, detail_description: 'Pembelian bahan baku', debit: 1500000, credit: 0 }
		]
	},
	{
		id: 3,
		number: 'JK-2608-003',
		date: '2026-08-08',
		voucher: 'BKK-2608-003',
		description: 'Reimburse perjalanan dinas',
		attachment: sampleAttachment,
		cash_account_id: 1,
		department_id: 1,
		cash_flow: 'REIMBURSEMENT_INOUT',
		status: 'rejected',
		rejection_reason: 'Bukti perjalanan belum lengkap.',
		approved_by: null,
		approved_at: null,
		total: 2750000,
		cash_out: 2750000,
		lines: [{ account_id: 6, department_id: null, detail_description: 'Transport & akomodasi', debit: 2750000, credit: 0 }]
	},
	{
		id: 4,
		number: 'JK-2608-004',
		date: '2026-08-12',
		voucher: 'BKK-2608-004',
		description: 'Pembayaran jasa maintenance mesin',
		attachment: sampleAttachment,
		cash_account_id: 1,
		department_id: 1,
		cash_flow: 'OPERASI_OUT',
		status: 'submitted',
		rejection_reason: null,
		approved_by: null,
		approved_at: null,
		total: 4100000,
		cash_out: 4100000,
		lines: [{ account_id: 2, department_id: null, detail_description: 'Servis mesin produksi', debit: 4100000, credit: 0 }]
	}
]
