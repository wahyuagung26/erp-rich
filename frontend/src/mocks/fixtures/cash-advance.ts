import type { CashAdvance, CashAdvanceSettlement } from '@/utils/types'

const sampleAttachment = { name: 'bukti-uang-muka.pdf', type: 'application/pdf', size: 1024, data_url: 'data:application/pdf;base64,JVBERi0xLjQK' }
const notaImage = {
	name: 'nota-pendukung.png',
	type: 'image/png',
	size: 1755,
	data_url:
		'data:image/png;base64,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'
}
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
		created_by: 'Sri Wahyuni',
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
		created_by: 'Sri Wahyuni',
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
		attachments: [sampleAttachment, notaImage],
		status: 'approved',
		rejection_reason: null,
		approved_by: 'Sri Wahyuni',
		approved_at: '2026-08-07T09:30:00Z'
	},
	{
		id: 3,
		number: 'UM-2608-003',
		voucher: 'BKK-2608-003',
		created_by: 'Sri Wahyuni',
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
		created_by: 'Sri Wahyuni',
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
		created_by: 'Sri Wahyuni',
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
	description: string,
	extra: CashAdvanceSettlement['attachments'] = []
): CashAdvanceSettlement => ({
	id,
	cash_advance_id,
	number,
	created_by: 'Sri Wahyuni',
	date,
	description,
	attachments: [settlementAttachment, ...extra],
	lines: [expense(amount, description)],
	amount,
	remaining_after
})

export const cashAdvanceSettlementSeed: CashAdvanceSettlement[] = [
	settlement(1, 2, 'PU-2608-001', '2026-08-10', 500000, 1000000, 'Pembelian ATK kantor', [notaImage]),
	settlement(2, 2, 'PU-2608-002', '2026-08-20', 400000, 600000, 'Konsumsi rapat bulanan'),
	settlement(3, 3, 'PU-2608-003', '2026-08-15', 1200000, 1000000, 'Biaya transport tim lapangan'),
	settlement(4, 3, 'PU-2608-004', '2026-08-25', 1000000, 0, 'Biaya transport tim lapangan (lanjutan)')
]
