import * as v from 'valibot'

const optionalText = v.optional(v.pipe(v.string(), v.trim()), '')

export const gudangSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode gudang wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama gudang wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	cabang_id: v.pipe(
		v.number('Cabang wajib dipilih'),
		v.check((n) => n > 0, 'Cabang wajib dipilih')
	),
	address: optionalText
})

export type GudangForm = v.InferOutput<typeof gudangSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateGudang(data: unknown): Record<string, string> | null {
	const result = v.safeParse(gudangSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof gudangSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
