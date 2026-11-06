import { BIAYA_PAYMENT_TYPE } from '@/constant/payment'
import * as v from 'valibot'
import type { CustomerReceivablePaymentSource } from '@/utils/types'

// Status badge label / tone are the invoice's own payment status.
export { paymentStatusLabel as receivableStatusLabel, paymentStatusTone as receivableTone } from '@/views/sales-invoice/schema'

// List dropdowns — `open` = unpaid + partial (docs/customer-receivable/list-customer-receivable.md).
export const statusOptions = [
	{ label: 'Semua status', value: '' },
	{ label: 'Belum Lunas', value: 'open' },
	{ label: 'Lunas', value: 'paid' }
]
export const dueOptions = [
	{ label: 'Semua jatuh tempo', value: '' },
	{ label: 'Lewat jatuh tempo', value: 'overdue' }
]
// What the date range filters on (`date_field`).
export const dateFieldOptions = [
	{ label: 'Tanggal Invoice', value: 'date' },
	{ label: 'Jatuh Tempo', value: 'due_date' }
]

// The hard-coded payment type "Biaya" (decision 2026-10-14) — same id the mock lists it with.
export const BIAYA_TYPE_ID = BIAYA_PAYMENT_TYPE.id

export const sourceNote: Record<Exclude<CustomerReceivablePaymentSource, 'receivable'>, string> = {
	creation: 'Dikelola dari Invoice Penjualan',
	return: 'Dikelola dari Retur Penjualan'
}

const today = () => new Date().toISOString().slice(0, 10)

// Payment form (inline on the detail page). Which of bank / titipan / biaya is required depends on the payment type's method.
export const paymentSchema = v.object({
	date: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
		v.check((value) => value <= today(), 'Tanggal tidak boleh melebihi hari ini')
	),
	// 0 = nothing picked; -1 = Biaya
	payment_type_id: v.pipe(
		v.number('Tipe pembayaran wajib dipilih'),
		v.check((value) => value !== 0, 'Tipe pembayaran wajib dipilih')
	),
	bank_account_id: v.nullable(v.number()),
	deposit_id: v.nullable(v.number()),
	sales_expense_id: v.nullable(v.number()),
	description: v.pipe(v.string(), v.trim(), v.maxLength(250, 'Keterangan maksimal 250 karakter')),
	amount: v.pipe(v.number('Nominal wajib diisi'), v.minValue(1, 'Nominal harus lebih dari nol'))
})

export type PaymentForm = v.InferOutput<typeof paymentSchema>

export function validatePayment(
	data: PaymentForm,
	method: string | undefined,
	outstanding: number,
	depositRemaining: number // what the picked titipan can still absorb
): Record<string, string> | null {
	const errors: Record<string, string> = {}
	const result = v.safeParse(paymentSchema, data)
	if (!result.success) for (const issue of result.issues) errors[String(issue.path?.[0]?.key)] ??= issue.message
	if (method === 'cash_bank' && !data.bank_account_id) errors.bank_account_id ??= 'Rekening cash / bank wajib dipilih'
	if (method === 'down_payment') {
		if (!data.deposit_id) errors.deposit_id ??= 'Titipan customer wajib dipilih'
		else if (data.amount > depositRemaining) errors.amount ??= 'Nominal melebihi sisa titipan'
	}
	if (method === 'expense' && !data.sales_expense_id) errors.sales_expense_id ??= 'Biaya penjualan wajib dipilih'
	if (data.amount > outstanding) errors.amount ??= 'Nominal melebihi sisa piutang'
	return Object.keys(errors).length ? errors : null
}
