import * as v from 'valibot'

const optionalText = v.optional(v.pipe(v.string(), v.trim()), '')
const fkRef = (message: string) =>
	v.pipe(
		v.number(message),
		v.check((n) => n > 0, message)
	)

export const PRODUCT_TYPES = [
	{ label: 'Jasa', value: 'service' },
	{ label: 'Bahan Baku', value: 'raw_material' },
	{ label: 'Produk Jadi', value: 'finished_good' }
] as const

export const productSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode produk wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama produk wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	type: v.picklist(
		PRODUCT_TYPES.map((t) => t.value),
		'Pilih jenis produk'
	),
	brand_id: fkRef('Merk wajib dipilih'),
	product_category_id: fkRef('Kategori produk wajib dipilih'),
	sales_type_id: fkRef('Jenis penjualan wajib dipilih'),
	supplier_id: fkRef('Supplier utama wajib dipilih'),
	unit_id: fkRef('Satuan wajib dipilih'),
	min_stock: v.pipe(v.number('Stok minimal wajib diisi'), v.integer('Harus bilangan bulat'), v.minValue(0, 'Tidak boleh negatif')),
	notes: optionalText,
	last_purchase_price: v.pipe(v.number('Harga beli terakhir wajib diisi'), v.integer('Harus bilangan bulat'), v.minValue(0, 'Tidak boleh negatif')),
	selling_price: v.pipe(v.number('Harga jual wajib diisi'), v.integer('Harus bilangan bulat'), v.minValue(0, 'Tidak boleh negatif')),
	photo_url: optionalText
})

export type ProductForm = v.InferOutput<typeof productSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateProduct(data: unknown): Record<string, string> | null {
	const result = v.safeParse(productSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof productSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
