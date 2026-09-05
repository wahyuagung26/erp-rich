import * as v from 'valibot'

export const brandSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode merk wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama merk wajib diisi'), v.minLength(2, 'Minimal 2 karakter'))
})

export type BrandForm = v.InferOutput<typeof brandSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateBrand(data: unknown): Record<string, string> | null {
	const result = v.safeParse(brandSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof brandSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
