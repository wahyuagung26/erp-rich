import * as v from 'valibot'

// The approval-status maps are shared with Jurnal Umum.
export { journalStatusLabel } from '@/views/journal/schema'

export type SettlementStatus = 'unused' | 'partial' | 'settled'

export const settlementLabel: Record<SettlementStatus, string> = {
	unused: 'Belum Digunakan',
	partial: 'Sebagian',
	settled: 'Selesai'
}

export const settlementTone: Record<SettlementStatus, 'neutral' | 'warning' | 'success'> = {
	unused: 'neutral',
	partial: 'warning',
	settled: 'success'
}

export function settlementOf(used: number, amount: number): SettlementStatus {
	if (used <= 0) return 'unused'
	if (used >= amount) return 'settled'
	return 'partial'
}

const attachmentSchema = v.object({
	name: v.string(),
	type: v.string(),
	size: v.number(),
	data_url: v.string()
})

export const cashAdvanceDraftSchema = v.object({
	number: v.string(),
	voucher: v.string(),
	date: v.string(),
	department_id: v.nullable(v.number()),
	department_code: v.optional(v.string()),
	department_name: v.optional(v.string()),
	recipient: v.string(),
	description: v.string(),
	amount: v.number(),
	used: v.number(),
	cash_account_id: v.number(),
	cash_account_code: v.optional(v.string()),
	cash_account_name: v.optional(v.string()),
	advance_account_id: v.number(),
	advance_account_code: v.optional(v.string()),
	advance_account_name: v.optional(v.string()),
	cash_flow: v.string(),
	cash_flow_name: v.optional(v.string()),
	attachments: v.array(attachmentSchema)
})

export type CashAdvanceDraft = v.InferOutput<typeof cashAdvanceDraftSchema>

export const cashAdvanceRequestSchema = v.object({
	voucher: v.pipe(v.string(), v.trim(), v.nonEmpty('Nomor voucher wajib diisi')),
	date: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi')),
	department_id: v.pipe(
		v.number('Departemen wajib dipilih'),
		v.check((n) => n > 0, 'Departemen wajib dipilih')
	),
	recipient: v.pipe(v.string(), v.trim(), v.nonEmpty('Penerima wajib diisi')),
	description: v.string(),
	amount: v.pipe(
		v.number('Nominal wajib diisi'),
		v.check((n) => n > 0, 'Nominal wajib diisi')
	),
	cash_account_id: v.pipe(
		v.number('Akun kas/bank wajib dipilih'),
		v.check((n) => n > 0, 'Akun kas/bank wajib dipilih')
	),
	advance_account_id: v.pipe(
		v.number('Akun uang muka wajib dipilih'),
		v.check((n) => n > 0, 'Akun uang muka wajib dipilih')
	),
	cash_flow: v.string(),
	attachments: v.pipe(v.array(attachmentSchema), v.minLength(1, 'Lampiran wajib diunggah'), v.maxLength(5, 'Maksimal 5 lampiran'))
})

export type CashAdvanceRequest = v.InferOutput<typeof cashAdvanceRequestSchema>

export function parseCashAdvance(data: CashAdvanceDraft): { data: CashAdvanceRequest | null; errors: Record<string, string> | null } {
	const result = v.safeParse(cashAdvanceRequestSchema, {
		voucher: data.voucher,
		date: data.date,
		department_id: data.department_id,
		recipient: data.recipient,
		description: data.description,
		amount: data.amount,
		cash_account_id: data.cash_account_id,
		advance_account_id: data.advance_account_id,
		cash_flow: data.cash_flow,
		attachments: data.attachments
	})
	const errors = result.success
		? {}
		: Object.fromEntries(
				Object.entries(v.flatten<typeof cashAdvanceRequestSchema>(result.issues).nested ?? {}).map(([key, messages]) => [
					key,
					(messages as string[])[0]
				])
			)
	if (data.amount < data.used) errors.amount = 'Nominal tidak boleh kurang dari nominal yang sudah terpakai'
	return Object.keys(errors).length ? { data: null, errors } : { data: result.success ? result.output : null, errors: null }
}

export const MAX_SETTLEMENT_FILES = 10

const settlementLineSchema = v.object({
	account_id: v.pipe(
		v.number('Akun wajib dipilih'),
		v.check((n) => n > 0, 'Akun wajib dipilih')
	),
	department_id: v.pipe(
		v.number('Departemen wajib dipilih'),
		v.check((n) => n > 0, 'Departemen wajib dipilih')
	),
	cash_flow: v.nullable(v.string()),
	detail_description: v.string(),
	debit: v.pipe(v.number(), v.minValue(0, 'Nominal tidak boleh negatif')),
	credit: v.pipe(v.number(), v.minValue(0, 'Nominal tidak boleh negatif'))
})

export const settlementRequestSchema = v.object({
	date: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi')),
	description: v.string(),
	attachments: v.pipe(
		v.array(attachmentSchema),
		v.minLength(1, 'Lampiran wajib diunggah'),
		v.maxLength(MAX_SETTLEMENT_FILES, `Maksimal ${MAX_SETTLEMENT_FILES} lampiran`)
	),
	lines: v.pipe(v.array(settlementLineSchema), v.minLength(1, 'Minimal satu detail biaya harus ditambahkan'))
})

export type SettlementRequest = v.InferOutput<typeof settlementRequestSchema>

// `amount` of a settlement = Σdebit − Σcredit of its lines.
export const settlementAmount = (lines: { debit: number; credit: number }[]) => lines.reduce((sum, l) => sum + l.debit - l.credit, 0)

export function parseSettlement(data: unknown, cap: number) {
	const result = v.safeParse(settlementRequestSchema, data)
	const errors: Record<string, string> = result.success
		? {}
		: Object.fromEntries(
				Object.entries(v.flatten<typeof settlementRequestSchema>(result.issues).nested ?? {}).map(([key, messages]) => [
					key,
					(messages as string[])[0]
				])
			)
	if (result.success) {
		const amount = settlementAmount(result.output.lines)
		if (amount <= 0) errors.lines = 'Total debit harus lebih besar dari total kredit'
		else if (amount > cap) errors.lines = `Total biaya tidak boleh melebihi sisa uang muka (Rp ${cap.toLocaleString('id-ID')})`
	}
	return Object.keys(errors).length ? { data: null, errors } : { data: result.success ? result.output : null, errors: null }
}
