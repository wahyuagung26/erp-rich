import * as v from 'valibot'

export const GROUP_AKUN_CATEGORIES = [
	{ label: 'Neraca', value: 'neraca' },
	{ label: 'Laba Rugi', value: 'laba_rugi' }
] as const

export const groupAkunSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode group akun wajib diisi'), v.regex(/^\d{1,2}$/, 'Kode harus angka, maksimal 2 digit')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama group akun wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	category: v.picklist(
		GROUP_AKUN_CATEGORIES.map((c) => c.value),
		'Pilih Neraca atau Laba Rugi'
	),
	normal_balance: v.picklist(['debit', 'credit'] as const, 'Pilih posisi debit atau kredit')
})

export type GroupAkunForm = v.InferOutput<typeof groupAkunSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateGroupAkun(data: unknown): Record<string, string> | null {
	const result = v.safeParse(groupAkunSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof groupAkunSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
