import * as v from 'valibot'

// The approval-status maps are shared with Jurnal Umum.
export { journalStatusLabel, journalStatusTone } from '@/views/journal/schema'

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
	attachment: v.nullable(attachmentSchema)
})

export type CashAdvanceDraft = v.InferOutput<typeof cashAdvanceDraftSchema>

export const cashAdvanceRequestSchema = v.object({
	date: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi')),
	department_id: v.pipe(
		v.number('Departemen wajib dipilih'),
		v.check((n) => n > 0, 'Departemen wajib dipilih')
	),
	recipient: v.pipe(v.string(), v.trim(), v.nonEmpty('Penerima wajib diisi')),
	description: v.string(),
	amount: v.pipe(
		v.number('Nilai wajib diisi'),
		v.check((n) => n > 0, 'Nilai wajib diisi')
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
	attachment: v.object({ name: v.string(), type: v.string(), size: v.number(), data_url: v.string() }, 'Lampiran wajib diunggah')
})

export type CashAdvanceRequest = v.InferOutput<typeof cashAdvanceRequestSchema>

export function parseCashAdvance(data: CashAdvanceDraft): { data: CashAdvanceRequest | null; errors: Record<string, string> | null } {
	const result = v.safeParse(cashAdvanceRequestSchema, {
		date: data.date,
		department_id: data.department_id,
		recipient: data.recipient,
		description: data.description,
		amount: data.amount,
		cash_account_id: data.cash_account_id,
		advance_account_id: data.advance_account_id,
		cash_flow: data.cash_flow,
		attachment: data.attachment
	})
	const errors = result.success
		? {}
		: Object.fromEntries(
				Object.entries(v.flatten<typeof cashAdvanceRequestSchema>(result.issues).nested ?? {}).map(([key, messages]) => [
					key,
					(messages as string[])[0]
				])
			)
	if (data.amount < data.used) errors.amount = 'Nilai tidak boleh kurang dari nilai yang sudah terpakai'
	return Object.keys(errors).length ? { data: null, errors } : { data: result.success ? result.output : null, errors: null }
}

export const settlementRequestSchema = v.object({
	date: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi')),
	amount: v.pipe(
		v.number('Nilai wajib diisi'),
		v.check((n) => n > 0, 'Nilai wajib diisi')
	),
	attachment: v.object({ name: v.string(), type: v.string(), size: v.number(), data_url: v.string() }, 'Lampiran wajib diunggah')
})

export type SettlementRequest = v.InferOutput<typeof settlementRequestSchema>

export function parseSettlement(data: { date: string; amount: number; attachment: CashAdvanceDraft['attachment'] }, cap: number) {
	const result = v.safeParse(settlementRequestSchema, data)
	const errors = result.success
		? {}
		: Object.fromEntries(
				Object.entries(v.flatten<typeof settlementRequestSchema>(result.issues).nested ?? {}).map(([key, messages]) => [
					key,
					(messages as string[])[0]
				])
			)
	if (result.success && data.amount > cap) errors.amount = `Nilai tidak boleh melebihi sisa uang muka (${cap})`
	return Object.keys(errors).length ? { data: null, errors } : { data: result.success ? result.output : null, errors: null }
}
