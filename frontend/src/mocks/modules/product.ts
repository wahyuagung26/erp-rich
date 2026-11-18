import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import type { Product, ProductVariant, ProductVariantAttribute, ProductVariantOption } from '@/utils/types'

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
	option_names?: string[]
	variants?: VariantInput[]
}

interface VariantInput {
	id?: number
	sku: string
	option_values: Record<string, string>
	is_default?: boolean
	is_active: boolean
	selling_price?: number
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

const isError = (result: ProductVariant[] | ProductError): result is ProductError => typeof result[0] === 'number'
const variantError = (message: string): ProductError => [422, { message: 'Validasi gagal', errors: { variants: [message] } }]

/** "Ukuran: XL" style label of a variant; the default variant reads "Standar". */
export const variantLabel = (variant: Pick<ProductVariant, 'option_values'>) =>
	Object.values(variant.option_values).filter(Boolean).join(' / ') || 'Standar'

/** Variant + its product, including deleted ones so transaction history stays resolvable. */
export function findVariant(id: number): { product: Product; variant: ProductVariant } | undefined {
	for (const product of db.product) {
		const variant = product.variants.find((item) => item.id === id)
		if (variant) return { product, variant }
	}
}

/** A new transaction line may only use a live product's active, non-deleted variant. */
export function isSellableVariant(id: number) {
	const found = findVariant(id)
	return Boolean(found && !found.product.deleted_at && !found.variant.deleted_at && found.variant.is_active)
}

/** Display fields every transaction line resolves from its variant_id. */
export function variantFields(id: number) {
	const found = findVariant(id)
	return {
		product_id: found?.product.id ?? 0,
		product_code: found?.product.code,
		product_name: found?.product.name,
		brand_name: found?.product.brand_name,
		unit_name: found?.product.unit_name,
		sku: found?.variant.sku,
		variant_label: found ? variantLabel(found.variant) : undefined
	}
}

const nextVariantId = () => Math.max(1000, ...db.product.flatMap((prod) => prod.variants.map((item) => item.id))) + 1

// SKU is unique per company across every non-deleted variant of other products.
const skuTaken = (sku: string, companyId: number, productId?: number) =>
	live().some(
		(prod) =>
			prod.company_id === companyId &&
			prod.id !== productId &&
			prod.variants.some((item) => !item.deleted_at && item.sku.toLowerCase() === sku.toLowerCase())
	)

const isPrice = (n: unknown) => Number.isInteger(n) && (n as number) >= 0

// Rebuilds the variant list from the request: the default variant always survives, dropped variants are soft-deleted.
function buildVariants(
	body: Body,
	code: string,
	companyId: number,
	stored: ProductVariant[] = [],
	productId?: number
): ProductVariant[] | ProductError {
	const names = [...new Set((body.option_names ?? []).map((name) => String(name).trim()).filter(Boolean))]
	const inputs = body.variants ?? []
	const storedDefault = stored.find((item) => item.is_default)
	const defaultInput = inputs.find((item) => item.is_default || (storedDefault && item.id === storedDefault.id))
	// Without variants the product's Harga Jual is the default variant's price.
	const defaultPrice = Number(names.length ? (defaultInput?.selling_price ?? storedDefault?.selling_price ?? body.selling_price) : body.selling_price)
	if (!isPrice(defaultPrice)) return variantError('Harga jual harus bilangan bulat dan tidak negatif')
	const result: ProductVariant[] = [
		{
			id: storedDefault?.id ?? nextVariantId(),
			sku: String(defaultInput?.sku ?? '').trim() || storedDefault?.sku || code,
			option_values: {},
			is_default: true,
			is_active: defaultInput ? Boolean(defaultInput.is_active) : (storedDefault?.is_active ?? true),
			selling_price: defaultPrice
		}
	]
	const others = inputs.filter((item) => item !== defaultInput)
	if (others.length && !names.length) return variantError('Isi nama atribut varian terlebih dahulu')
	const combos = new Set<string>()
	for (const input of others) {
		const sku = String(input.sku ?? '').trim()
		if (!sku) return variantError('SKU varian wajib diisi')
		const values = Object.fromEntries(names.map((name) => [name, String(input.option_values?.[name] ?? '').trim()]))
		if (Object.values(values).some((value) => !value)) return variantError('Nilai atribut varian wajib diisi')
		const combo = JSON.stringify(values).toLowerCase()
		if (combos.has(combo)) return variantError('Kombinasi atribut varian tidak boleh sama')
		const price = Number(input.selling_price)
		if (!isPrice(price)) return variantError(`Harga jual varian ${sku} harus bilangan bulat dan tidak negatif`)
		combos.add(combo)
		const old = stored.find((item) => item.id === input.id && !item.is_default && !item.deleted_at)
		result.push({
			id: old?.id ?? nextVariantId() + result.length,
			sku,
			option_values: values,
			is_default: false,
			is_active: Boolean(input.is_active),
			selling_price: price
		})
	}
	const skus = result.map((item) => item.sku.toLowerCase())
	if (new Set(skus).size !== skus.length) return variantError('SKU varian tidak boleh sama')
	const taken = result.find((item) => skuTaken(item.sku, companyId, productId))
	if (taken) return variantError(`SKU ${taken.sku} sudah dipakai produk lain`)
	if (!result.some((item) => item.is_active)) return variantError('Minimal satu varian harus aktif')
	const deletedAt = new Date().toISOString()
	const dropped = stored.filter((item) => !item.is_default && !result.some((kept) => kept.id === item.id))
	return [...result, ...dropped.map((item) => ({ ...item, deleted_at: item.deleted_at ?? deletedAt }))]
}

// Deleted variants are kept in storage only (history); responses never carry them.
const present = (row: Product): Product => ({ ...row, variants: row.variants.filter((item) => !item.deleted_at) })
// Product.selling_price mirrors the default variant's price (docs/product/index.md).
const defaultPriceOf = (variants: ProductVariant[]) => variants.find((item) => item.is_default)?.selling_price ?? 0

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
		return [200, paginate(rows.map(present), p)]
	})

	// Contract: docs/product/list-product-variant.md — SKU picker for transaction lines (active variants of live products).
	mock.onGet('/product-variant').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]
		let rows: ProductVariantOption[] = live()
			.filter((prod) => prod.company_id === companyId)
			.flatMap((prod) =>
				prod.variants
					.filter((item) => item.is_active && !item.deleted_at)
					.map((item) => ({
						id: item.id,
						sku: item.sku,
						label: variantLabel(item),
						product_id: prod.id,
						product_code: prod.code,
						product_name: prod.name,
						brand_name: prod.brand_name,
						unit_name: prod.unit_name,
						selling_price: item.selling_price,
						last_purchase_price: prod.last_purchase_price
					}))
			)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((row) => `${row.sku} ${row.product_code} ${row.product_name} ${row.label}`.toLowerCase().includes(q))
		}
		return [200, paginate(sortBy(rows, p.sort_by ?? 'sku', p.sort_order), p)]
	})

	// Contract: docs/product/list-product-variant-option.md — attribute names + values already used (form suggestions).
	mock.onGet('/product-variant-option').reply((config) => {
		const companyId = companyIdOf(config)
		const byName = new Map<string, ProductVariantAttribute>()
		for (const prod of live().filter((row) => row.company_id === companyId))
			for (const name of prod.option_names) {
				const entry = byName.get(name.toLowerCase()) ?? { name, values: [] }
				for (const variant of prod.variants) {
					const value = variant.option_values[name]
					if (value && !variant.deleted_at && !entry.values.some((v) => v.toLowerCase() === value.toLowerCase())) entry.values.push(value)
				}
				byName.set(name.toLowerCase(), entry)
			}
		const rows = sortBy([...byName.values()], 'name', 'asc')
		return [200, paginate(rows, { page: 1, per_page: Math.max(rows.length, 1) })]
	})

	mock.onGet(/\/product\/\d+$/).reply((config) => {
		const found = live().find((prod) => prod.id === idOf(config.url) && prod.company_id === companyIdOf(config))
		return found ? [200, { data: present(found) }] : [404, { message: 'Produk tidak ditemukan' }]
	})

	mock.onPost('/product').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return [422, { message: 'Pilih perusahaan aktif terlebih dahulu' }]
		const body = JSON.parse(config.data) as Body
		if (codeTaken(body.code, companyId)) return [422, { message: 'Validasi gagal', errors: { code: ['Kode produk sudah dipakai'] } }]
		const resolved = resolveRefs(body, companyId)
		if (Array.isArray(resolved)) return resolved
		const id = nextId(db.product)
		const variants = buildVariants(body, body.code.trim(), companyId, [], id)
		if (isError(variants)) return variants
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
			selling_price: defaultPriceOf(variants),
			hpp_avg: 0, // read-only, computed from purchases later — see docs/product-price/
			photo_url: body.photo_url,
			option_names: [...new Set((body.option_names ?? []).map((name) => String(name).trim()).filter(Boolean))],
			variants,
			deleted_at: null
		}
		db.product.unshift(row)
		return [201, { data: present(row), message: 'Produk ditambahkan' }]
	})

	mock.onPut(/\/product\/\d+$/).reply((config) => {
		const companyId = companyIdOf(config)
		const body = JSON.parse(config.data) as Omit<Body, 'code'>
		const idx = db.product.findIndex((prod) => prod.id === idOf(config.url) && !prod.deleted_at && prod.company_id === companyId)
		if (idx === -1) return [404, { message: 'Produk tidak ditemukan' }]
		const resolved = resolveRefs(body as Body, companyId as number)
		if (Array.isArray(resolved)) return resolved
		const current = db.product[idx]
		const variants = buildVariants(body as Body, current.code, companyId as number, current.variants, current.id)
		if (isError(variants)) return variants
		// code is immutable — ignored even if the client sends it
		db.product[idx] = {
			...db.product[idx],
			name: body.name,
			type: body.type,
			...resolved,
			min_stock: body.min_stock,
			notes: body.notes,
			last_purchase_price: body.last_purchase_price,
			selling_price: defaultPriceOf(variants),
			photo_url: body.photo_url,
			option_names: [...new Set((body.option_names ?? []).map((name) => String(name).trim()).filter(Boolean))],
			variants
		}
		return [200, { data: present(db.product[idx]), message: 'Produk diperbarui' }]
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
		const variants = db.product[idx].variants.map((item) => (item.is_default ? { ...item, selling_price: sp } : item))
		db.product[idx] = { ...db.product[idx], selling_price: sp, last_purchase_price: bp, variants }
		return [200, { data: present(db.product[idx]), message: 'Harga produk diperbarui' }]
	})

	// Contract: docs/product-price/update-variant-price.md — one SKU's selling price (Harga Produk, variant rows).
	mock.onPatch(/\/product-variant\/\d+\/price$/).reply((config) => {
		const companyId = companyIdOf(config)
		const id = Number(config.url?.split('/').slice(-2, -1)[0])
		const sp = Number((JSON.parse(config.data) as { selling_price: number }).selling_price)
		const product = live().find((prod) => prod.company_id === companyId && prod.variants.some((item) => item.id === id && !item.deleted_at))
		if (!product) return [404, { message: 'Varian produk tidak ditemukan' }]
		if (!isPrice(sp)) return [422, { message: 'Validasi gagal', errors: { selling_price: ['Harga harus bilangan bulat >= 0'] } }]
		product.variants = product.variants.map((item) => (item.id === id ? { ...item, selling_price: sp } : item))
		product.selling_price = defaultPriceOf(product.variants)
		return [200, { data: present(product), message: 'Harga varian diperbarui' }]
	})

	mock.onDelete(/\/product\/\d+$/).reply((config) => {
		const found = db.product.find((prod) => prod.id === idOf(config.url) && !prod.deleted_at && prod.company_id === companyIdOf(config))
		if (!found) return [404, { message: 'Produk tidak ditemukan' }]
		found.deleted_at = new Date().toISOString()
		return [200, { message: 'Produk dihapus' }]
	})
}
