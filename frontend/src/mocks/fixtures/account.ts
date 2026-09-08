import type { Account } from '@/utils/types'

export const accountSeed: Account[] = [
	{
		id: 1,
		company_id: 1,
		sub_account_id: 1,
		sub_account_code: '10001',
		sub_account_name: 'Kas',
		code: '1000101',
		name: 'Kas Kecil',
		type: 'cash_bank',
		deleted_at: null
	},
	{
		id: 2,
		company_id: 1,
		sub_account_id: 2,
		sub_account_code: '60001',
		sub_account_name: 'Beban Gaji',
		code: '6000101',
		name: 'Beban Gaji Pokok',
		type: 'expense',
		deleted_at: null
	},
	{
		id: 3,
		company_id: 2,
		sub_account_id: 3,
		sub_account_code: '40001',
		sub_account_name: 'Pendapatan Jasa',
		code: '4000101',
		name: 'Pendapatan Jasa Konsultasi',
		type: 'revenue',
		deleted_at: null
	},
	{
		id: 4,
		company_id: 3,
		sub_account_id: 4,
		sub_account_code: '20001',
		sub_account_name: 'Utang Usaha',
		code: '2000101',
		name: 'Utang Usaha Supplier',
		type: 'liability',
		deleted_at: null
	},
	{
		id: 5,
		company_id: 1,
		sub_account_id: 5,
		sub_account_code: '40001',
		sub_account_name: 'Penjualan',
		code: '4000101',
		name: 'Penjualan Produk',
		type: 'revenue',
		deleted_at: null
	},
	{
		id: 6,
		company_id: 1,
		sub_account_id: 2,
		sub_account_code: '60001',
		sub_account_name: 'Beban Gaji',
		code: '6000102',
		name: 'Biaya Bahan Baku',
		type: 'expense',
		deleted_at: null
	},
	{
		id: 7,
		company_id: 1,
		sub_account_id: 1,
		sub_account_code: '10001',
		sub_account_name: 'Kas',
		code: '1000102',
		name: 'Persediaan Bahan Baku',
		type: 'asset',
		deleted_at: null
	},
	{
		id: 8,
		company_id: 1,
		sub_account_id: 1,
		sub_account_code: '10001',
		sub_account_name: 'Kas',
		code: '1000103',
		name: 'Bank BCA',
		type: 'cash_bank',
		deleted_at: null
	},
	{
		id: 9,
		company_id: 1,
		sub_account_id: 1,
		sub_account_code: '10001',
		sub_account_name: 'Kas',
		code: '1000104',
		name: 'Bank Mandiri',
		type: 'cash_bank',
		deleted_at: null
	},
	{
		id: 10,
		company_id: 1,
		sub_account_id: 1,
		sub_account_code: '10001',
		sub_account_name: 'Kas',
		code: '1000105',
		name: 'Kas Besar',
		type: 'cash_bank',
		deleted_at: null
	},
	{
		id: 11,
		company_id: 1,
		sub_account_id: 1,
		sub_account_code: '10001',
		sub_account_name: 'Kas',
		code: '1000106',
		name: 'Uang Muka Operasional',
		type: 'asset',
		deleted_at: null
	},
	// Observed RICH tenant (company 1) cash & bank accounts used by the supplier-advance module.
	{
		id: 12,
		company_id: 1,
		sub_account_id: 1,
		sub_account_code: '10001',
		sub_account_name: 'Kas',
		code: '1001001',
		name: 'Kas Kecil Operasional',
		type: 'cash_bank',
		deleted_at: null
	},
	{
		id: 13,
		company_id: 1,
		sub_account_id: 1,
		sub_account_code: '10001',
		sub_account_name: 'Kas',
		code: '1001002',
		name: 'Kas Kecil Tagihan',
		type: 'cash_bank',
		deleted_at: null
	},
	{
		id: 14,
		company_id: 1,
		sub_account_id: 1,
		sub_account_code: '10001',
		sub_account_name: 'Kas',
		code: '1001003',
		name: 'Kas Kecil Produksi',
		type: 'cash_bank',
		deleted_at: null
	},
	{
		id: 15,
		company_id: 1,
		sub_account_id: 1,
		sub_account_code: '10001',
		sub_account_name: 'Kas',
		code: '1001101',
		name: 'E-Money',
		type: 'cash_bank',
		deleted_at: null
	},
	{
		id: 16,
		company_id: 1,
		sub_account_id: 1,
		sub_account_code: '10001',
		sub_account_name: 'Kas',
		code: '1001301',
		name: 'Bank SMBC - 5128 (IDR)',
		type: 'cash_bank',
		deleted_at: null
	},
	{
		id: 17,
		company_id: 1,
		sub_account_id: 1,
		sub_account_code: '10001',
		sub_account_name: 'Kas',
		code: '1001302',
		name: 'Bank CIMB Niaga - 9200 (IDR)',
		type: 'cash_bank',
		deleted_at: null
	}
]
