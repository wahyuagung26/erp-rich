import type { SubAccount } from '@/utils/types'

export const subAccountSeed: SubAccount[] = [
	{
		id: 1,
		company_id: 1,
		account_group_id: 1,
		account_group_code: '10',
		account_group_name: 'Aset',
		code: '10001',
		name: 'Kas',
		normal_balance: 'debit',
		deleted_at: null
	},
	{
		id: 2,
		company_id: 1,
		account_group_id: 2,
		account_group_code: '60',
		account_group_name: 'Beban',
		code: '60001',
		name: 'Beban Gaji',
		normal_balance: 'debit',
		deleted_at: null
	},
	{
		id: 3,
		company_id: 2,
		account_group_id: 3,
		account_group_code: '40',
		account_group_name: 'Pendapatan',
		code: '40001',
		name: 'Pendapatan Jasa',
		normal_balance: 'credit',
		deleted_at: null
	},
	{
		id: 4,
		company_id: 3,
		account_group_id: 4,
		account_group_code: '20',
		account_group_name: 'Kewajiban',
		code: '20001',
		name: 'Utang Usaha',
		normal_balance: 'credit',
		deleted_at: null
	},
	{
		id: 5,
		company_id: 1,
		account_group_id: 5,
		account_group_code: '40',
		account_group_name: 'Pendapatan',
		code: '40001',
		name: 'Penjualan',
		normal_balance: 'credit',
		deleted_at: null
	}
]
