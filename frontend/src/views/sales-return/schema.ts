import * as v from 'valibot'
import { approvalOptions } from '@/views/sales-invoice/schema'
import { VAT_RATE, lineTotal } from '@/views/sales-order/schema'

export { approvalOptions }

export const settlementStatusLabel = { open: 'Belum Selesai', settled: 'Selesai' } as const
export const settlementTone = { open: 'warning', settled: 'success' } as const

export const settlementOptions = [
	{ label: 'Semua penyelesaian', value: '' },
	...Object.entries(settlementStatusLabel).map(([value, label]) => ({ value, label }))
]

export const settlementTypeLabel = { receivable_deduction: 'Potong Piutang', cash_bank: 'Dana Kembali' } as const
export const settlementTypeOptions = [
	{ label: 'Potong piutang invoice', value: 'receivable_deduction' },
	{ label: 'Kembalikan dana ke customer', value: 'cash_bank' }
]

const today = () => new Date().toISOString().slice(0, 10)
const requiredId = (message: string) => v.pipe(v.number(message), v.minValue(1, message))

// Editable UI state for one line — product, sold / already-returned quantities and price are fixed by the invoice; only `quantity` is edited.
export interface SalesReturnLineDraft {
	product_id: number
	product_code?: string
	product_name?: string
	brand_name?: string
	unit_name?: string
	quantity_sold: number
	quantity_returned_before: number
	quantity: number
	price: number
	discount: number
}

export interface SalesReturnDraft {
	sales_invoice_id: number | null
	date: string
	warehouse_id: number | null
	reason: string
	pkp_active: boolean
	lines: SalesReturnLineDraft[]
}

export const available = (line: Pick<SalesReturnLineDraft, 'quantity_sold' | 'quantity_returned_before'>) =>
	Math.max(line.quantity_sold - line.quantity_returned_before, 0)

// Preview only — the server recomputes every amount from the invoice line (docs/sales-return/index.md#rumus).
export function lineAmounts(line: Pick<SalesReturnLineDraft, 'quantity' | 'price' | 'discount'>, pkp: boolean) {
	const dpp = lineTotal(line)
	const ppn = pkp ? Math.round((dpp * VAT_RATE) / 100) : 0
	return { dpp, ppn, total: dpp + ppn }
}

export function returnTotals(lines: SalesReturnLineDraft[], pkp: boolean) {
	const amounts = lines.map((line) => lineAmounts(line, pkp))
	const dpp = amounts.reduce((sum, item) => sum + item.dpp, 0)
	const ppn = amounts.reduce((sum, item) => sum + item.ppn, 0)
	return { dpp, ppn, total: dpp + ppn }
}

const lineSchema = v.object({
	product_id: v.number(),
	quantity_sold: v.number(),
	quantity_returned_before: v.number(),
	quantity: v.pipe(v.number('Jumlah retur tidak valid'), v.minValue(0, 'Jumlah retur tidak boleh negatif')),
	price: v.number(),
	discount: v.number()
})

export const salesReturnSchema = v.pipe(
	v.object({
		sales_invoice_id: requiredId('Invoice penjualan wajib dipilih'),
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

export type SalesReturnForm = v.InferOutput<typeof salesReturnSchema>

// Flattens valibot issues to `{ field: firstMessage }`; any `lines.N.*` error collapses onto `lines`.
export function parseSalesReturn(data: unknown): { data: SalesReturnForm; errors: null } | { data: null; errors: Record<string, string> } {
	const result = v.safeParse(salesReturnSchema, data)
	if (result.success) return { data: result.output, errors: null }
	const errors: Record<string, string> = {}
	for (const issue of result.issues) {
		const key = issue.path?.[0]?.key
		const field = typeof key === 'string' ? key : '_'
		errors[field] ??= issue.message
	}
	return { data: null, errors }
}

// Settlement ("Penyelesaian") form — one inline form on the detail page; the bank account is required for a refund only.
export const settlementSchema = v.object({
	type: v.picklist(['receivable_deduction', 'cash_bank'], 'Cara penyelesaian wajib dipilih'),
	date: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
		v.check((value) => value <= today(), 'Tanggal tidak boleh melebihi hari ini')
	),
	bank_account_id: v.nullable(v.number()),
	description: v.pipe(v.string(), v.trim(), v.maxLength(250, 'Keterangan maksimal 250 karakter')),
	amount: v.pipe(v.number('Nominal wajib diisi'), v.minValue(1, 'Nominal harus lebih dari nol'))
})

// `limits` = what the amount may reach: the return's balance and (potong piutang only) the invoice's Sisa.
export function validateSettlement(data: unknown, limits: { remaining: number; invoice: number }): Record<string, string> | null {
	const result = v.safeParse(settlementSchema, data)
	const errors: Record<string, string> = {}
	if (!result.success) for (const issue of result.issues) errors[String(issue.path?.[0]?.key)] ??= issue.message
	else {
		const { type, bank_account_id, amount } = result.output
		if (type === 'cash_bank' && !bank_account_id) errors.bank_account_id = 'Rekening cash / bank wajib dipilih'
		if (amount > limits.remaining) errors.amount = 'Nominal melebihi sisa retur'
		else if (type === 'receivable_deduction' && amount > limits.invoice) errors.amount = 'Nominal melebihi sisa piutang invoice'
	}
	return Object.keys(errors).length ? errors : null
}
