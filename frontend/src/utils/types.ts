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
