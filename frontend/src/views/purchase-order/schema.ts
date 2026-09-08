import * as v from 'valibot'
import type { PurchaseOrderApprovalStatus, PurchaseOrderDeliveryStatus } from '@/utils/types'

export const VAT_RATE = 11

export const approvalStatusLabel: Record<PurchaseOrderApprovalStatus, string> = {
	pending: 'Menunggu Persetujuan',
	approved: 'Disetujui',
	rejected: 'Ditolak'
}

export const deliveryStatusLabel: Record<PurchaseOrderDeliveryStatus, string> = {
	not_received: 'Belum Diterima',
	partial: 'Diterima Sebagian',
	full: 'Terkirim Full'
}

export const approvalStatusTone: Record<PurchaseOrderApprovalStatus, 'warning' | 'success' | 'danger'> = {
	pending: 'warning',
	approved: 'success',
	rejected: 'danger'
}

export const deliveryStatusTone: Record<PurchaseOrderDeliveryStatus, 'info' | 'warning' | 'success'> = {
	not_received: 'info',
	partial: 'warning',
	full: 'success'
}

// Type-mismatch message doubles as the "not selected" message, since a draft's
// empty FK is `null` and valibot rejects it against `v.number()` with this text.
const requiredId = (message: string) => v.pipe(v.number(message), v.minValue(1, message))

// Editable UI state for one line — FK may be unset, product labels are display-only.
export interface PurchaseOrderLineDraft {
	product_id: number | null
	product_code?: string
	product_name?: string
	brand_name?: string
	unit_name?: string
	quantity: number
	price: number
	discount: number
}

// Editable UI state for the whole order — FKs may be unset until the user picks them.
export interface PurchaseOrderDraft {
	date: string
	supplier_id: number | null
	pkp_active: boolean
	department_id: number | null
	warehouse_id: number | null
	purchase_type: string | null
	address: string
	description: string
	lines: PurchaseOrderLineDraft[]
}

const purchaseOrderLineFormSchema = v.object({
	product_id: requiredId('Produk wajib dipilih'),
	product_code: v.optional(v.string()),
	product_name: v.optional(v.string()),
	brand_name: v.optional(v.string()),
	unit_name: v.optional(v.string()),
	quantity: v.pipe(v.number(), v.minValue(0.001, 'Jumlah harus lebih dari nol')),
	price: v.pipe(v.number(), v.minValue(1, 'Harga satuan harus lebih dari nol')),
	discount: v.pipe(v.number(), v.minValue(0, 'Diskon tidak boleh negatif'))
})

export const purchaseOrderLineSchema = v.pipe(
	purchaseOrderLineFormSchema,
	v.check((line) => line.discount <= line.quantity * line.price, 'Diskon tidak boleh melebihi nilai bruto')
)

export const purchaseOrderSchema = v.object({
	date: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi')),
	supplier_id: requiredId('Supplier wajib dipilih'),
	pkp_active: v.boolean(),
	department_id: requiredId('Departemen wajib dipilih'),
	warehouse_id: requiredId('Gudang wajib dipilih'),
	purchase_type: v.nullable(v.string()),
	address: v.pipe(v.string(), v.trim(), v.nonEmpty('Alamat wajib diisi')),
	description: v.pipe(v.string(), v.trim(), v.nonEmpty('Keterangan wajib diisi')),
	lines: v.pipe(v.array(purchaseOrderLineSchema), v.minLength(1, 'Minimal satu produk harus ditambahkan'))
})

// Validated output — required FKs are non-null numbers. Product labels may still be
// present (display-only); toPurchaseOrderRequest() strips them before hitting the API.
export type PurchaseOrderLineForm = v.InferOutput<typeof purchaseOrderLineSchema>
export type PurchaseOrderForm = v.InferOutput<typeof purchaseOrderSchema>

export function parsePurchaseOrder(data: unknown): { data: PurchaseOrderForm; errors: null } | { data: null; errors: Record<string, string> } {
	const result = v.safeParse(purchaseOrderSchema, data)
	if (result.success) return { data: result.output, errors: null }
	const flat = v.flatten<typeof purchaseOrderSchema>(result.issues)
	const nested = flat.nested ?? {}
	const errors = Object.fromEntries(Object.entries(nested).map(([key, messages]) => [key, (messages as string[])[0]]))
	if (!Object.keys(errors).length && flat.root?.length) errors.form = flat.root[0]
	return { data: null, errors }
}

export function validatePurchaseOrder(data: unknown): Record<string, string> | null {
	const result = parsePurchaseOrder(data)
	return result.errors
}

export function validatePurchaseOrderLine(data: unknown): string | null {
	const result = v.safeParse(purchaseOrderLineSchema, data)
	if (result.success) return null
	return result.issues[0]?.message ?? 'Item produk tidak valid'
}

export const purchaseTypeOptions = [
	{ label: 'E-Money', value: 'E-Money' },
	{ label: 'Other', value: 'Other' },
	{ label: 'PVC', value: 'PVC' }
]

export const pkpOptions = [
	{ label: 'Aktif PKP', value: 'true' },
	{ label: 'Nonaktif PKP', value: 'false' }
]

export const searchFieldOptions = [
	{ label: 'Semua', value: '' },
	{ label: 'Nomor Transaksi', value: 'number' },
	{ label: 'Tanggal', value: 'date' },
	{ label: 'Pembuat', value: 'created_by' },
	{ label: 'Kode Supplier', value: 'supplier_code' },
	{ label: 'Nama Supplier', value: 'supplier_name' },
	{ label: 'Gudang', value: 'warehouse_name' },
	{ label: 'Alamat', value: 'address' },
	{ label: 'Keterangan', value: 'description' }
]

export const productSearchFieldOptions = [
	{ label: 'Nama Produk', value: 'product_name' },
	{ label: 'Kode Produk', value: 'product_code' },
	{ label: 'Merk', value: 'brand_name' }
]

export const sortFieldOptions = [
	{ label: 'Tanggal', value: 'date' },
	{ label: 'Nomor Transaksi', value: 'number' },
	{ label: 'Pembuat', value: 'created_by' },
	{ label: 'Supplier', value: 'supplier_name' },
	{ label: 'Gudang', value: 'warehouse_name' },
	{ label: 'Total', value: 'total' }
]

export const sortOrderOptions = [
	{ label: 'Menaik', value: 'asc' },
	{ label: 'Menurun', value: 'desc' }
]

export const limitOptions = [
	{ label: 'Maks. 20 data', value: '20' },
	{ label: 'Semua data', value: 'all' }
]

export const approvalOptions = [
	{ label: 'Semua status persetujuan', value: '' },
	...Object.entries(approvalStatusLabel).map(([value, label]) => ({ value, label }))
]

export const deliveryOptions = [
	{ label: 'Semua status barang', value: '' },
	...Object.entries(deliveryStatusLabel).map(([value, label]) => ({ value, label }))
]

export const lockOptions = [
	{ label: 'Semua kunci', value: '' },
	{ label: 'Dikunci', value: 'true' },
	{ label: 'Tidak dikunci', value: 'false' }
]

interface LineAmounts {
	quantity: number
	price: number
	discount: number
}

export function lineTotal(line: LineAmounts, isPkp: boolean) {
	const gross = Math.round(Number(line.quantity) * Number(line.price))
	const discount = Math.round(Number(line.discount))
	const dpp = Math.max(gross - discount, 0)
	const ppn = isPkp ? Math.round((dpp * VAT_RATE) / 100) : 0
	return { dpp, ppn, total: dpp + ppn }
}

export function totals(lines: LineAmounts[], isPkp: boolean) {
	const result = lines.reduce(
		(sum, line) => {
			const value = lineTotal(line, isPkp)
			return { dpp: sum.dpp + value.dpp, ppn: sum.ppn + value.ppn, total: sum.total + value.total }
		},
		{ dpp: 0, ppn: 0, total: 0 }
	)
	return { ...result, nett: result.dpp }
}
