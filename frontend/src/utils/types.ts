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
	company_id: number
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
	company_id: number
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

// Master data: perusahaan / badan usaha. `code` is user-entered and unique
// (NOT server-assigned). `deleted_at` is the soft-delete marker.
export type CompanyType = 'pt' | 'cv' | 'ud' | 'firma' | 'perorangan' | 'koperasi' | 'yayasan'

export interface Perusahaan {
	id: number
	code: string
	short_name: string
	legal_name: string
	npwp: string
	logo_url: string
	address: string
	company_type: CompanyType
	hr_enabled: boolean
	report_header_color: string
	deleted_at: string | null
}

// Master data: merk produk / product brand. `code` is user-entered at create and
// immutable afterward (the edit form disables it). `deleted_at` is the soft-delete marker.
export interface Merk {
	id: number
	company_id: number
	code: string
	name: string
	deleted_at: string | null
}

// Master data: kategori produk / product category. Same contract as Merk — `code`
// is user-entered at create and immutable afterward (the edit form disables it).
export interface Kategori {
	id: number
	company_id: number
	code: string
	name: string
	deleted_at: string | null
}

// Master data: satuan / unit of measure. Same contract as Merk/Kategori — `code`
// is user-entered at create and immutable afterward (the edit form disables it).
export interface Satuan {
	id: number
	company_id: number
	code: string
	name: string
	deleted_at: string | null
}

// Master data: cabang / branch. Same contract as Merk/Kategori/Satuan — `code`
// is user-entered at create and immutable afterward (the edit form disables it).
export interface Cabang {
	id: number
	company_id: number
	code: string
	name: string
	address: string
	deleted_at: string | null
}

// Master data: departemen / department. Same contract as Merk/Kategori/Satuan — `code`
// is user-entered at create and immutable afterward (the edit form disables it).
export interface Departemen {
	id: number
	company_id: number
	code: string
	name: string
	deleted_at: string | null
}

// Master data: gudang / warehouse. Same contract as Cabang — `code` is user-entered
// at create and immutable afterward. `cabang_id` must belong to the same company;
// `cabang_code`/`cabang_name` are denormalized onto reads for display (same pattern
// as JurnalLine's akun_code/akun_name).
export interface Gudang {
	id: number
	company_id: number
	code: string
	name: string
	cabang_id: number
	cabang_code?: string
	cabang_name?: string
	address: string
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
