import * as v from 'valibot'

export const settlementStatusLabel = { open: 'Belum Selesai', settled: 'Selesai' } as const
export const settlementTone = { open: 'warning', settled: 'success' } as const

export const settlementOptions = [
	{ label: 'Semua penyelesaian', value: '' },
	...Object.entries(settlementStatusLabel).map(([value, label]) => ({ value, label }))
]

const today = () => new Date().toISOString().slice(0, 10)
const requiredId = (message: string) => v.pipe(v.number(message), v.minValue(1, message))

// Editable UI state for one line — product, purchased and already-returned quantities are fixed by the invoice; only `quantity` is edited.
export interface PurchaseReturnLineDraft {
	product_id: number
	product_code?: string
	product_name?: string
	brand_name?: string
	unit_name?: string
	quantity_purchased: number
	quantity_returned_before: number
	quantity: number
	price: number
}

export interface PurchaseReturnDraft {
	purchase_invoice_id: number | null
	date: string
	warehouse_id: number | null
	reason: string
	pkp_active: boolean
	lines: PurchaseReturnLineDraft[]
}

export const available = (line: Pick<PurchaseReturnLineDraft, 'quantity_purchased' | 'quantity_returned_before'>) =>
	Math.max(line.quantity_purchased - line.quantity_returned_before, 0)

const lineSchema = v.object({
	product_id: v.number(),
	quantity_purchased: v.number(),
	quantity_returned_before: v.number(),
	quantity: v.pipe(v.number('Jumlah retur tidak valid'), v.minValue(0, 'Jumlah retur tidak boleh negatif')),
	price: v.number()
})

export const purchaseReturnSchema = v.pipe(
	v.object({
		purchase_invoice_id: requiredId('Invoice pembelian wajib dipilih'),
		date: v.pipe(
			v.string(),
			v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
			v.check((value) => value <= today(), 'Tanggal tidak boleh melebihi hari ini')
		),
		warehouse_id: requiredId('Gudang wajib dipilih'),
		reason: v.pipe(v.string(), v.trim(), v.nonEmpty('Alasan retur wajib diisi'), v.maxLength(250, 'Alasan retur maksimal 250 karakter')),
		pkp_active: v.boolean(),
		lines: v.array(lineSchema)
	}),
	v.forward(
		v.check((form) => form.lines.some((line) => line.quantity > 0), 'Isi jumlah retur minimal satu produk'),
		['lines']
	),
	v.forward(
		v.check((form) => form.lines.every((line) => line.quantity <= available(line)), 'Jumlah retur melebihi sisa yang bisa diretur'),
		['lines']
	)
)

export type PurchaseReturnForm = v.InferOutput<typeof purchaseReturnSchema>

// Flattens valibot issues to `{ field: firstMessage }`; any `lines.N.*` error collapses onto `lines`.
export function parsePurchaseReturn(data: unknown): { data: PurchaseReturnForm; errors: null } | { data: null; errors: Record<string, string> } {
	const result = v.safeParse(purchaseReturnSchema, data)
	if (result.success) return { data: result.output, errors: null }
	const errors: Record<string, string> = {}
	for (const issue of result.issues) {
		const key = issue.path?.[0]?.key
		const field = typeof key === 'string' ? key : '_'
		errors[field] ??= issue.message
	}
	return { data: null, errors }
}

// Settlement ("Pengembalian Dana") form — one inline form on the detail page.
export const settlementSchema = v.object({
	date: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
		v.check((value) => value <= today(), 'Tanggal tidak boleh melebihi hari ini')
	),
	bank_account_id: requiredId('Rekening cash / bank wajib dipilih'),
	description: v.pipe(v.string(), v.trim(), v.maxLength(250, 'Keterangan maksimal 250 karakter')),
	amount: v.pipe(v.number('Nominal wajib diisi'), v.minValue(1, 'Nominal harus lebih dari nol'))
})

export function validateSettlement(data: unknown, remaining: number): Record<string, string> | null {
	const result = v.safeParse(settlementSchema, data)
	const errors: Record<string, string> = {}
	if (!result.success) for (const issue of result.issues) errors[String(issue.path?.[0]?.key)] ??= issue.message
	else if (result.output.amount > remaining) errors.amount = 'Nominal melebihi sisa retur'
	return Object.keys(errors).length ? errors : null
}
