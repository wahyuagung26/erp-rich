import * as v from 'valibot'

const optionalText = v.optional(v.pipe(v.string(), v.trim()), '')

export const customerSchema = v.object({
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama customer wajib diisi'), v.minLength(3, 'Minimal 3 karakter')),
	phone: optionalText,
	email: v.union([v.literal(''), v.pipe(v.string(), v.trim(), v.email('Format email tidak valid'))]),
	address: optionalText,
	city: optionalText,
	bank_name: optionalText,
	bank_account: optionalText,
	npwp: optionalText,
	pkp: v.boolean(),
	top_days: v.pipe(v.number(), v.integer('Harus bilangan bulat'), v.minValue(0, 'Tidak boleh negatif')),
	notes: optionalText
})

export type CustomerForm = v.InferOutput<typeof customerSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateCustomer(data: unknown): Record<string, string> | null {
	const result = v.safeParse(customerSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof customerSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
