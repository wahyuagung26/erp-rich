// Shared API + UI types

export interface Pagination {
	page: number
	per_page: number
	total: number
	last_page: number
}

// Standard backend envelope: payload always under `.data`.
export interface ApiList<T> {
	data: T[]
	meta: Pagination
	message?: string
}

export interface ApiItem<T> {
	data: T
	message?: string
}

export type SortDir = 'asc' | 'desc'

export interface SortState {
	activeSort: SortDir
}

// Table column definition (matches the RICH Table contract).
export interface TableRow {
	label: string
	field: string
	isSort?: SortState
	align?: 'left' | 'center' | 'right'
}

export type Density = 'comfortable' | 'compact'

// --- domain ---
// `id` is an auto-increment integer (DB primary key). `code` is the business identifier.
export interface Akun {
	id: number
	code: string
	name: string
	type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
	normal_balance: 'debit' | 'credit'
	active: boolean
}

// Master data: supplier / vendor. `code` (SUP-0001) is server-assigned.
// `deleted_at` is the soft-delete marker — non-null rows are hidden from lists.
export interface Supplier {
	id: number
	code: string
	name: string
	address: string
	city: string
	phone: string
	fax: string
	email: string
	contact_person: string
	npwp: string
	pkp: boolean
	bank_name: string
	bank_account: string
	top_days: number
	notes: string
	deleted_at: string | null
}

// Master data: customer / pelanggan. `code` (CUST-0001) is server-assigned.
// `deleted_at` is the soft-delete marker — non-null rows are hidden from lists.
export interface Customer {
	id: number
	code: string
	name: string
	phone: string
	email: string
	address: string
	city: string
	bank_name: string
	bank_account: string
	npwp: string
	pkp: boolean
	top_days: number
	notes: string
	deleted_at: string | null
}

export interface JurnalLine {
	akun_id: number
	akun_code?: string
	akun_name?: string
	debit: number
	credit: number
}

export interface Jurnal {
	id: number
	date: string
	number: string
	description: string
	lines: JurnalLine[]
	total: number
}
