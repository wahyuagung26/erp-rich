import type { PurchaseType } from '@/utils/types'

export const purchaseTypeSeed: PurchaseType[] = [
	{ id: 1, company_id: 1, code: 'LOKAL', name: 'Pembelian Lokal', notes: 'Pembelian dari supplier dalam negeri', deleted_at: null },
	{ id: 2, company_id: 1, code: 'IMPOR', name: 'Pembelian Impor', notes: 'Pembelian dari supplier luar negeri', deleted_at: null },
	{ id: 3, company_id: 2, code: 'ASET', name: 'Pembelian Aset', notes: '', deleted_at: null }
]
