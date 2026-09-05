import type { SalesType } from '@/utils/types'

export const salesTypeSeed: SalesType[] = [
	{
		id: 1,
		company_id: 1,
		code: 'RC0007',
		name: 'Bahan Baku',
		revenue_account_id: 5,
		revenue_account_code: '4000101',
		revenue_account_name: 'Penjualan Produk',
		cogs_account_id: 6,
		cogs_account_code: '6000102',
		cogs_account_name: 'Biaya Bahan Baku',
		inventory_account_id: 7,
		inventory_account_code: '1000102',
		inventory_account_name: 'Persediaan Bahan Baku',
		expense_account_id: 2,
		expense_account_code: '6000101',
		expense_account_name: 'Beban Gaji Pokok',
		deleted_at: null
	}
]
