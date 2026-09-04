import * as v from 'valibot'

export const TRANSAKSI_OPTIONS = [
	{ label: 'Pembelian', value: 'pembelian' },
	{ label: 'Penjualan', value: 'penjualan' }
] as const

export const JENIS_PEMBAYARAN_OPTIONS = [
	{ label: 'Tunai', value: 'tunai' },
	{ label: 'Potong Retur', value: 'potong_retur' },
	{ label: 'Uang Muka', value: 'uang_muka' }
] as const

export const tipePembayaranSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	akun_perkiraan_id: v.pipe(
		v.number('Akun perkiraan wajib dipilih'),
		v.check((n) => n > 0, 'Akun perkiraan wajib dipilih')
	),
	transaksi: v.picklist(
		TRANSAKSI_OPTIONS.map((t) => t.value),
		'Pilih Pembelian atau Penjualan'
	),
	jenis: v.picklist(
		JENIS_PEMBAYARAN_OPTIONS.map((j) => j.value),
		'Pilih jenis pembayaran'
	)
})

export type TipePembayaranForm = v.InferOutput<typeof tipePembayaranSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateTipePembayaran(data: unknown): Record<string, string> | null {
	const result = v.safeParse(tipePembayaranSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof tipePembayaranSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
