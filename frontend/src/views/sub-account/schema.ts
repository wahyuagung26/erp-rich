import * as v from 'valibot'

export const subAccountSchema = v.object({
	account_group_id: v.pipe(
		v.number('Group perkiraan wajib dipilih'),
		v.check((n) => n > 0, 'Group perkiraan wajib dipilih')
	),
	code_suffix: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode wajib diisi'), v.regex(/^\d{3}$/, 'Kode harus angka, tepat 3 digit')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama sub akun wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	normal_balance: v.picklist(['debit', 'credit'] as const, 'Pilih posisi debit atau kredit')
})

export type SubAccountForm = v.InferOutput<typeof subAccountSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateSubAccount(data: unknown): Record<string, string> | null {
	const result = v.safeParse(subAccountSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof subAccountSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
