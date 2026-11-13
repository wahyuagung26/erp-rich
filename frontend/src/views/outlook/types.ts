// Shapes of docs/outlook/index.md (State). Arrays are indexed by position in `weeks` (week 1 = index 0); slot arrays have 7 items.
export type Flow = 'CASH_IN' | 'CASH_OUT'
export type Day = string | null // 'YYYY-MM-DD' | empty column

export interface OutlookWeek {
	week_no: number
	start_date: string | null
	end_date: string | null
	slots: Day[]
	ends: Day[]
}

export interface Agg {
	ol_week: number[]
	actual_week: number[]
	ach_week: (number | null)[]
	actual_day: (number | null)[][]
	ol_total: number
	actual_total: number
	ach_total: number | null
}

interface RowIdentity {
	id: number
	parent_id: number | null
	flow_type: Flow
	name: string
	depth: number
	is_leaf: boolean
}
export type OutlookRow = RowIdentity & Agg

export interface ResumeAgg {
	target_mtd: number[]
	actual_mtd: number[]
	ach_mtd: (number | null)[]
	ol_week: number[]
	actual_week: number[]
	ach_week: (number | null)[]
}
export type ResumeRow = RowIdentity & ResumeAgg

export type RekonStatus = 'balance' | 'tidak_balance' | 'belum_diisi' | 'tidak_tersedia'
export interface Rekon {
	date: string
	status: RekonStatus
	outlook: number
	bank: number | null
	selisih: number | null
}

export interface OutlookCalc {
	rows: OutlookRow[]
	totals: Record<Flow | 'SURPLUS', Agg>
	saldo_awal_set: boolean
	saldo_awal_row: { total: number; ol_week: number[]; actual_week: number[]; actual_day: (number | null)[][] }
	saldo_day: (number | null)[][]
	saldo_week: number[]
	saldo_ol_week: number[]
	saldo_akhir: number
	saldo_akhir_date: string
	rekon: Rekon
	resume: {
		rows: ResumeRow[]
		totals: Record<Flow | 'SURPLUS', ResumeAgg>
		saldo: number[]
		saldo_awal: { monthly: number; weeks: { target_mtd: number; actual_mtd: number; ol_week: number; actual_week: number }[] }
	}
}

export type SumberDana = 'CASH_IN' | 'CASH_OUT'
export interface LampiranRow {
	id: number
	keterangan: string
	sumber_dana: SumberDana
	hari: Record<number, number>
	total: number
}
export interface LampiranBody {
	keterangan: string
	sumber_dana: SumberDana | ''
	hari: Record<number, number>
}
export interface Lampiran {
	rows: LampiranRow[]
	count: number
	max: number
	day_totals: Record<number, number>
	total: number
}

export interface OutlookPeriod {
	id: number
	year: number
	month: number
	locked: boolean
	saldo_awal_bank: number | null
}

export interface OutlookStateFull {
	exists: true
	can_edit: boolean
	period: OutlookPeriod
	weeks: OutlookWeek[]
	calc: OutlookCalc
	lampiran: Lampiran
}
export interface OutlookStateEmpty {
	exists: false
	can_edit: boolean
	year: number
	month: number
	locked: boolean
}
export type OutlookState = OutlookStateFull | OutlookStateEmpty

export interface DuplicateConflict {
	exists: true
	period_id: number
	year: number
	month: number
	categories: number
	ol_rows: number
	actual_rows: number
}

export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
export const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
export const DAYNAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

// Legacy rules shared by mock + UI (Outlook_rules).
export const MAX_DEPTH = 3
export const MAX_NAME = 150
export const RANGE_WEEK = 5
export const RANGE_FIRST_SLOT = 5 // columns 5..7 of week 5 may be a range
export const RANGE_MAX_DAYS = 3
export const EDGE_DAYS = 7
export const MAX_ABS = 9_999_999_999_999.99
export const LAMPIRAN_MAX_ROWS = 500
export const LAMPIRAN_MAX_TEXT = 255
