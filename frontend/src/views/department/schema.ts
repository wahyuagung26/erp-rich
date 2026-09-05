import * as v from 'valibot'

export const departmentSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode departemen wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama departemen wajib diisi'), v.minLength(2, 'Minimal 2 karakter'))
})

export type DepartmentForm = v.InferOutput<typeof departmentSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateDepartment(data: unknown): Record<string, string> | null {
	const result = v.safeParse(departmentSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof departmentSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
