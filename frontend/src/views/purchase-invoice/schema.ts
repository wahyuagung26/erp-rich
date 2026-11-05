import * as v from 'valibot'
import { approvalSubset } from '@/utils/approval'
import type { PurchaseInvoiceApprovalStatus } from '@/utils/types'

export const VAT_RATE = 11

export const { label: approvalStatusLabel } = approvalSubset(['pending', 'approved'] as PurchaseInvoiceApprovalStatus[])

export const approvalOptions = [
	{ label: 'Semua status', value: '' },
	...Object.entries(approvalStatusLabel).map(([value, label]) => ({ value, label }))
]

export const taxInvoiceOptions = [
	{ label: 'Semua faktur pajak', value: '' },
	{ label: 'Belum ada faktur pajak', value: 'missing' },
	{ label: 'Sudah ada faktur pajak', value: 'filled' }
]

const today = () => new Date().toISOString().slice(0, 10)

// Type-mismatch message doubles as the "not selected" message — see purchase-order/schema.ts.
const requiredId = (message: string) => v.pipe(v.number(message), v.minValue(1, message))

// Editable UI state for one line — product and quantity are fixed by the receipt, only `price` is edited.
export interface PurchaseInvoiceLineDraft {
	product_id: number
	product_code?: string
	product_name?: string
	brand_name?: string
	unit_name?: string
	quantity: number
	price: number
}

export interface PurchaseInvoiceDraft {
	purchase_receipt_id: number | null
	date: string
	supplier_invoice_number: string
	description: string
	pkp_active: boolean
	lines: PurchaseInvoiceLineDraft[]
}

const purchaseInvoiceLineSchema = v.object({
	product_id: v.number(),
	product_code: v.optional(v.string()),
	product_name: v.optional(v.string()),
	brand_name: v.optional(v.string()),
	unit_name: v.optional(v.string()),
	quantity: v.number(),
	price: v.pipe(v.number(), v.minValue(1, 'Harga satuan harus lebih dari nol'))
})

export const purchaseInvoiceSchema = v.object({
	purchase_receipt_id: requiredId('Penerimaan pembelian wajib dipilih'),
	date: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
		v.check((value) => value <= today(), 'Tanggal tidak boleh melebihi hari ini')
	),
	supplier_invoice_number: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Nomor invoice supplier wajib diisi'),
		v.maxLength(30, 'Nomor invoice supplier maksimal 30 karakter')
	),
	description: v.pipe(v.string(), v.trim(), v.maxLength(250, 'Keterangan maksimal 250 karakter')),
	pkp_active: v.boolean(),
	lines: v.pipe(v.array(purchaseInvoiceLineSchema), v.minLength(1, 'Pilih penerimaan pembelian untuk memuat produk'))
})

export type PurchaseInvoiceForm = v.InferOutput<typeof purchaseInvoiceSchema>

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

// Flattens valibot issues to `{ field: firstMessage }`; any `lines.N.price` error collapses onto `lines`.
function flattenErrors(issues: [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]]): Record<string, string> {
	const nested = (v.flatten(issues).nested ?? {}) as Record<string, unknown>
	const errors = Object.fromEntries(
		Object.entries(nested)
			.map(([key, messages]) => [key, firstMessage(messages)])
			.filter((entry): entry is [string, string] => Boolean(entry[1]))
	)
	const lineError = Object.entries(errors).find(([key]) => key === 'lines' || key.startsWith('lines.'))
	if (lineError) errors.lines = lineError[1]
	return errors
}

export function parsePurchaseInvoice(data: unknown): { data: PurchaseInvoiceForm; errors: null } | { data: null; errors: Record<string, string> } {
	const result = v.safeParse(purchaseInvoiceSchema, data)
	if (result.success) return { data: result.output, errors: null }
	return { data: null, errors: flattenErrors(result.issues) }
}

interface LineAmounts {
	quantity: number
	price: number
}

export function lineTotal(line: LineAmounts, isPkp: boolean) {
	const dpp = Math.round(Number(line.quantity) * Number(line.price))
	const ppn = isPkp ? Math.round((dpp * VAT_RATE) / 100) : 0
	return { dpp, ppn, total: dpp + ppn }
}

export function totals(lines: LineAmounts[], isPkp: boolean) {
	return lines.reduce(
		(sum, line) => {
			const value = lineTotal(line, isPkp)
			return { dpp: sum.dpp + value.dpp, ppn: sum.ppn + value.ppn, total: sum.total + value.total }
		},
		{ dpp: 0, ppn: 0, total: 0 }
	)
}
