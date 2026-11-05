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
		method: 'cash_bank',
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
	},
	// Purchase-side types used by Hutang Supplier payments (cash/bank out, and offset against a purchase return).
	{
		id: 3,
		company_id: 1,
		code: 'TP03',
		name: 'Transfer Bank',
		account_id: 17,
		account_code: '1001302',
		account_name: 'Bank CIMB Niaga - 9200 (IDR)',
		transaction_type: 'purchase',
		method: 'cash_bank',
		deleted_at: null
	},
	{
		id: 4,
		company_id: 1,
		code: 'TP04',
		name: 'Potong Retur Pembelian',
		account_id: 1,
		account_code: '1000101',
		account_name: 'Kas Kecil',
		transaction_type: 'purchase',
		method: 'return_deduction',
		deleted_at: null
	},
	{
		id: 5,
		company_id: 1,
		code: 'TP05',
		name: 'Uang Muka Supplier',
		account_id: 1,
		account_code: '1000101',
		account_name: 'Kas Kecil',
		transaction_type: 'purchase',
		method: 'down_payment',
		deleted_at: null
	}
]
