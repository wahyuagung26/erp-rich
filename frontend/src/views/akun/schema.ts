import * as v from 'valibot'

export const AKUN_TYPES = [
	{ label: 'Aset', value: 'asset' },
	{ label: 'Liabilitas', value: 'liability' },
	{ label: 'Ekuitas', value: 'equity' },
	{ label: 'Pendapatan', value: 'revenue' },
	{ label: 'Beban', value: 'expense' }
] as const

export const akunSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode akun wajib diisi'), v.regex(/^\d[-\d]*$/, 'Format kode tidak valid (mis. 1-1000)')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama akun wajib diisi'), v.minLength(3, 'Minimal 3 karakter')),
	type: v.picklist(
		AKUN_TYPES.map((t) => t.value),
		'Pilih tipe akun'
	),
	normal_balance: v.picklist(['debit', 'credit'] as const),
	active: v.boolean()
})

export type AkunForm = v.InferOutput<typeof akunSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateAkun(data: unknown): Record<string, string> | null {
	const result = v.safeParse(akunSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof akunSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
