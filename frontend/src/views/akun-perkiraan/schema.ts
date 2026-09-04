import * as v from 'valibot'

export const AKUN_TYPES = [
	{ label: 'Kas/Bank', value: 'cash_bank' },
	{ label: 'Aset', value: 'asset' },
	{ label: 'Liabilitas', value: 'liability' },
	{ label: 'Ekuitas', value: 'equity' },
	{ label: 'Pendapatan', value: 'revenue' },
	{ label: 'Beban', value: 'expense' }
] as const

export const akunPerkiraanSchema = v.object({
	sub_akun_id: v.pipe(
		v.number('Sub akun wajib dipilih'),
		v.check((n) => n > 0, 'Sub akun wajib dipilih')
	),
	code_suffix: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode wajib diisi'), v.regex(/^\d{2}$/, 'Kode harus angka, tepat 2 digit')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama akun perkiraan wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	type: v.picklist(
		AKUN_TYPES.map((t) => t.value),
		'Pilih tipe akun'
	)
})

export type AkunPerkiraanForm = v.InferOutput<typeof akunPerkiraanSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateAkunPerkiraan(data: unknown): Record<string, string> | null {
	const result = v.safeParse(akunPerkiraanSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof akunPerkiraanSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
