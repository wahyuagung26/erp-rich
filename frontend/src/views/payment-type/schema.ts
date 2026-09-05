import * as v from 'valibot'

export const TRANSACTION_TYPE_OPTIONS = [
	{ label: 'Pembelian', value: 'purchase' },
	{ label: 'Penjualan', value: 'sale' }
] as const

export const PAYMENT_METHOD_OPTIONS = [
	{ label: 'Tunai', value: 'cash' },
	{ label: 'Potong Retur', value: 'return_deduction' },
	{ label: 'Uang Muka', value: 'down_payment' }
] as const

export const paymentTypeSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	account_id: v.pipe(
		v.number('Akun perkiraan wajib dipilih'),
		v.check((n) => n > 0, 'Akun perkiraan wajib dipilih')
	),
	transaction_type: v.picklist(
		TRANSACTION_TYPE_OPTIONS.map((t) => t.value),
		'Pilih Pembelian atau Penjualan'
	),
	method: v.picklist(
		PAYMENT_METHOD_OPTIONS.map((j) => j.value),
		'Pilih jenis pembayaran'
	)
})

export type PaymentTypeForm = v.InferOutput<typeof paymentTypeSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validatePaymentType(data: unknown): Record<string, string> | null {
	const result = v.safeParse(paymentTypeSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof paymentTypeSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
