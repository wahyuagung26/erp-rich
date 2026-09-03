import * as v from 'valibot'

const optionalText = v.optional(v.pipe(v.string(), v.trim()), '')

export const supplierSchema = v.object({
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama supplier wajib diisi'), v.minLength(3, 'Minimal 3 karakter')),
	address: v.pipe(v.string(), v.trim(), v.nonEmpty('Alamat wajib diisi')),
	city: optionalText,
	phone: v.pipe(v.string(), v.trim(), v.nonEmpty('Telepon wajib diisi')),
	fax: optionalText,
	email: v.union([v.literal(''), v.pipe(v.string(), v.trim(), v.email('Format email tidak valid'))]),
	contact_person: optionalText,
	npwp: v.pipe(v.string(), v.trim(), v.nonEmpty('NPWP wajib diisi')),
	pkp: v.boolean(),
	bank_name: optionalText,
	bank_account: optionalText,
	top_days: v.pipe(v.number(), v.integer('Harus bilangan bulat'), v.minValue(0, 'Tidak boleh negatif')),
	notes: optionalText
})

export type SupplierForm = v.InferOutput<typeof supplierSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateSupplier(data: unknown): Record<string, string> | null {
	const result = v.safeParse(supplierSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof supplierSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
