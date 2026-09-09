import * as v from 'valibot'
import type { PurchaseReceiptInvoiceStatus } from '@/utils/types'

export const invoiceStatusLabel: Record<PurchaseReceiptInvoiceStatus, string> = {
	not_invoiced: 'Belum Dibuat Invoice',
	invoiced: 'Sudah Dibuat Invoice'
}

export const invoiceStatusTone: Record<PurchaseReceiptInvoiceStatus, 'warning' | 'success'> = {
	not_invoiced: 'warning',
	invoiced: 'success'
}

const today = () => new Date().toISOString().slice(0, 10)

// Type-mismatch message doubles as the "not selected" message — see purchase-order/schema.ts.
const requiredId = (message: string) => v.pipe(v.number(message), v.minValue(1, message))

// Editable UI state for one line — fixed by the PO, not freely added/removed. Ordered/
// received/remaining are informational (server-computed), quantity/warehouse are editable.
export interface PurchaseReceiptLineDraft {
	product_id: number
	product_code?: string
	product_name?: string
	brand_name?: string
	unit_name?: string
	ordered_quantity: number
	received_quantity: number
	remaining_quantity: number
	quantity: number
	warehouse_id: number | null
	warehouse_code?: string
	warehouse_name?: string
}

export interface PurchaseReceiptDraft {
	purchase_order_id: number | null
	delivery_note_number: string
	description: string
	department_id: number | null
	date: string
	lines: PurchaseReceiptLineDraft[]
}

const purchaseReceiptLineFormSchema = v.object({
	product_id: v.number(),
	product_code: v.optional(v.string()),
	product_name: v.optional(v.string()),
	brand_name: v.optional(v.string()),
	unit_name: v.optional(v.string()),
	ordered_quantity: v.number(),
	received_quantity: v.number(),
	remaining_quantity: v.number(),
	quantity: v.pipe(v.number(), v.minValue(0, 'Jumlah tidak boleh negatif')),
	warehouse_id: v.nullable(v.number()),
	warehouse_code: v.optional(v.string()),
	warehouse_name: v.optional(v.string())
})

export const purchaseReceiptLineSchema = v.pipe(
	purchaseReceiptLineFormSchema,
	v.check((line) => line.quantity <= line.remaining_quantity, 'Jumlah melebihi sisa yang belum diterima'),
	v.check((line) => line.quantity === 0 || line.warehouse_id !== null, 'Gudang wajib dipilih saat ada jumlah diterima')
)

export const purchaseReceiptSchema = v.object({
	purchase_order_id: requiredId('Order pembelian wajib dipilih'),
	delivery_note_number: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Surat jalan supplier wajib diisi'),
		v.maxLength(30, 'Surat jalan supplier maksimal 30 karakter')
	),
	description: v.pipe(v.string(), v.trim(), v.nonEmpty('Keterangan wajib diisi'), v.maxLength(250, 'Keterangan maksimal 250 karakter')),
	department_id: requiredId('Departemen wajib dipilih'),
	date: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal penerimaan wajib diisi'),
		v.check((value) => value <= today(), 'Tanggal penerimaan tidak boleh melebihi hari ini')
	),
	lines: v.pipe(
		v.array(purchaseReceiptLineSchema),
		v.check((lines) => lines.some((line) => line.quantity > 0), 'Minimal satu produk harus diterima')
	)
})

export type PurchaseReceiptLineForm = v.InferOutput<typeof purchaseReceiptLineSchema>
export type PurchaseReceiptForm = v.InferOutput<typeof purchaseReceiptSchema>

function firstMessage(value: unknown): string | undefined {
	if (typeof value === 'string') return value
	if (Array.isArray(value)) {
		for (const item of value) {
			const message = firstMessage(item)
			if (message) return message
		}
	}
	if (value && typeof value === 'object') {
		for (const item of Object.values(value)) {
			const message = firstMessage(item)
			if (message) return message
		}
	}
	return undefined
}

export function parsePurchaseReceipt(data: unknown): { data: PurchaseReceiptForm; errors: null } | { data: null; errors: Record<string, string> } {
	const result = v.safeParse(purchaseReceiptSchema, data)
	if (result.success) return { data: result.output, errors: null }
	const flat = v.flatten<typeof purchaseReceiptSchema>(result.issues)
	const nested = flat.nested ?? {}
	const errors = Object.fromEntries(
		Object.entries(nested)
			.map(([key, messages]) => [key, firstMessage(messages)])
			.filter((entry): entry is [string, string] => Boolean(entry[1]))
	)
	const lineError = Object.entries(errors).find(([key]) => key === 'lines' || key.startsWith('lines.'))
	if (lineError) errors.lines = lineError[1]
	if (!Object.keys(errors).length && flat.root?.length) errors.form = flat.root[0]
	return { data: null, errors }
}

export function validatePurchaseReceipt(data: unknown): Record<string, string> | null {
	return parsePurchaseReceipt(data).errors
}

export const invoiceOptions = [{ label: '- Semua -', value: '' }, ...Object.entries(invoiceStatusLabel).map(([value, label]) => ({ value, label }))]

export function receiptSummary(lines: PurchaseReceiptLineDraft[]) {
	const received = lines.filter((line) => line.quantity > 0)
	return { productCount: received.length, totalQuantity: received.reduce((sum, line) => sum + Number(line.quantity), 0) }
}
