import * as v from 'valibot'

export const unitSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode satuan wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama satuan wajib diisi'), v.minLength(2, 'Minimal 2 karakter'))
})

export type UnitForm = v.InferOutput<typeof unitSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateUnit(data: unknown): Record<string, string> | null {
	const result = v.safeParse(unitSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof unitSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
