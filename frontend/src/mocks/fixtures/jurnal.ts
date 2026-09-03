import type { Jurnal } from '@/utils/types'

export const jurnalSeed: Jurnal[] = [
	{
		id: 1,
		date: '2026-08-01',
		number: 'JU-2608-001',
		description: 'Pembayaran sewa kantor Agustus',
		total: 15000000,
		lines: [
			{ akun_id: 15, akun_code: '6-6100', akun_name: 'Beban Sewa', debit: 15000000, credit: 0 },
			{ akun_id: 2, akun_code: '1-1100', akun_name: 'Bank BCA', debit: 0, credit: 15000000 }
		]
	},
	{
		id: 2,
		date: '2026-08-03',
		number: 'JU-2608-002',
		description: 'Penjualan tunai',
		total: 8500000,
		lines: [
			{ akun_id: 1, akun_code: '1-1000', akun_name: 'Kas', debit: 8500000, credit: 0 },
			{ akun_id: 11, akun_code: '4-4000', akun_name: 'Pendapatan Penjualan', debit: 0, credit: 8500000 }
		]
	},
	{
		id: 3,
		date: '2026-08-05',
		number: 'JU-2608-003',
		description: 'Pembayaran gaji karyawan',
		total: 42000000,
		lines: [
			{ akun_id: 14, akun_code: '6-6000', akun_name: 'Beban Gaji', debit: 42000000, credit: 0 },
			{ akun_id: 2, akun_code: '1-1100', akun_name: 'Bank BCA', debit: 0, credit: 40000000 },
			{ akun_id: 7, akun_code: '2-2100', akun_name: 'Utang Pajak', debit: 0, credit: 2000000 }
		]
	},
	{
		id: 4,
		date: '2026-08-09',
		number: 'JU-2608-004',
		description: 'Pembelian persediaan kredit',
		total: 23750000,
		lines: [
			{ akun_id: 4, akun_code: '1-1300', akun_name: 'Persediaan Barang', debit: 23750000, credit: 0 },
			{ akun_id: 6, akun_code: '2-2000', akun_name: 'Utang Usaha', debit: 0, credit: 23750000 }
		]
	},
	{
		id: 5,
		date: '2026-08-12',
		number: 'JU-2608-005',
		description: 'Penerimaan pelunasan piutang',
		total: 12300000,
		lines: [
			{ akun_id: 2, akun_code: '1-1100', akun_name: 'Bank BCA', debit: 12300000, credit: 0 },
			{ akun_id: 3, akun_code: '1-1200', akun_name: 'Piutang Usaha', debit: 0, credit: 12300000 }
		]
	}
]
