import * as v from 'valibot'

const optionalText = v.optional(v.pipe(v.string(), v.trim()), '')

export const cabangSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode cabang wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama cabang wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	address: optionalText
})

export type CabangForm = v.InferOutput<typeof cabangSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateCabang(data: unknown): Record<string, string> | null {
	const result = v.safeParse(cabangSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof cabangSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
