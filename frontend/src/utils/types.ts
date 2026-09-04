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

// Master data: group akun / account group. Classifies which financial statement an
// account rolls up into (`category`) and its normal balance side (`normal_balance`,
// same field name/values as `Akun.normal_balance`). Same contract as Merk/Kategori/
// Satuan/Cabang/Departemen — `code` is user-entered at create and immutable afterward.
export interface GroupAkun {
	id: number
	company_id: number
	code: string
	name: string
	category: 'neraca' | 'laba_rugi'
	normal_balance: 'debit' | 'credit'
	deleted_at: string | null
}

// Master data: sub akun / sub-account, under a GroupAkun. `code` is server-composed:
// the first 2 digits are the owning group's `code` (zero-padded), the last 3 are
// user-entered (`code_suffix` on write) — see docs/sub-akun/. `group_akun_id` and the
// resulting `code` are both immutable after create. `group_akun_code`/`group_akun_name`
// are denormalized onto reads, same pattern as Gudang's cabang_code/cabang_name.
export interface SubAkun {
	id: number
	company_id: number
	group_akun_id: number
	group_akun_code?: string
	group_akun_name?: string
	code: string
	name: string
	normal_balance: 'debit' | 'credit'
	deleted_at: string | null
}

// Master data: akun perkiraan / detail account, under a SubAkun. `code` is server-
// composed: the first 5 digits are the owning sub akun's `code` (already exactly 5
// digits), the last 2 are user-entered (`code_suffix` on write) — see
// docs/akun-perkiraan/. `sub_akun_id` and the resulting `code` are both immutable
// after create. `sub_akun_code`/`sub_akun_name` are denormalized onto reads, same
// pattern as SubAkun's group_akun_code/group_akun_name. `type` uses the same
// enum shape as Jurnal's account picker (`views/akun-perkiraan/schema.ts`'s AKUN_TYPES).
export interface AkunPerkiraan {
	id: number
	company_id: number
	sub_akun_id: number
	sub_akun_code?: string
	sub_akun_name?: string
	code: string
	name: string
	type: 'cash_bank' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
	deleted_at: string | null
}

// Master data: jenis penjualan / sales type. Maps a sales type to the four
// AkunPerkiraan accounts it posts to (revenue, COGS, inventory, expense) — used
// by the sales module (not built yet) to auto-fill journal accounts per transaction.
// `code` is user-entered and immutable after create, same convention as
// Merk/Kategori/Satuan/Cabang/Departemen/Gudang. Each akun_*_id is denormalized
// with its code/name, same pattern as Gudang's cabang_code/cabang_name.
export interface JenisPenjualan {
	id: number
	company_id: number
	code: string
	name: string
	akun_pendapatan_id: number
	akun_pendapatan_code?: string
	akun_pendapatan_name?: string
	akun_hpp_id: number
	akun_hpp_code?: string
	akun_hpp_name?: string
	akun_persediaan_id: number
	akun_persediaan_code?: string
	akun_persediaan_name?: string
	akun_biaya_id: number
	akun_biaya_code?: string
	akun_biaya_name?: string
	deleted_at: string | null
}

// Master data: tipe pembayaran / payment type. `code` is user-entered and
// immutable after create, same convention as the other master-data modules.
// `akun_perkiraan_id` is denormalized with its code/name, same pattern as
// Gudang's cabang_code/cabang_name. `transaksi` scopes the type to Pembelian
// or Penjualan; `jenis` is the payment mechanism.
export interface TipePembayaran {
	id: number
	company_id: number
	code: string
	name: string
	akun_perkiraan_id: number
	akun_perkiraan_code?: string
	akun_perkiraan_name?: string
	transaksi: 'pembelian' | 'penjualan'
	jenis: 'tunai' | 'potong_retur' | 'uang_muka'
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
