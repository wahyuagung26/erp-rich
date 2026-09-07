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
// (NOT server-assigned). `deleted_at` is the soft-delete marker. `company_type`
// values are Indonesian legal-entity codes (PT/CV/UD/etc.) — proper nouns, not translated.
export type CompanyType = 'pt' | 'cv' | 'ud' | 'firma' | 'perorangan' | 'koperasi' | 'yayasan'

export interface Company {
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
export interface Brand {
	id: number
	company_id: number
	code: string
	name: string
	deleted_at: string | null
}

// Master data: kategori produk / product category. Same contract as Brand — `code`
// is user-entered at create and immutable afterward (the edit form disables it).
export interface ProductCategory {
	id: number
	company_id: number
	code: string
	name: string
	deleted_at: string | null
}

// Master data: satuan / unit of measure. Same contract as Brand/ProductCategory — `code`
// is user-entered at create and immutable afterward (the edit form disables it).
export interface Unit {
	id: number
	company_id: number
	code: string
	name: string
	deleted_at: string | null
}

// Master data: sales / sales rep. Same contract as Brand/ProductCategory/Unit — `code`
// is user-entered at create and immutable afterward (the edit form disables it).
export interface Sales {
	id: number
	company_id: number
	code: string
	name: string
	address: string
	deleted_at: string | null
}

// Master data: channel / sales channel. Same contract as Sales — `code` is
// user-entered at create and immutable afterward, with a `notes` field instead
// of `address`.
export interface Channel {
	id: number
	company_id: number
	code: string
	name: string
	notes: string
	deleted_at: string | null
}

// Master data: cabang / branch. Same contract as Brand/ProductCategory/Unit — `code`
// is user-entered at create and immutable afterward (the edit form disables it).
export interface Branch {
	id: number
	company_id: number
	code: string
	name: string
	address: string
	deleted_at: string | null
}

// Master data: departemen / department. Same contract as Brand/ProductCategory/Unit — `code`
// is user-entered at create and immutable afterward (the edit form disables it).
export interface Department {
	id: number
	company_id: number
	code: string
	name: string
	deleted_at: string | null
}

// Master data: gudang / warehouse. Same contract as Branch — `code` is user-entered
// at create and immutable afterward. `branch_id` must belong to the same company;
// `branch_code`/`branch_name` are denormalized onto reads for display (same pattern
// as JournalLine's account_code/account_name).
export interface Warehouse {
	id: number
	company_id: number
	code: string
	name: string
	branch_id: number
	branch_code?: string
	branch_name?: string
	address: string
	deleted_at: string | null
}

// Master data: group akun / account group. Classifies which financial statement an
// account rolls up into (`category`) and its normal balance side (`normal_balance`,
// same field name/values as `Account.normal_balance`). Same contract as Brand/
// ProductCategory/Unit/Branch/Department — `code` is user-entered at create and immutable afterward.
export interface AccountGroup {
	id: number
	company_id: number
	code: string
	name: string
	category: 'balance_sheet' | 'income_statement'
	normal_balance: 'debit' | 'credit'
	deleted_at: string | null
}

// Master data: sub akun / sub-account, under an AccountGroup. `code` is server-composed:
// the first 2 digits are the owning group's `code` (zero-padded), the last 3 are
// user-entered (`code_suffix` on write) — see docs/sub-account/. `account_group_id` and the
// resulting `code` are both immutable after create. `account_group_code`/`account_group_name`
// are denormalized onto reads, same pattern as Warehouse's branch_code/branch_name.
export interface SubAccount {
	id: number
	company_id: number
	account_group_id: number
	account_group_code?: string
	account_group_name?: string
	code: string
	name: string
	normal_balance: 'debit' | 'credit'
	deleted_at: string | null
}

// Master data: akun perkiraan / detail account, under a SubAccount. `code` is server-
// composed: the first 5 digits are the owning sub account's `code` (already exactly 5
// digits), the last 2 are user-entered (`code_suffix` on write) — see
// docs/account/. `sub_account_id` and the resulting `code` are both immutable
// after create. `sub_account_code`/`sub_account_name` are denormalized onto reads, same
// pattern as SubAccount's account_group_code/account_group_name. `type` uses the same
// enum shape as Journal's account picker (`views/account/schema.ts`'s AKUN_TYPES).
export interface Account {
	id: number
	company_id: number
	sub_account_id: number
	sub_account_code?: string
	sub_account_name?: string
	code: string
	name: string
	type: 'cash_bank' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
	deleted_at: string | null
}

// Master data: jenis penjualan / sales type. Maps a sales type to the four
// Account accounts it posts to (revenue, COGS, inventory, expense) — used
// by the sales module (not built yet) to auto-fill journal accounts per transaction.
// `code` is user-entered and immutable after create, same convention as
// Brand/ProductCategory/Unit/Branch/Department/Warehouse. Each *_account_*_id is denormalized
// with its code/name, same pattern as Warehouse's branch_code/branch_name.
export interface SalesType {
	id: number
	company_id: number
	code: string
	name: string
	revenue_account_id: number
	revenue_account_code?: string
	revenue_account_name?: string
	cogs_account_id: number
	cogs_account_code?: string
	cogs_account_name?: string
	inventory_account_id: number
	inventory_account_code?: string
	inventory_account_name?: string
	expense_account_id: number
	expense_account_code?: string
	expense_account_name?: string
	deleted_at: string | null
}

// Master data: jenis pembelian / purchase type. Same contract as Sales/Channel —
// `code` is user-entered at create and immutable afterward, but constrained to
// uppercase letters A-Z only, max 5 characters (enforced client-side in
// schema.ts and server-side in the mock, see docs/purchase-type/).
export interface PurchaseType {
	id: number
	company_id: number
	code: string
	name: string
	notes: string
	deleted_at: string | null
}

// Master data: tipe pembayaran / payment type. `code` is user-entered and
// immutable after create, same convention as the other master-data modules.
// `account_id` is denormalized with its code/name, same pattern as
// Warehouse's branch_code/branch_name. `transaction_type` scopes the type to
// purchase or sale; `method` is the payment mechanism.
export interface PaymentType {
	id: number
	company_id: number
	code: string
	name: string
	account_id: number
	account_code?: string
	account_name?: string
	transaction_type: 'purchase' | 'sale'
	method: 'cash' | 'return_deduction' | 'down_payment'
	deleted_at: string | null
}

// Master data: produk / product. The most cross-referenced master-data entity —
// five FKs (Brand, ProductCategory, SalesType, Supplier, Unit), each denormalized
// onto the row same as Warehouse's branch_code/branch_name. `code` is user-entered
// at create and immutable afterward, same convention as Brand/ProductCategory/Unit
// (no format constraint). Money fields (`last_purchase_price`, `selling_price`)
// are user-typed — unlike every other money value in this app (always read-only
// via <Amount>). `photo_url` is a data-URL string, same shortcut as Company.logo_url.
export interface Product {
	id: number
	company_id: number
	code: string
	name: string
	type: 'service' | 'raw_material' | 'finished_good'
	brand_id: number
	brand_code?: string
	brand_name?: string
	product_category_id: number
	product_category_code?: string
	product_category_name?: string
	sales_type_id: number
	sales_type_code?: string
	sales_type_name?: string
	supplier_id: number
	supplier_code?: string
	supplier_name?: string
	unit_id: number
	unit_code?: string
	unit_name?: string
	min_stock: number
	notes: string
	last_purchase_price: number
	selling_price: number
	photo_url: string
	deleted_at: string | null
}

export interface JournalLine {
	account_id: number
	account_code?: string
	account_name?: string
	debit: number
	credit: number
}

export interface Journal {
	id: number
	date: string
	number: string
	description: string
	lines: JournalLine[]
	total: number
}
