import * as v from 'valibot'
import { approvalSubset } from '@/utils/approval'
import type { JournalStatus } from '@/utils/types'

export const journalAttachmentSchema = v.object({
	name: v.string(),
	type: v.string(),
	size: v.number(),
	data_url: v.string()
})

export const journalLineSchema = v.object({
	account_id: v.number(),
	account_code: v.optional(v.string()),
	account_name: v.optional(v.string()),
	account_type: v.optional(v.string()),
	department_id: v.optional(v.nullable(v.number())),
	department_code: v.optional(v.string()),
	department_name: v.optional(v.string()),
	cash_flow: v.optional(v.nullable(v.string())),
	cash_flow_name: v.optional(v.string()),
	detail_description: v.optional(v.string()),
	debit: v.number(),
	credit: v.number()
})

export const journalFormSchema = v.object({
	number: v.string(),
	date: v.string(),
	voucher: v.string(),
	description: v.string(),
	attachments: v.array(journalAttachmentSchema),
	lines: v.array(journalLineSchema)
})

export const { label: journalStatusLabel } = approvalSubset(['submitted', 'approved', 'rejected'] as JournalStatus[])

export type JournalFormLine = v.InferOutput<typeof journalLineSchema>
export type JournalForm = v.InferOutput<typeof journalFormSchema>
