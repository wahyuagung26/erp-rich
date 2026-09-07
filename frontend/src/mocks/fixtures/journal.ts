import type { Journal } from '@/utils/types'

const sampleAttachment = { name: 'bukti-jurnal.pdf', type: 'application/pdf', size: 1024, data_url: 'data:application/pdf;base64,JVBERi0xLjQK' }

export const journalSeed: Journal[] = [
	{
		id: 1,
		date: '2026-08-01',
		number: 'JU-2608-001',
		voucher: 'VCR-2608-001',
		description: 'Pembayaran sewa kantor Agustus',
		attachment: sampleAttachment,
		status: 'submitted',
		rejection_reason: null,
		approved_by: null,
		approved_at: null,
		total: 15000000,
		lines: [
			{ account_id: 15, account_code: '6-6100', account_name: 'Beban Sewa', debit: 15000000, credit: 0 },
			{ account_id: 2, account_code: '1-1100', account_name: 'Bank BCA', debit: 0, credit: 15000000 }
		]
	},
	{
		id: 2,
		date: '2026-08-03',
		number: 'JU-2608-002',
		voucher: 'VCR-2608-002',
		description: 'Penjualan tunai',
		attachment: sampleAttachment,
		status: 'approved',
		rejection_reason: null,
		approved_by: 'Sri Wahyuni',
		approved_at: '2026-08-03T09:15:00Z',
		total: 8500000,
		lines: [
			{ account_id: 1, account_code: '1-1000', account_name: 'Kas', debit: 8500000, credit: 0 },
			{ account_id: 11, account_code: '4-4000', account_name: 'Pendapatan Penjualan', debit: 0, credit: 8500000 }
		]
	},
	{
		id: 3,
		date: '2026-08-05',
		number: 'JU-2608-003',
		voucher: 'VCR-2608-003',
		description: 'Pembayaran gaji karyawan',
		attachment: sampleAttachment,
		status: 'rejected',
		rejection_reason: 'Keterangan jurnal perlu diperjelas.',
		approved_by: null,
		approved_at: null,
		total: 42000000,
		lines: [
			{ account_id: 14, account_code: '6-6000', account_name: 'Beban Gaji', debit: 42000000, credit: 0 },
			{ account_id: 2, account_code: '1-1100', account_name: 'Bank BCA', debit: 0, credit: 40000000 },
			{ account_id: 7, account_code: '2-2100', account_name: 'Utang Pajak', debit: 0, credit: 2000000 }
		]
	},
	{
		id: 4,
		date: '2026-08-09',
		number: 'JU-2608-004',
		voucher: 'VCR-2608-004',
		description: 'Pembelian persediaan kredit',
		attachment: sampleAttachment,
		status: 'submitted',
		rejection_reason: null,
		approved_by: null,
		approved_at: null,
		total: 23750000,
		lines: [
			{ account_id: 4, account_code: '1-1300', account_name: 'Persediaan Barang', debit: 23750000, credit: 0 },
			{ account_id: 6, account_code: '2-2000', account_name: 'Utang Usaha', debit: 0, credit: 23750000 }
		]
	},
	{
		id: 5,
		date: '2026-08-12',
		number: 'JU-2608-005',
		voucher: 'VCR-2608-005',
		description: 'Penerimaan pelunasan piutang',
		attachment: sampleAttachment,
		status: 'submitted',
		rejection_reason: null,
		approved_by: null,
		approved_at: null,
		total: 12300000,
		lines: [
			{ account_id: 2, account_code: '1-1100', account_name: 'Bank BCA', debit: 12300000, credit: 0 },
			{ account_id: 3, account_code: '1-1200', account_name: 'Piutang Usaha', debit: 0, credit: 12300000 }
		]
	}
]
