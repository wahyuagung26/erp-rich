import * as v from 'valibot'

export const salesExpenseSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama biaya wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	account_id: v.pipe(
		v.number('Akun biaya wajib dipilih'),
		v.check((n) => n > 0, 'Akun biaya wajib dipilih')
	),
	notes: v.optional(v.pipe(v.string(), v.trim()), '')
})

export type SalesExpenseForm = v.InferOutput<typeof salesExpenseSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateSalesExpense(data: unknown): Record<string, string> | null {
	const result = v.safeParse(salesExpenseSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof salesExpenseSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
