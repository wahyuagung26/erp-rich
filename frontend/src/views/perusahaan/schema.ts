import * as v from 'valibot'
import type { CompanyType } from '@/utils/types'

const optionalText = v.optional(v.pipe(v.string(), v.trim()), '')

// "Tipe Perusahaan" options — value is stored, label is shown.
export const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
	{ value: 'pt', label: 'Perseroan Terbatas (PT)' },
	{ value: 'cv', label: 'Persekutuan Komanditer (CV)' },
	{ value: 'ud', label: 'Usaha Dagang (UD)' },
	{ value: 'firma', label: 'Firma' },
	{ value: 'perorangan', label: 'Perorangan' },
	{ value: 'koperasi', label: 'Koperasi' },
	{ value: 'yayasan', label: 'Yayasan' }
]

export const companyTypeLabel = (t: string) => COMPANY_TYPES.find((o) => o.value === t)?.label ?? t

export const perusahaanSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode perusahaan wajib diisi')),
	short_name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama pendek wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	legal_name: optionalText,
	npwp: optionalText,
	logo_url: optionalText,
	address: optionalText,
	company_type: v.picklist(
		COMPANY_TYPES.map((o) => o.value),
		'Tipe perusahaan wajib dipilih'
	),
	hr_enabled: v.boolean(),
	report_header_color: v.pipe(v.string(), v.trim(), v.regex(/^#[0-9a-fA-F]{6}$/, 'Warna harus format #RRGGBB'))
})

export type PerusahaanForm = v.InferOutput<typeof perusahaanSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validatePerusahaan(data: unknown): Record<string, string> | null {
	const result = v.safeParse(perusahaanSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof perusahaanSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
