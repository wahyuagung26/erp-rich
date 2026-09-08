import * as v from 'valibot'

const attachmentSchema = v.object({
	name: v.string(),
	type: v.string(),
	size: v.number(),
	data_url: v.string()
})

export const supplierAdvanceDraftSchema = v.object({
	number: v.string(),
	date: v.string(),
	department_id: v.nullable(v.number()),
	department_code: v.optional(v.string()),
	department_name: v.optional(v.string()),
	supplier_id: v.nullable(v.number()),
	supplier_code: v.optional(v.string()),
	supplier_name: v.optional(v.string()),
	amount: v.number(),
	used: v.number(),
	cash_account_id: v.nullable(v.number()),
	cash_account_code: v.optional(v.string()),
	cash_account_name: v.optional(v.string()),
	advance_type: v.string(),
	cash_flow: v.string(),
	cash_flow_name: v.optional(v.string()),
	description: v.string(),
	attachment: v.nullable(attachmentSchema)
})

export type SupplierAdvanceDraft = v.InferOutput<typeof supplierAdvanceDraftSchema>

export const supplierAdvanceRequestSchema = v.object({
	date: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi')),
	department_id: v.pipe(
		v.number('Departemen wajib dipilih'),
		v.check((n) => n > 0, 'Departemen wajib dipilih')
	),
	supplier_id: v.pipe(
		v.number('Supplier wajib dipilih'),
		v.check((n) => n > 0, 'Supplier wajib dipilih')
	),
	amount: v.pipe(
		v.number('Nominal wajib diisi'),
		v.check((n) => n > 0, 'Nominal wajib diisi')
	),
	cash_account_id: v.pipe(
		v.number('Akun kas/bank wajib dipilih'),
		v.check((n) => n > 0, 'Akun kas/bank wajib dipilih')
	),
	advance_type: v.pipe(v.string(), v.nonEmpty('Jenis uang muka wajib dipilih')),
	cash_flow: v.string(),
	description: v.string(),
	attachment: v.object(
		{
			name: v.string(),
			type: v.string(),
			size: v.number(),
			data_url: v.string()
		},
		'Lampiran wajib diunggah'
	)
})

export type SupplierAdvanceRequest = v.InferOutput<typeof supplierAdvanceRequestSchema>

export function parseSupplierAdvance(data: SupplierAdvanceDraft): { data: SupplierAdvanceRequest | null; errors: Record<string, string> | null } {
	const result = v.safeParse(supplierAdvanceRequestSchema, {
		date: data.date,
		department_id: data.department_id,
		supplier_id: data.supplier_id,
		amount: data.amount,
		cash_account_id: data.cash_account_id,
		advance_type: data.advance_type,
		cash_flow: data.cash_flow,
		description: data.description,
		attachment: data.attachment
	})
	if (result.success) return { data: result.output, errors: null }
	const nested = v.flatten<typeof supplierAdvanceRequestSchema>(result.issues).nested ?? {}
	return { data: null, errors: Object.fromEntries(Object.entries(nested).map(([key, messages]) => [key, (messages as string[])[0]])) }
}

export const advanceTypeOptions = [{ label: 'TITIPAN-PO', value: 'TITIPAN-PO' }]

// List search field selector (Legacy "Cari Berdasarkan").
export const searchFieldOptions = [
	{ label: 'Nomor Transaksi', value: 'number' },
	{ label: 'Supplier', value: 'supplier' },
	{ label: 'Tanggal', value: 'date' },
	{ label: 'Keterangan', value: 'description' }
]

export const sortFieldOptions = [
	{ label: 'Tanggal', value: 'date' },
	{ label: 'Nomor Transaksi', value: 'number' },
	{ label: 'Supplier', value: 'supplier_name' },
	{ label: 'Saldo Tersedia', value: 'remaining' }
]

export const sortOrderOptions = [
	{ label: 'Menaik', value: 'asc' },
	{ label: 'Menurun', value: 'desc' }
]

export const limitOptions = [
	{ label: 'Maks. 20 data', value: '20' },
	{ label: 'Semua data', value: 'all' }
]
