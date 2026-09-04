import * as v from 'valibot'

export const satuanSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode satuan wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama satuan wajib diisi'), v.minLength(2, 'Minimal 2 karakter'))
})

export type SatuanForm = v.InferOutput<typeof satuanSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateSatuan(data: unknown): Record<string, string> | null {
	const result = v.safeParse(satuanSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof satuanSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
