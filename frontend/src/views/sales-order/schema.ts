import * as v from 'valibot'
import { approvalSubset } from '@/utils/approval'
import type { SalesOrderDiscountType, SalesOrderInvoiceStatus } from '@/utils/types'

export const VAT_RATE = 11
export const TOP_DAYS = [0, 7, 14, 21, 30, 60, 90, 120]

export const { label: approvalStatusLabel } = approvalSubset(['pending', 'approved'])

export const invoiceStatusLabel: Record<SalesOrderInvoiceStatus, string> = {
	not_invoiced: 'Belum Diinvoice',
	invoiced: 'Sudah Diinvoice'
}

export const invoiceStatusTone: Record<SalesOrderInvoiceStatus, 'info' | 'success'> = {
	not_invoiced: 'info',
	invoiced: 'success'
}

// A draft's empty FK is `null`; valibot rejects it against `v.number()` with this text, so it doubles as the "not selected" message.
const requiredId = (message: string) => v.pipe(v.number(message), v.minValue(1, message))

// Editable UI state for one line — FKs may be unset, labels are display-only.
export interface SalesOrderLineDraft {
	variant_id: number | null
	product_code?: string
	product_name?: string
	sku?: string
	variant_label?: string
	brand_name?: string
	unit_name?: string
	warehouse_id: number | null
	warehouse_label?: string
	quantity: number
	price: number
	discount: number
	notes: string
}

export interface SalesOrderExpenseDraft {
	sales_expense_id: number | null
	sales_expense_label?: string
	notes: string
	amount: number
}

export interface SalesOrderDraft {
	date: string
	customer_id: number | null
	sales_id: number | null
	department_id: number | null
	top_days: number
	pkp_active: boolean
	description: string
	discount_type: SalesOrderDiscountType
	discount_value: number
	lines: SalesOrderLineDraft[]
	expenses: SalesOrderExpenseDraft[]
}

const lineFormSchema = v.object({
	variant_id: requiredId('Produk wajib dipilih'),
	product_code: v.optional(v.string()),
	product_name: v.optional(v.string()),
	sku: v.optional(v.string()),
	variant_label: v.optional(v.string()),
	brand_name: v.optional(v.string()),
	unit_name: v.optional(v.string()),
	warehouse_id: requiredId('Gudang wajib dipilih'),
	warehouse_label: v.optional(v.string()),
	quantity: v.pipe(v.number(), v.minValue(0.001, 'Jumlah harus lebih dari nol')),
	price: v.pipe(v.number(), v.minValue(1, 'Harga satuan harus lebih dari nol')),
	discount: v.pipe(v.number(), v.minValue(0, 'Diskon tidak boleh negatif')),
	notes: v.string()
})

export const salesOrderLineSchema = v.pipe(
	lineFormSchema,
	v.check((line) => line.discount <= line.price, 'Diskon per satuan tidak boleh melebihi harga')
)

const expenseSchema = v.object({
	sales_expense_id: requiredId('Biaya penjualan wajib dipilih'),
	sales_expense_label: v.optional(v.string()),
	notes: v.string(),
	amount: v.pipe(v.number(), v.minValue(1, 'Nominal biaya harus lebih dari nol'))
})

export const salesOrderSchema = v.pipe(
	v.object({
		date: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi')),
		customer_id: requiredId('Customer wajib dipilih'),
		sales_id: requiredId('Sales wajib dipilih'),
		department_id: requiredId('Departemen wajib dipilih'),
		top_days: v.picklist(TOP_DAYS, 'Termin pembayaran wajib dipilih'),
		pkp_active: v.boolean(),
		description: v.pipe(v.string(), v.trim()),
		discount_type: v.picklist(['nominal', 'percent'], 'Jenis diskon wajib dipilih'),
		discount_value: v.pipe(v.number('Diskon harus berupa angka'), v.minValue(0, 'Diskon tidak boleh negatif')),
		lines: v.pipe(
			v.array(salesOrderLineSchema),
			v.minLength(1, 'Minimal satu produk harus ditambahkan'),
			v.check(
				(lines) => new Set(lines.map((line) => line.variant_id)).size === lines.length,
				'Varian produk yang sama tidak boleh ditambahkan dua kali'
			)
		),
		expenses: v.array(expenseSchema)
	}),
	v.forward(
		v.check((order) => order.discount_type !== 'percent' || order.discount_value <= 100, 'Diskon persen maksimal 100'),
		['discount_value']
	),
	v.forward(
		v.check(
			(order) => order.discount_type !== 'nominal' || order.discount_value <= order.lines.reduce((sum, line) => sum + lineTotal(line), 0),
			'Diskon tidak boleh melebihi subtotal produk'
		),
		['discount_value']
	)
)

export type SalesOrderForm = v.InferOutput<typeof salesOrderSchema>

export function parseSalesOrder(data: unknown): { data: SalesOrderForm; errors: null } | { data: null; errors: Record<string, string> } {
	const result = v.safeParse(salesOrderSchema, data)
	if (result.success) return { data: result.output, errors: null }
	const flat = v.flatten<typeof salesOrderSchema>(result.issues)
	const nested = flat.nested ?? {}
	const errors = Object.fromEntries(Object.entries(nested).map(([key, messages]) => [key, (messages as string[])[0]]))
	if (!Object.keys(errors).length && flat.root?.length) errors.form = flat.root[0]
	return { data: null, errors }
}

export function validateSalesOrderLine(data: unknown): string | null {
	const result = v.safeParse(salesOrderLineSchema, data)
	return result.success ? null : (result.issues[0]?.message ?? 'Item produk tidak valid')
}

export function validateSalesOrderExpense(data: unknown): string | null {
	const result = v.safeParse(expenseSchema, data)
	return result.success ? null : (result.issues[0]?.message ?? 'Biaya penjualan tidak valid')
}

export const topOptions = TOP_DAYS.map((days) => ({ label: days === 0 ? 'Tunai (0 hari)' : `${days} hari`, value: days }))

// Closest allowed termin for a customer's own top_days (customers may hold values outside the fixed list, e.g. 45).
export const nearestTopDays = (days: number) => TOP_DAYS.reduce((best, d) => (Math.abs(d - days) <= Math.abs(best - days) ? d : best), TOP_DAYS[0])

export const pkpOptions = [
	{ label: 'Aktif PKP', value: 'true' },
	{ label: 'Nonaktif PKP', value: 'false' }
]

export const discountTypeOptions = [
	{ label: 'Nominal (Rp)', value: 'nominal' },
	{ label: 'Persen (%)', value: 'percent' }
]

export const approvalOptions = [
	{ label: 'Semua status persetujuan', value: '' },
	...Object.entries(approvalStatusLabel).map(([value, label]) => ({ value, label }))
]

export const invoiceOptions = [
	{ label: 'Semua status invoice', value: '' },
	...Object.entries(invoiceStatusLabel).map(([value, label]) => ({ value, label }))
]

interface LineAmounts {
	quantity: number
	price: number
	discount: number
}

// Per line: (price − discount) × quantity. The server stores its own result at save; this only feeds the live preview.
export const lineTotal = (line: LineAmounts) => Math.round((Number(line.price) - Number(line.discount)) * Number(line.quantity))

export interface SalesOrderTotals {
	subtotal: number
	discount: number
	dpp: number
	ppn: number
	expense_total: number
	total: number
}

export function totals(
	lines: LineAmounts[],
	expenses: { amount: number }[],
	opts: { pkp: boolean; discount_type: SalesOrderDiscountType; discount_value: number }
): SalesOrderTotals {
	const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0)
	const value = Number(opts.discount_value) || 0
	const discount = opts.discount_type === 'percent' ? Math.round((subtotal * value) / 100) : Math.min(Math.round(value), subtotal)
	const base = Math.max(subtotal - discount, 0)
	const dpp = opts.pkp ? base : 0
	const ppn = opts.pkp ? Math.round((dpp * VAT_RATE) / 100) : 0
	const expense_total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
	return { subtotal, discount, dpp, ppn, expense_total, total: base + ppn + expense_total }
}
