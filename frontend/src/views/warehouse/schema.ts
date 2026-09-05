import * as v from 'valibot'

const optionalText = v.optional(v.pipe(v.string(), v.trim()), '')

export const warehouseSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode gudang wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama gudang wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	branch_id: v.pipe(
		v.number('Cabang wajib dipilih'),
		v.check((n) => n > 0, 'Cabang wajib dipilih')
	),
	address: optionalText
})

export type WarehouseForm = v.InferOutput<typeof warehouseSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateWarehouse(data: unknown): Record<string, string> | null {
	const result = v.safeParse(warehouseSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof warehouseSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
