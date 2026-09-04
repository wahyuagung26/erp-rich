import * as v from 'valibot'

export const kategoriSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode kategori wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama kategori wajib diisi'), v.minLength(2, 'Minimal 2 karakter'))
})

export type KategoriForm = v.InferOutput<typeof kategoriSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateKategori(data: unknown): Record<string, string> | null {
	const result = v.safeParse(kategoriSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof kategoriSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
