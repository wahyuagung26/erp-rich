import type { TipePembayaran } from '@/utils/types'

export const tipePembayaranSeed: TipePembayaran[] = [
	{
		id: 1,
		company_id: 1,
		code: 'TP01',
		name: 'Tunai',
		akun_perkiraan_id: 1,
		akun_perkiraan_code: '1000101',
		akun_perkiraan_name: 'Kas Kecil',
		transaksi: 'penjualan',
		jenis: 'tunai',
		deleted_at: null
	},
	{
		id: 2,
		company_id: 1,
		code: 'TP02',
		name: 'Uang Muka Penjualan',
		akun_perkiraan_id: 1,
		akun_perkiraan_code: '1000101',
		akun_perkiraan_name: 'Kas Kecil',
		transaksi: 'penjualan',
		jenis: 'uang_muka',
		deleted_at: null
	}
]
