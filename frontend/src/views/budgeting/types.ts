export type BudgetStatus = 'Draft' | 'Diajukan' | 'Disetujui' | 'Ditolak' | 'Dibatalkan'
export type BudgetAction = 'submit' | 'approve' | 'reject' | 'cancel' | 'unapprove'
export interface BudgetAccount {
	id: number
	code: string
	name: string
	section: string
	prefix: 'EXP' | 'CPX'
	sign: number
}
export interface BudgetLine {
	account_id: number
	account_code: string
	account_name: string
	section: string
	prefix: BudgetAccount['prefix']
	sign: number
	code: string
	description: string
	months: number[]
}
export interface BudgetEvent {
	action: string
	at: string
	note: string
	from: BudgetStatus | null
	to: BudgetStatus
	by: string
}
export interface BudgetDocument {
	id: number
	company_id: number
	number: string
	department_id: number
	department_code: string
	department_name: string
	year: number
	description: string
	status: BudgetStatus
	created_at: string
	lines: BudgetLine[]
	total: number
	history: BudgetEvent[]
	ytd_snapshot: Record<string, number> | null
	ytd_snapshot_year: number | null
	ytd_snapshot_month: number | null
	budget_id?: number
	budget_number?: string
	initial_lines?: BudgetLine[]
	revision_month_start?: number
	initial_total?: number
	revisions?: { id: number; number: string; status: BudgetStatus }[]
}
export interface RevisionPeriod {
	year: number
	start_date: string | null
	end_date: string | null
	is_active: boolean
	is_open: boolean
	revision_month_start: number
}
export interface RealizationRow {
	group: 'OPEX' | 'CAPEX'
	account_code: string
	account_name: string
	section: string
	sign: number
	budget: number[]
	actual: number[]
}
const tones: Record<BudgetStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
	Draft: 'neutral',
	Diajukan: 'warning',
	Disetujui: 'success',
	Ditolak: 'danger',
	Dibatalkan: 'danger'
}
export const statusTone = (status?: BudgetStatus) => (status ? tones[status] : 'neutral')
// Legacy format AWALAN/OBG{tahun}/KODE_DEPT/NNN, e.g. EXP/OBG2027/FAT/001 (no hyphen before the year).
export const codeExample = (year: number | string, prefix: BudgetAccount['prefix'] = 'EXP') => `${prefix}/OBG${year}/FAT/001`
export const codePattern = /^(EXP|CPX)\/OBG(\d{4})\/([^/]{3})\/(\d{3})$/i
export const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
export const sumLine = (line: BudgetLine) => line.months.reduce((sum, value) => sum + Number(value || 0), 0)
export const sumDocument = (lines: BudgetLine[]) => lines.reduce((sum, line) => sum + sumLine(line) * line.sign, 0)

export const budgetSectionOrder = [
	'Pendapatan',
	'Harga Pokok Penjualan',
	'Beban Operasional Penjualan',
	'Beban Umum & Administrasi',
	'Penghasilan Dividen',
	'Pendapatan dan Beban Lain-Lain',
	'Beban Pajak',
	'Belanja Modal'
]
export const sectionRank = (name: string) => {
	const index = budgetSectionOrder.indexOf(name)
	return index < 0 ? budgetSectionOrder.length - 1.5 : index
}
