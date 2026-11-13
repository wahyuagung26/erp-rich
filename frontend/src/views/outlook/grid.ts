import { DAYNAMES, MON_SHORT, type Flow, type OutlookWeek } from './types'
import { money } from '@/utils/format'

// Grid display helpers shared by Daily, Resume Weekly and Lampiran.
export const cell = (v: number | null | undefined, showZero = false) => (v == null || (v === 0 && !showZero) ? '-' : money(v))
export const negative = (v: number | null | undefined) => (v ?? 0) < 0

export const pct = (v: number | null | undefined) => (v == null ? '-' : `${v.toFixed(1).replace('.', ',')}%`)

// Achievement band (legacy ACH_RED_MAX 80 / ACH_GREEN_MIN 100), compared at 1 decimal; Cash Out is reversed (spending low = good).
export function achClass(v: number | null | undefined, flow: Flow): string {
	if (v == null) return 'bg-fill text-ink-muted'
	const r = Math.round(v * 10) / 10
	const out = flow === 'CASH_OUT'
	const band = r <= 80 ? (out ? 'good' : 'bad') : r < 100 ? 'mid' : out ? 'bad' : 'good'
	return band === 'good' ? 'bg-success text-ink-invert' : band === 'bad' ? 'bg-danger text-ink-invert' : 'bg-warning text-ink-invert'
}

// Level-2 rows are tinted per level-1 group (decision 14-C5); the closed palette gives 6 tints that cycle.
const TINTS = ['bg-info-soft', 'bg-warning-soft', 'bg-success-soft', 'bg-primary-soft', 'bg-danger-soft', 'bg-fill']
export function level2Tints(rows: { id: number; depth: number }[]): Record<number, string> {
	const out: Record<number, string> = {}
	let g = -1
	for (const r of rows) {
		if (r.depth === 1) g++
		if (r.depth === 2) out[r.id] = TINTS[g % TINTS.length]
	}
	return out
}

export const indent = (depth: number) => ({ paddingLeft: `${8 + (depth - 1) * 18}px` })

export const dmy = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
export const dmyFull = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`
const dow = (d: string) => new Date(`${d}T12:00:00`).getDay()

// Column header text: "28" or, for a range column, "28-29" with "Rab-Kam"; a date outside the period month is tagged with its month.
export function colLabel(w: OutlookWeek, i: number): string {
	const d = w.slots[i]
	if (!d) return '+'
	const e = w.ends[i]
	return e ? `${d.slice(8, 10)}-${e.slice(8, 10)}` : d.slice(8, 10)
}
export function colDayName(w: OutlookWeek, i: number, year: number, month: number): string {
	const d = w.slots[i]
	if (!d) return ''
	const e = w.ends[i]
	const inMonth = (x: string) => x.slice(0, 7) === `${year}-${String(month).padStart(2, '0')}`
	const edge = !inMonth(d) ? d : e && !inMonth(e) ? e : null
	return (e ? `${DAYNAMES[dow(d)]}-${DAYNAMES[dow(e)]}` : DAYNAMES[dow(d)]) + (edge ? ` ${MON_SHORT[Number(edge.slice(5, 7)) - 1]}` : '')
}
export const colTitle = (w: OutlookWeek, i: number) =>
	w.slots[i] ? `${dmyFull(w.slots[i]!)}${w.ends[i] ? ` s/d ${dmyFull(w.ends[i]!)}` : ''}` : 'Kolom belum bertanggal'
export const weekRange = (w: OutlookWeek) => (w.start_date && w.end_date ? `${dmy(w.start_date)} - ${dmy(w.end_date)}` : '')
