import * as v from 'valibot'
import { journalAttachmentSchema, journalLineSchema } from '@/views/journal/schema'

// The approval-status maps are shared with Jurnal Umum.
export { journalStatusLabel, journalStatusTone } from '@/views/journal/schema'

export const journalExpenseFormSchema = v.object({
	number: v.string(),
	date: v.string(),
	voucher: v.string(),
	description: v.string(),
	attachment: v.nullable(journalAttachmentSchema),
	cash_account_id: v.number(),
	cash_account_code: v.optional(v.string()),
	cash_account_name: v.optional(v.string()),
	department_id: v.nullable(v.number()),
	department_code: v.optional(v.string()),
	department_name: v.optional(v.string()),
	cash_flow: v.string(),
	cash_flow_name: v.optional(v.string()),
	lines: v.array(journalLineSchema)
})

export type JournalExpenseFormLine = v.InferOutput<typeof journalLineSchema>
export type JournalExpenseForm = v.InferOutput<typeof journalExpenseFormSchema>
