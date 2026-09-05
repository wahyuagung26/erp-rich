import type { AccountGroup } from '@/utils/types'

export const accountGroupSeed: AccountGroup[] = [
	{ id: 1, company_id: 1, code: '10', name: 'Aset', category: 'balance_sheet', normal_balance: 'debit', deleted_at: null },
	{ id: 2, company_id: 1, code: '60', name: 'Beban', category: 'income_statement', normal_balance: 'debit', deleted_at: null },
	{ id: 3, company_id: 2, code: '40', name: 'Pendapatan', category: 'income_statement', normal_balance: 'credit', deleted_at: null },
	{ id: 4, company_id: 3, code: '20', name: 'Kewajiban', category: 'balance_sheet', normal_balance: 'credit', deleted_at: null },
	{ id: 5, company_id: 1, code: '40', name: 'Pendapatan', category: 'income_statement', normal_balance: 'credit', deleted_at: null }
]
