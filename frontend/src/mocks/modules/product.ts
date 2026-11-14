import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Product } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').pop())
const live = () => db.product.filter((p) => !p.deleted_at)

// Uniqueness is per company — two companies may each have their own PRD001 code.
const codeTaken = (code: string, companyId: number, exceptId?: number) =>
	live().some((p) => p.company_id === companyId && p.code.toLowerCase() === code.trim().toLowerCase() && p.id !== exceptId)

// The five referenced rows must exist, not be deleted, and belong to the same company.
const brandOf = (id: number, companyId: number) => db.brand.find((b) => b.id === id && !b.deleted_at && b.company_id === companyId)
const categoryOf = (id: number, companyId: number) => db.productCategory.find((c) => c.id === id && !c.deleted_at && c.company_id === companyId)
const salesTypeOf = (id: number, companyId: number) => db.salesType.find((s) => s.id === id && !s.deleted_at && s.company_id === companyId)
const supplierOf = (id: number, companyId: number) => db.supplier.find((s) => s.id === id && !s.deleted_at && s.company_id === companyId)
const unitOf = (id: number, companyId: number) => db.unit.find((u) => u.id === id && !u.deleted_at && u.company_id === companyId)

interface Body {
	code: string
	name: string
	type: Product['type']
	brand_id: number
	product_category_id: number
	sales_type_id: number
	supplier_id: number
	unit_id: number
	min_stock: number
	notes: string
	last_purchase_price: number
	selling_price: number
	photo_url: string
}

type ProductError = [number, { message: string; errors: Record<string, string[]> }]

interface ResolvedRefs {
	brand_id: number
	brand_code: string
	brand_name: string
	product_category_id: number
	product_category_code: string
	product_category_name: string
	sales_type_id: number
	sales_type_code: string
	sales_type_name: string
	supplier_id: number
	supplier_code: string
	supplier_name: string
	unit_id: number
	unit_code: string
	unit_name: string
}

// Resolves all 5 FKs, returning either the denormalized fields or a 422 error response.
function resolveRefs(body: Body, companyId: number): ResolvedRefs | ProductError {
	const brand = brandOf(body.brand_id, companyId)
	if (!brand) return [422, { message: 'Validasi gagal', errors: { brand_id: ['Merk tidak valid'] } }]
	const category = categoryOf(body.product_category_id, companyId)
	if (!category) return [422, { message: 'Validasi gagal', errors: { product_category_id: ['Kategori produk tidak valid'] } }]
	const salesType = salesTypeOf(body.sales_type_id, companyId)
	if (!salesType) return [422, { message: 'Validasi gagal', errors: { sales_type_id: ['Jenis penjualan tidak valid'] } }]
	const supplier = supplierOf(body.supplier_id, companyId)
	if (!supplier) return [422, { message: 'Validasi gagal', errors: { supplier_id: ['Supplier utama tidak valid'] } }]
	const unit = unitOf(body.unit_id, companyId)
	if (!unit) return [422, { message: 'Validasi gagal', errors: { unit_id: ['Satuan tidak valid'] } }]
	return {
		brand_id: brand.id,
		brand_code: brand.code,
		brand_name: brand.name,
		product_category_id: category.id,
		product_category_code: category.code,
		product_category_name: category.name,
		sales_type_id: salesType.id,
		sales_type_code: salesType.code,
		sales_type_name: salesType.name,
		supplier_id: supplier.id,
		supplier_code: supplier.code,
		supplier_name: supplier.name,
		unit_id: unit.id,
		unit_code: unit.code,
		unit_name: unit.name
	}
}

// Contract: docs/product/ — code is user-entered at create, immutable after
// (ignored on update). All 5 FKs must belong to the active company and are
// re-denormalized on every write. Soft delete (deleted_at), never hard-removed.
// Company-scoped — see docs/conventions.md#company-scoping.
export function registerProduct(mock: MockAdapter) {
	mock.onGet('/product').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows = live().filter((prod) => prod.company_id === companyId)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((prod) => `${prod.code} ${prod.name}`.toLowerCase().includes(q))
		}
		if (p.type) rows = rows.filter((prod) => prod.type === p.type)
		if (p.brand_id) rows = rows.filter((prod) => prod.brand_id === Number(p.brand_id))
		if (p.product_category_id) rows = rows.filter((prod) => prod.product_category_id === Number(p.product_category_id))
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/product\/\d+$/).reply((config) => {
		const found = live().find((prod) => prod.id === idOf(config.url) && prod.company_id === companyIdOf(config))
		return found ? [200, { data: found }] : [404, { message: 'Produk tidak ditemukan' }]
	})

	mock.onPost('/product').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as Body
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode produk sudah dipakai'] } }]
		const resolved = resolveRefs(body, companyId)
		if (Array.isArray(resolved)) return resolved
		const id = nextId(db.product)
		const row: Product = {
			id,
			company_id: companyId,
			code: body.code.trim(),
			name: body.name,
			type: body.type,
			...resolved,
			min_stock: body.min_stock,
			notes: body.notes,
			last_purchase_price: body.last_purchase_price,
			selling_price: body.selling_price,
			hpp_avg: 0, // read-only, computed from purchases later — see docs/product-price/
			photo_url: body.photo_url,
			deleted_at: null
		}
		db.product.unshift(row)
		return [201, { data: row, message: 'Produk ditambahkan' }]
	})

	mock.onPut(/\/product\/\d+$/).reply((config) => {
		const companyId = companyIdOf(config)
		const body = JSON.parse(config.data) as Omit<Body, 'code'>
		const idx = db.product.findIndex((prod) => prod.id === idOf(config.url) && !prod.deleted_at && prod.company_id === companyId)
		if (idx === -1) return [404, { message: 'Produk tidak ditemukan' }]
		const resolved = resolveRefs(body as Body, companyId as number)
		if (Array.isArray(resolved)) return resolved
		// code is immutable — ignored even if the client sends it
		db.product[idx] = {
			...db.product[idx],
			name: body.name,
			type: body.type,
			...resolved,
			min_stock: body.min_stock,
			notes: body.notes,
			last_purchase_price: body.last_purchase_price,
			selling_price: body.selling_price,
			photo_url: body.photo_url
		}
		return [200, { data: db.product[idx], message: 'Produk diperbarui' }]
	})

	// Contract: docs/product-price/update-price.md — lightweight price-only patch
	// for the "Harga Produk" inline editor. Touches selling_price + last_purchase_price
	// only; hpp_avg stays read-only.
	mock.onPatch(/\/product\/\d+\/price$/).reply((config) => {
		const companyId = companyIdOf(config)
		const id = Number(config.url?.split('/').slice(-2, -1)[0])
		const body = JSON.parse(config.data) as { selling_price: number; last_purchase_price: number }
		const idx = db.product.findIndex((prod) => prod.id === id && !prod.deleted_at && prod.company_id === companyId)
		if (idx === -1) return [404, { message: 'Produk tidak ditemukan' }]
		const sp = Number(body.selling_price)
		const bp = Number(body.last_purchase_price)
		if (![sp, bp].every((n) => Number.isInteger(n) && n >= 0))
			return [422, { message: 'Validasi gagal', errors: { selling_price: ['Harga harus bilangan bulat >= 0'] } }]
		db.product[idx] = { ...db.product[idx], selling_price: sp, last_purchase_price: bp }
		return [200, { data: db.product[idx], message: 'Harga produk diperbarui' }]
	})

	mock.onDelete(/\/product\/\d+$/).reply((config) => {
		const found = db.product.find((prod) => prod.id === idOf(config.url) && !prod.deleted_at && prod.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Produk tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Produk dihapus' }]
	})
}
