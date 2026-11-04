import type { SalesExpense } from '@/utils/types'

export const salesExpenseSeed: SalesExpense[] = [
	{
		id: 1,
		company_id: 1,
		code: 'BP01',
		name: 'Biaya Pengiriman',
		account_id: 2,
		account_code: '6000101',
		account_name: 'Beban Gaji Pokok',
		notes: 'Ongkos kirim ke pelanggan',
		deleted_at: null
	}
]
