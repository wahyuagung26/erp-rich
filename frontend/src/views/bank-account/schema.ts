import * as v from 'valibot'

const required = (label: string, max: number) =>
	v.pipe(v.string(), v.trim(), v.nonEmpty(`${label} wajib diisi`), v.maxLength(max, `Maksimal ${max} karakter`))

export const bankAccountSchema = v.object({
	bank_code: required('Kode bank', 12),
	bank_name: required('Nama bank', 50),
	account_number: required('Nomor rekening', 50),
	account_holder: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(100, 'Maksimal 100 karakter')), ''),
	account_id: v.pipe(
		v.number('Akun perkiraan wajib dipilih'),
		v.check((n) => n > 0, 'Akun perkiraan wajib dipilih')
	),
	notes: required('Keterangan', 100)
})

export type BankAccountForm = v.InferOutput<typeof bankAccountSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateBankAccount(data: unknown): Record<string, string> | null {
	const result = v.safeParse(bankAccountSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof bankAccountSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
