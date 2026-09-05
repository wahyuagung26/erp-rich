import * as v from 'valibot'

const optionalText = v.optional(v.pipe(v.string(), v.trim()), '')

export const branchSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode cabang wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama cabang wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	address: optionalText
})

export type BranchForm = v.InferOutput<typeof branchSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateBranch(data: unknown): Record<string, string> | null {
	const result = v.safeParse(branchSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof branchSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
