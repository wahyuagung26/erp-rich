import type { CashAdvance, CashAdvanceSettlement } from '@/utils/types'

const sampleAttachment = { name: 'bukti-uang-muka.pdf', type: 'application/pdf', size: 1024, data_url: 'data:application/pdf;base64,JVBERi0xLjQK' }
const settlementAttachment = {
	name: 'kwitansi-penyelesaian.pdf',
	type: 'application/pdf',
	size: 900,
	data_url: 'data:application/pdf;base64,JVBERi0xLjQK'
}

// Header refs resolve against the account / department / cash-flow fixtures
// (company 1): cash_account_id 1/8 = Kas Kecil/Bank BCA, advance_account_id 11 =
// Uang Muka Operasional, department_id 1 = FIN. Labels are re-resolved by the mock on read.
// `used`/`remaining` on rows 2 and 3 are backed by `cashAdvanceSettlementSeed` below
// (their settlement amounts sum to these values); row 5's `used` predates the
// settlement flow and has no backing rows — a submitted advance can't have settlements.
export const cashAdvanceSeed: CashAdvance[] = [
	{
		id: 1,
		number: 'UM-2608-001',
		voucher: 'BKK-2608-001',
		date: '2026-08-04',
		department_id: 1,
		recipient: 'Budi Santoso',
		description: 'Uang muka perjalanan dinas Surabaya',
		amount: 3000000,
		used: 0,
		remaining: 3000000,
		cash_account_id: 1,
		advance_account_id: 11,
		cash_flow: 'OPERASI_OUT',
		attachments: [sampleAttachment],
		status: 'submitted',
		rejection_reason: null,
		approved_by: null,
		approved_at: null
	},
	{
		id: 2,
		number: 'UM-2608-002',
		voucher: 'BKK-2608-002',
		date: '2026-08-07',
		department_id: 1,
		recipient: 'Siti Rahayu',
		description: 'Uang muka pembelian ATK & konsumsi rapat',
		amount: 1500000,
		used: 900000,
		remaining: 600000,
		cash_account_id: 1,
		advance_account_id: 11,
		cash_flow: 'OPERASI_OUT',
		attachments: [sampleAttachment, { ...sampleAttachment, name: 'nota-pendukung.png', type: 'image/png' }],
		status: 'approved',
		rejection_reason: null,
		approved_by: 'Sri Wahyuni',
		approved_at: '2026-08-07T09:30:00Z'
	},
	{
		id: 3,
		number: 'UM-2608-003',
		voucher: 'BKK-2608-003',
		date: '2026-08-11',
		department_id: 1,
		recipient: 'Ahmad Fauzi',
		description: 'Uang muka reimbursement transport tim lapangan',
		amount: 2200000,
		used: 2200000,
		remaining: 0,
		cash_account_id: 8,
		advance_account_id: 11,
		cash_flow: 'REIMBURSEMENT_INOUT',
		attachments: [sampleAttachment],
		status: 'approved',
		rejection_reason: null,
		approved_by: 'Sri Wahyuni',
		approved_at: '2026-08-12T14:00:00Z'
	},
	{
		id: 4,
		number: 'UM-2608-004',
		voucher: 'BKK-2608-004',
		date: '2026-08-15',
		department_id: 1,
		recipient: 'Dewi Lestari',
		description: 'Uang muka acara gathering karyawan',
		amount: 5000000,
		used: 0,
		remaining: 5000000,
		cash_account_id: 1,
		advance_account_id: 11,
		cash_flow: null,
		attachments: [sampleAttachment],
		status: 'rejected',
		rejection_reason: 'Nilai pengajuan melebihi budget acara yang disetujui.',
		approved_by: null,
		approved_at: null
	},
	{
		id: 5,
		number: 'UM-2609-001',
		voucher: 'BKK-2609-001',
		date: '2026-09-03',
		department_id: 1,
		recipient: 'Rudi Hartono',
		description: 'Uang muka operasional cabang mingguan',
		amount: 4000000,
		used: 1200000,
		remaining: 2800000,
		cash_account_id: 9,
		advance_account_id: 11,
		cash_flow: 'OPERASI_OUT',
		attachments: [sampleAttachment],
		status: 'submitted',
		rejection_reason: null,
		approved_by: null,
		approved_at: null
	}
]

// Settlement history — amounts sum to the `used` seeded on cash advances 2 and 3 above.
// Each settlement books its whole amount as one expense line (account 2, department 1).
const expense = (amount: number, detail: string, account_id = 2): CashAdvanceSettlement['lines'][number] => ({
	account_id,
	department_id: 1,
	cash_flow: 'OPERASI_OUT',
	detail_description: detail,
	debit: amount,
	credit: 0
})
const settlement = (
	id: number,
	cash_advance_id: number,
	number: string,
	date: string,
	amount: number,
	remaining_after: number,
	description: string
): CashAdvanceSettlement => ({
	id,
	cash_advance_id,
	number,
	date,
	description,
	attachments: [settlementAttachment],
	lines: [expense(amount, description)],
	amount,
	remaining_after
})

export const cashAdvanceSettlementSeed: CashAdvanceSettlement[] = [
	settlement(1, 2, 'PU-2608-001', '2026-08-10', 500000, 1000000, 'Pembelian ATK kantor'),
	settlement(2, 2, 'PU-2608-002', '2026-08-20', 400000, 600000, 'Konsumsi rapat bulanan'),
	settlement(3, 3, 'PU-2608-003', '2026-08-15', 1200000, 1000000, 'Biaya transport tim lapangan'),
	settlement(4, 3, 'PU-2608-004', '2026-08-25', 1000000, 0, 'Biaya transport tim lapangan (lanjutan)')
]
