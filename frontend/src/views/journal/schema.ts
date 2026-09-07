import type { Account, JournalAttachment, JournalLine, JournalStatus } from '@/utils/types'

export const journalStatusLabel: Record<JournalStatus, string> = {
	submitted: 'Menunggu Persetujuan',
	approved: 'Disetujui',
	rejected: 'Ditolak'
}

export const journalStatusTone: Record<JournalStatus, 'success' | 'danger' | 'warning'> = {
	submitted: 'warning',
	approved: 'success',
	rejected: 'danger'
}

export interface JournalFormLine extends JournalLine {
	account_type?: Account['type']
}

export interface JournalForm {
	number: string
	date: string
	voucher: string
	description: string
	attachment: JournalAttachment | null
	lines: JournalFormLine[]
}
