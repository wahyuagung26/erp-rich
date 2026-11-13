import * as v from 'valibot'

const schema = v.object({
	department_id: v.pipe(v.number('Pilih departemen'), v.minValue(1, 'Pilih departemen')),
	year: v.pipe(
		v.number('Isi tahun anggaran'),
		v.integer('Tahun harus berupa bilangan bulat'),
		v.minValue(2000, 'Tahun minimal 2000'),
		v.maxValue(2100, 'Tahun maksimal 2100')
	),
	description: v.pipe(v.string(), v.trim(), v.nonEmpty('Deskripsi wajib diisi'))
})
export function validateBudgetHeader(value: unknown): Record<string, string> | null {
	const result = v.safeParse(schema, value)
	if (result.success) return null
	const nested = v.flatten<typeof schema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(nested).map(([key, messages]) => [key, (messages as string[])[0]]))
}
