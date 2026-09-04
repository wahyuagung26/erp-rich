import type { AkunPerkiraan } from '@/utils/types'

export const akunPerkiraanSeed: AkunPerkiraan[] = [
	{
		id: 1,
		company_id: 1,
		sub_akun_id: 1,
		sub_akun_code: '10001',
		sub_akun_name: 'Kas',
		code: '1000101',
		name: 'Kas Kecil',
		type: 'asset',
		deleted_at: null
	},
	{
		id: 2,
		company_id: 1,
		sub_akun_id: 2,
		sub_akun_code: '60001',
		sub_akun_name: 'Beban Gaji',
		code: '6000101',
		name: 'Beban Gaji Pokok',
		type: 'expense',
		deleted_at: null
	},
	{
		id: 3,
		company_id: 2,
		sub_akun_id: 3,
		sub_akun_code: '40001',
		sub_akun_name: 'Pendapatan Jasa',
		code: '4000101',
		name: 'Pendapatan Jasa Konsultasi',
		type: 'revenue',
		deleted_at: null
	},
	{
		id: 4,
		company_id: 3,
		sub_akun_id: 4,
		sub_akun_code: '20001',
		sub_akun_name: 'Utang Usaha',
		code: '2000101',
		name: 'Utang Usaha Supplier',
		type: 'liability',
		deleted_at: null
	},
	{
		id: 5,
		company_id: 1,
		sub_akun_id: 5,
		sub_akun_code: '40001',
		sub_akun_name: 'Penjualan',
		code: '4000101',
		name: 'Penjualan Produk',
		type: 'revenue',
		deleted_at: null
	},
	{
		id: 6,
		company_id: 1,
		sub_akun_id: 2,
		sub_akun_code: '60001',
		sub_akun_name: 'Beban Gaji',
		code: '6000102',
		name: 'Biaya Bahan Baku',
		type: 'expense',
		deleted_at: null
	},
	{
		id: 7,
		company_id: 1,
		sub_akun_id: 1,
		sub_akun_code: '10001',
		sub_akun_name: 'Kas',
		code: '1000102',
		name: 'Persediaan Bahan Baku',
		type: 'asset',
		deleted_at: null
	}
]
