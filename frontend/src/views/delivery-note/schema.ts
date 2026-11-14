import * as v from 'valibot'
import type { DeliveryNoteLine } from '@/utils/types'

const today = () => new Date().toISOString().slice(0, 10)

// Editable UI state for one line — the product set is fixed by the invoice, only `quantity` changes.
export type DeliveryNoteLineDraft = DeliveryNoteLine

export interface DeliveryNoteDraft {
	sales_invoice_id: number | null
	date: string
	delivery_address: string
	recipient: string
	driver: string
	vehicle: string
	description: string
	lines: DeliveryNoteLineDraft[]
}

const deliveryNoteLineSchema = v.pipe(
	v.object({
		product_id: v.number(),
		invoice_quantity: v.number(),
		quantity: v.pipe(v.number('Jumlah wajib diisi'), v.minValue(0, 'Jumlah tidak boleh negatif'))
	}),
	v.check((line) => line.quantity <= line.invoice_quantity, 'Jumlah melebihi qty invoice')
)

export const deliveryNoteSchema = v.object({
	sales_invoice_id: v.pipe(v.number('Invoice penjualan wajib dipilih'), v.minValue(1, 'Invoice penjualan wajib dipilih')),
	date: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
		v.check((value) => value <= today(), 'Tanggal tidak boleh melebihi hari ini')
	),
	delivery_address: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Alamat pengiriman wajib diisi'),
		v.maxLength(250, 'Alamat pengiriman maksimal 250 karakter')
	),
	recipient: v.pipe(v.string(), v.trim(), v.maxLength(100, 'Nama penerima maksimal 100 karakter')),
	driver: v.pipe(v.string(), v.trim(), v.maxLength(100, 'Nama driver maksimal 100 karakter')),
	vehicle: v.pipe(v.string(), v.trim(), v.maxLength(50, 'No. kendaraan maksimal 50 karakter')),
	description: v.pipe(v.string(), v.trim(), v.maxLength(250, 'Keterangan maksimal 250 karakter')),
	lines: v.pipe(
		v.array(deliveryNoteLineSchema),
		v.check((lines) => lines.some((line) => line.quantity > 0), 'Minimal satu produk harus dikirim')
	)
})

export type DeliveryNoteForm = v.InferOutput<typeof deliveryNoteSchema>

// First message per field; any `lines.*` issue is reported on `lines`.
export function validateDeliveryNote(data: unknown): Record<string, string> | null {
	const result = v.safeParse(deliveryNoteSchema, data)
	if (result.success) return null
	const errors: Record<string, string> = {}
	for (const issue of result.issues) {
		const key = String(issue.path?.[0]?.key ?? 'form')
		errors[key] ??= issue.message
	}
	return errors
}

export function shippedSummary(lines: DeliveryNoteLineDraft[]) {
	const shipped = lines.filter((line) => line.quantity > 0)
	return { productCount: shipped.length, totalQuantity: shipped.reduce((sum, line) => sum + Number(line.quantity), 0) }
}
