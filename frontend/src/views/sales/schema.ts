import * as v from 'valibot'

const optionalText = v.optional(v.pipe(v.string(), v.trim()), '')

export const salesSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode sales wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama sales wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	address: optionalText
})

export type SalesForm = v.InferOutput<typeof salesSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateSales(data: unknown): Record<string, string> | null {
	const result = v.safeParse(salesSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof salesSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
