import type { JournalAttachment } from '@/utils/types'

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

export interface CashAdvanceForm {
	number: string
	date: string
	department_id: number | null
	department_code?: string
	department_name?: string
	recipient: string
	description: string
	amount: number
	used: number
	cash_account_id: number
	cash_account_code?: string
	cash_account_name?: string
	advance_account_id: number
	advance_account_code?: string
	advance_account_name?: string
	cash_flow: string
	cash_flow_name?: string
	attachment: JournalAttachment | null
}
