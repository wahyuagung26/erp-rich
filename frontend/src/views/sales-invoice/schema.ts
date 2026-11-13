import * as v from 'valibot'
import { approvalSubset } from '@/utils/approval'
import {
	TOP_DAYS,
	lineTotal,
	salesOrderLineSchema,
	totals,
	type SalesOrderExpenseDraft,
	type SalesOrderLineDraft,
	type SalesOrderTotals
} from '@/views/sales-order/schema'
import type { SalesInvoicePaymentStatus, SalesOrderDiscountType } from '@/utils/types'

// Totals, termin / PKP / diskon options and the line rules are the Sales Order's — an invoice is computed by the same formula.
export { TOP_DAYS, VAT_RATE, topOptions, nearestTopDays, pkpOptions, discountTypeOptions, lineTotal, totals } from '@/views/sales-order/schema'
export type SalesInvoiceTotals = SalesOrderTotals

export const { label: approvalStatusLabel } = approvalSubset(['pending', 'approved', 'rejected'])

export const paymentStatusLabel: Record<SalesInvoicePaymentStatus, string> = {
	unpaid: 'Belum Dibayar',
	partial: 'Dibayar Sebagian',
	paid: 'Lunas'
}

export const paymentStatusTone: Record<SalesInvoicePaymentStatus, 'info' | 'warning' | 'success'> = {
	unpaid: 'info',
	partial: 'warning',
	paid: 'success'
}

export const approvalOptions = [
	{ label: 'Semua status persetujuan', value: '' },
	...Object.entries(approvalStatusLabel).map(([value, label]) => ({ value, label }))
]

export const paymentOptions = [
	{ label: 'Semua status pembayaran', value: '' },
	{ label: 'Belum Lunas', value: 'open' },
	{ label: 'Lunas', value: 'paid' }
]

export const taxInvoiceOptions = [
	{ label: 'Semua faktur pajak', value: '' },
	{ label: 'Belum ada faktur pajak', value: 'missing' },
	{ label: 'Sudah ada faktur pajak', value: 'filled' }
]

const requiredId = (message: string) => v.pipe(v.number(message), v.minValue(1, message))

// A line has the same shape as a Sales Order line draft (an invoice made from an order starts as a copy of its lines).
export type SalesInvoiceLineDraft = SalesOrderLineDraft

// A payment made together with the invoice. `method` comes from the payment-type master; `down_payment` = Titipan Customer, `expense` = Biaya.
export interface SalesInvoicePaymentDraft {
	payment_type_id: number | null
	payment_type_label?: string
	method?: string
	deposit_id: number | null
	deposit_label?: string
	sales_expense_id?: number | null
	sales_expense_label?: string
	reference: string
	amount: number
}

export interface SalesInvoiceDraft {
	sales_order_id: number | null
	date: string
	customer_id: number | null
	sales_id: number | null
	department_id: number | null
	top_days: number
	pkp_active: boolean
	description: string
	discount_type: SalesOrderDiscountType
	discount_value: number
	lines: SalesInvoiceLineDraft[]
	expenses: SalesOrderExpenseDraft[]
	payments: SalesInvoicePaymentDraft[]
}

const expenseSchema = v.object({
	sales_expense_id: requiredId('Biaya penjualan wajib dipilih'),
	sales_expense_label: v.optional(v.string()),
	notes: v.string(),
	amount: v.pipe(v.number(), v.minValue(1, 'Nominal biaya harus lebih dari nol'))
})

const paymentSchema = v.pipe(
	v.object({
		// -1 = the hard-coded Biaya type, so no minValue(1) here.
		payment_type_id: v.pipe(
			v.number('Tipe pembayaran wajib dipilih'),
			v.check((id) => id !== 0, 'Tipe pembayaran wajib dipilih')
		),
		payment_type_label: v.optional(v.string()),
		method: v.optional(v.string()),
		deposit_id: v.nullable(v.number()),
		deposit_label: v.optional(v.string()),
		sales_expense_id: v.optional(v.nullable(v.number())),
		sales_expense_label: v.optional(v.string()),
		reference: v.pipe(v.string(), v.trim()),
		amount: v.pipe(v.number(), v.minValue(1, 'Nominal pembayaran harus lebih dari nol'))
	}),
	v.check((payment) => payment.method !== 'down_payment' || Boolean(payment.deposit_id), 'Titipan customer wajib dipilih'),
	v.check((payment) => payment.method !== 'expense' || Boolean(payment.sales_expense_id), 'Biaya penjualan wajib dipilih')
)

export const salesInvoiceSchema = v.pipe(
	v.object({
		sales_order_id: v.nullable(v.number()),
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
		expenses: v.array(expenseSchema),
		payments: v.array(paymentSchema)
	}),
	v.forward(
		v.check((invoice) => invoice.discount_type !== 'percent' || invoice.discount_value <= 100, 'Diskon persen maksimal 100'),
		['discount_value']
	),
	v.forward(
		v.check(
			(invoice) => invoice.discount_type !== 'nominal' || invoice.discount_value <= invoice.lines.reduce((sum, line) => sum + lineTotal(line), 0),
			'Diskon tidak boleh melebihi subtotal produk'
		),
		['discount_value']
	),
	v.forward(
		v.check(
			(invoice) =>
				invoice.payments.reduce((sum, payment) => sum + payment.amount, 0) <=
				totals(invoice.lines, invoice.expenses, {
					pkp: invoice.pkp_active,
					discount_type: invoice.discount_type,
					discount_value: invoice.discount_value
				}).total,
			'Total pembayaran melebihi total invoice'
		),
		['payments']
	)
)

export type SalesInvoiceForm = v.InferOutput<typeof salesInvoiceSchema>

export function parseSalesInvoice(data: unknown): { data: SalesInvoiceForm; errors: null } | { data: null; errors: Record<string, string> } {
	const result = v.safeParse(salesInvoiceSchema, data)
	if (result.success) return { data: result.output, errors: null }
	const flat = v.flatten<typeof salesInvoiceSchema>(result.issues)
	const nested = flat.nested ?? {}
	const errors = Object.fromEntries(Object.entries(nested).map(([key, messages]) => [key, (messages as string[])[0]]))
	if (!Object.keys(errors).length && flat.root?.length) errors.form = flat.root[0]
	return { data: null, errors }
}

export function validateSalesInvoicePayment(data: unknown): string | null {
	const result = v.safeParse(paymentSchema, data)
	return result.success ? null : (result.issues[0]?.message ?? 'Pembayaran tidak valid')
}
