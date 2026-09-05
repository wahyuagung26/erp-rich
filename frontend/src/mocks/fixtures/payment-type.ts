import type { PaymentType } from '@/utils/types'

export const paymentTypeSeed: PaymentType[] = [
	{
		id: 1,
		company_id: 1,
		code: 'TP01',
		name: 'Tunai',
		account_id: 1,
		account_code: '1000101',
		account_name: 'Kas Kecil',
		transaction_type: 'sale',
		method: 'cash',
		deleted_at: null
	},
	{
		id: 2,
		company_id: 1,
		code: 'TP02',
		name: 'Uang Muka Penjualan',
		account_id: 1,
		account_code: '1000101',
		account_name: 'Kas Kecil',
		transaction_type: 'sale',
		method: 'down_payment',
		deleted_at: null
	}
]
