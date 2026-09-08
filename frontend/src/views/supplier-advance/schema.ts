import type { JournalAttachment } from '@/utils/types'

export interface SupplierAdvanceForm {
	number: string
	date: string
	department_id: number | null
	department_code?: string
	department_name?: string
	supplier_id: number | null
	supplier_code?: string
	supplier_name?: string
	amount: number
	used: number
	cash_account_id: number | null
	cash_account_code?: string
	cash_account_name?: string
	advance_type: string
	cash_flow: string
	cash_flow_name?: string
	description: string
	attachment: JournalAttachment | null
}

export const advanceTypeOptions = [{ label: 'TITIPAN-PO', value: 'TITIPAN-PO' }]

// List search field selector (Legacy "Cari Berdasarkan").
export const searchFieldOptions = [
	{ label: 'Nomor Transaksi', value: 'number' },
	{ label: 'Supplier', value: 'supplier' },
	{ label: 'Tanggal', value: 'date' },
	{ label: 'Keterangan', value: 'description' }
]

export const sortFieldOptions = [
	{ label: 'Tanggal', value: 'date' },
	{ label: 'Nomor Transaksi', value: 'number' },
	{ label: 'Supplier', value: 'supplier_name' },
	{ label: 'Saldo Tersedia', value: 'remaining' }
]

export const sortOrderOptions = [
	{ label: 'Menaik', value: 'asc' },
	{ label: 'Menurun', value: 'desc' }
]

export const limitOptions = [
	{ label: 'Maks. 20 data', value: '20' },
	{ label: 'Semua data', value: 'all' }
]
