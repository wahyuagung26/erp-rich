import * as v from 'valibot'

const attachmentSchema = v.object({
	name: v.string(),
	type: v.string(),
	size: v.number(),
	data_url: v.string()
})

export const customerDepositDraftSchema = v.object({
	number: v.string(),
	date: v.string(),
	department_id: v.nullable(v.number()),
	department_code: v.optional(v.string()),
	department_name: v.optional(v.string()),
	customer_id: v.nullable(v.number()),
	customer_code: v.optional(v.string()),
	customer_name: v.optional(v.string()),
	amount: v.number(),
	used: v.number(),
	cash_account_id: v.nullable(v.number()),
	cash_account_code: v.optional(v.string()),
	cash_account_name: v.optional(v.string()),
	cash_flow: v.string(),
	cash_flow_name: v.optional(v.string()),
	description: v.string(),
	attachment: v.nullable(attachmentSchema)
})

export type CustomerDepositDraft = v.InferOutput<typeof customerDepositDraftSchema>

export const customerDepositRequestSchema = v.object({
	date: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi')),
	department_id: v.pipe(
		v.number('Departemen wajib dipilih'),
		v.check((n) => n > 0, 'Departemen wajib dipilih')
	),
	customer_id: v.pipe(
		v.number('Customer wajib dipilih'),
		v.check((n) => n > 0, 'Customer wajib dipilih')
	),
	amount: v.pipe(
		v.number('Nominal wajib diisi'),
		v.check((n) => n > 0, 'Nominal wajib diisi')
	),
	cash_account_id: v.pipe(
		v.number('Akun kas/bank wajib dipilih'),
		v.check((n) => n > 0, 'Akun kas/bank wajib dipilih')
	),
	cash_flow: v.string(),
	description: v.string(),
	attachment: v.object(
		{
			name: v.string(),
			type: v.string(),
			size: v.number(),
			data_url: v.string()
		},
		'Lampiran wajib diunggah'
	)
})

export type CustomerDepositRequest = v.InferOutput<typeof customerDepositRequestSchema>

export function parseCustomerDeposit(data: CustomerDepositDraft): { data: CustomerDepositRequest | null; errors: Record<string, string> | null } {
	const result = v.safeParse(customerDepositRequestSchema, {
		date: data.date,
		department_id: data.department_id,
		customer_id: data.customer_id,
		amount: data.amount,
		cash_account_id: data.cash_account_id,
		cash_flow: data.cash_flow,
		description: data.description,
		attachment: data.attachment
	})
	if (result.success) {
		// A used deposit can only be raised, never cut below what invoices already took.
		if (result.output.amount < data.used) return { data: null, errors: { amount: 'Nominal tidak boleh kurang dari yang sudah dipakai' } }
		return { data: result.output, errors: null }
	}
	const nested = v.flatten<typeof customerDepositRequestSchema>(result.issues).nested ?? {}
	return { data: null, errors: Object.fromEntries(Object.entries(nested).map(([key, messages]) => [key, (messages as string[])[0]])) }
}

// Usage state of a deposit (badge on list/detail/edit).
export function depositUsage(deposit: { used: number; remaining: number }): { label: string; tone: 'info' | 'warning' | 'success' } {
	if (deposit.used <= 0) return { label: 'Belum Dipakai', tone: 'info' }
	return deposit.remaining > 0 ? { label: 'Sebagian Terpakai', tone: 'warning' } : { label: 'Terpakai Penuh', tone: 'success' }
}
