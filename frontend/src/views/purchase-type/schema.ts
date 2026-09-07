import * as v from 'valibot'

const optionalText = v.optional(v.pipe(v.string(), v.trim()), '')

export const purchaseTypeSchema = v.object({
	code: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Kode jenis pembelian wajib diisi'),
		v.maxLength(5, 'Maksimal 5 karakter'),
		v.regex(/^[A-Z]+$/, 'Kode harus huruf kapital A-Z')
	),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama jenis pembelian wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	notes: optionalText
})

export type PurchaseTypeForm = v.InferOutput<typeof purchaseTypeSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validatePurchaseType(data: unknown): Record<string, string> | null {
	const result = v.safeParse(purchaseTypeSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof purchaseTypeSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
