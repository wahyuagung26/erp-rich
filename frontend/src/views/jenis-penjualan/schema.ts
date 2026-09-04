import * as v from 'valibot'

const akunRef = (message: string) =>
	v.pipe(
		v.number(message),
		v.check((n) => n > 0, message)
	)

export const jenisPenjualanSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode jenis wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Jenis wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	akun_pendapatan_id: akunRef('Akun pendapatan wajib dipilih'),
	akun_hpp_id: akunRef('Akun HPP wajib dipilih'),
	akun_persediaan_id: akunRef('Akun persediaan wajib dipilih'),
	akun_biaya_id: akunRef('Akun biaya wajib dipilih')
})

export type JenisPenjualanForm = v.InferOutput<typeof jenisPenjualanSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateJenisPenjualan(data: unknown): Record<string, string> | null {
	const result = v.safeParse(jenisPenjualanSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof jenisPenjualanSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
