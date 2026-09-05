import * as v from 'valibot'

const accountRef = (message: string) =>
	v.pipe(
		v.number(message),
		v.check((n) => n > 0, message)
	)

export const salesTypeSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode jenis wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Jenis wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	revenue_account_id: accountRef('Akun pendapatan wajib dipilih'),
	cogs_account_id: accountRef('Akun HPP wajib dipilih'),
	inventory_account_id: accountRef('Akun persediaan wajib dipilih'),
	expense_account_id: accountRef('Akun biaya wajib dipilih')
})

export type SalesTypeForm = v.InferOutput<typeof salesTypeSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateSalesType(data: unknown): Record<string, string> | null {
	const result = v.safeParse(salesTypeSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof salesTypeSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
