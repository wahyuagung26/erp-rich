import * as v from 'valibot'
import type { SupplierPayableStatus } from '@/utils/types'

export const payableStatusLabel: Record<SupplierPayableStatus, string> = { unpaid: 'Belum Dibayar', partial: 'Dibayar Sebagian', paid: 'Lunas' }
export const payableTone: Record<SupplierPayableStatus, 'warning' | 'info' | 'success'> = { unpaid: 'warning', partial: 'info', paid: 'success' }

// List dropdowns — `open` = unpaid + partial (docs/supplier-payable/list-supplier-payable.md).
export const payableStatusOptions = [
	{ label: 'Semua status', value: '' },
	{ label: 'Belum Lunas', value: 'open' },
	{ label: 'Lunas', value: 'paid' }
]
// What the date range filters on (docs/supplier-payable/list-supplier-payable.md `date_field`).
export const dateFieldOptions = [
	{ label: 'Tanggal Hutang', value: 'date' },
	{ label: 'Jatuh Tempo', value: 'due_date' }
]
export const dueOptions = [
	{ label: 'Semua jatuh tempo', value: '' },
	{ label: 'Lewat jatuh tempo', value: 'overdue' }
]

const today = () => new Date().toISOString().slice(0, 10)

// Payment form (inline on the detail page). Which of bank / return / advance is required depends on the payment type's method.
export const paymentSchema = v.object({
	date: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
		v.check((value) => value <= today(), 'Tanggal tidak boleh melebihi hari ini')
	),
	payment_type_id: v.pipe(v.number('Tipe pembayaran wajib dipilih'), v.minValue(1, 'Tipe pembayaran wajib dipilih')),
	bank_account_id: v.nullable(v.number()),
	purchase_return_id: v.nullable(v.number()),
	supplier_advance_id: v.nullable(v.number()),
	description: v.pipe(v.string(), v.trim(), v.maxLength(250, 'Keterangan maksimal 250 karakter')),
	amount: v.pipe(v.number('Nominal wajib diisi'), v.minValue(1, 'Nominal harus lebih dari nol'))
})

export type PaymentForm = v.InferOutput<typeof paymentSchema>

export function validatePayment(
	data: PaymentForm,
	method: string | undefined,
	remaining: number,
	refRemaining: number // what the picked purchase return / supplier advance can still absorb
): Record<string, string> | null {
	const errors: Record<string, string> = {}
	const result = v.safeParse(paymentSchema, data)
	if (!result.success) for (const issue of result.issues) errors[String(issue.path?.[0]?.key)] ??= issue.message
	if (method === 'cash_bank' && !data.bank_account_id) errors.bank_account_id ??= 'Rekening cash / bank wajib dipilih'
	if (method === 'return_deduction') {
		if (!data.purchase_return_id) errors.purchase_return_id ??= 'Retur pembelian wajib dipilih'
		else if (data.amount > refRemaining) errors.amount ??= 'Nominal melebihi sisa retur'
	}
	if (method === 'down_payment') {
		if (!data.supplier_advance_id) errors.supplier_advance_id ??= 'Uang muka supplier wajib dipilih'
		else if (data.amount > refRemaining) errors.amount ??= 'Nominal melebihi sisa uang muka'
	}
	if (data.amount > remaining) errors.amount ??= 'Nominal melebihi sisa hutang'
	return Object.keys(errors).length ? errors : null
}
