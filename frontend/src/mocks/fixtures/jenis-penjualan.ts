import type { JenisPenjualan } from '@/utils/types'

export const jenisPenjualanSeed: JenisPenjualan[] = [
	{
		id: 1,
		company_id: 1,
		code: 'RC0007',
		name: 'Bahan Baku',
		akun_pendapatan_id: 5,
		akun_pendapatan_code: '4000101',
		akun_pendapatan_name: 'Penjualan Produk',
		akun_hpp_id: 6,
		akun_hpp_code: '6000102',
		akun_hpp_name: 'Biaya Bahan Baku',
		akun_persediaan_id: 7,
		akun_persediaan_code: '1000102',
		akun_persediaan_name: 'Persediaan Bahan Baku',
		akun_biaya_id: 2,
		akun_biaya_code: '6000101',
		akun_biaya_name: 'Beban Gaji Pokok',
		deleted_at: null
	}
]
