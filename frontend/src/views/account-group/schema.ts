import * as v from 'valibot'

export const ACCOUNT_GROUP_CATEGORIES = [
	{ label: 'Neraca', value: 'balance_sheet' },
	{ label: 'Laba Rugi', value: 'income_statement' }
] as const

export const accountGroupSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode group akun wajib diisi'), v.regex(/^\d{1,2}$/, 'Kode harus angka, maksimal 2 digit')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama group akun wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	category: v.picklist(
		ACCOUNT_GROUP_CATEGORIES.map((c) => c.value),
		'Pilih Neraca atau Laba Rugi'
	),
	normal_balance: v.picklist(['debit', 'credit'] as const, 'Pilih posisi debit atau kredit')
})

export type AccountGroupForm = v.InferOutput<typeof accountGroupSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateAccountGroup(data: unknown): Record<string, string> | null {
	const result = v.safeParse(accountGroupSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof accountGroupSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
