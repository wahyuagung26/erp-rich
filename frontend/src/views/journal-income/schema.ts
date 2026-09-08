import type { JournalAttachment } from '@/utils/types'

// The approval-status maps are shared with Jurnal Umum.
export { journalStatusLabel, journalStatusTone } from '@/views/journal/schema'

export interface JournalIncomeFormLine {
	account_id: number
	account_code?: string
	account_name?: string
	department_id?: number | null
	department_code?: string
	department_name?: string
	detail_description?: string
	debit: number
	credit: number
}

export interface JournalIncomeForm {
	number: string
	date: string
	voucher: string
	description: string
	attachment: JournalAttachment | null
	cash_account_id: number
	cash_account_code?: string
	cash_account_name?: string
	department_id: number | null
	department_code?: string
	department_name?: string
	cash_flow: string
	cash_flow_name?: string
	lines: JournalIncomeFormLine[]
}
