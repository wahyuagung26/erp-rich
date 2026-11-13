import type { Agg, Flow, OutlookCalc, OutlookRow, OutlookWeek, ResumeAgg } from '@/views/outlook/types'

// Port of legacy Outlook_calculator (docs/outlook/index.md "Calculation rules"). All sums are integer cents, converted to numbers on the way out.
export interface CalcCategory {
	id: number
	parent_id: number | null
	flow_type: Flow
	name: string
	sort_order: number
	depth: number
}
export interface CalcInput {
	saldo_awal_bank: number | null
	year: number
	month: number
	weeks: Pick<OutlookWeek, 'week_no' | 'slots'>[]
	categories: CalcCategory[]
	ol: Record<number, Record<number, number>> // category → week_no → amount
	actual: Record<number, Record<number, Record<number, number>>> // category → week_no → slot(0-6) → amount
}

type Internal = { ol_week: number[]; actual_day: number[][]; actual_week: number[]; ol_total: number; actual_total: number }

const cents = (v: number) => Math.round(v * 100)
const out = (c: number) => c / 100
const ach = (actual: number, ol: number) => (ol === 0 ? null : Math.round((actual / ol) * 10000) / 100)

export const lastDayOf = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`

export function calculate(input: CalcInput): Omit<OutlookCalc, 'rekon'> {
	const { weeks } = input
	const W = weeks.length
	const zero = (): Internal => ({
		ol_week: Array(W).fill(0),
		actual_day: weeks.map(() => Array(7).fill(0)),
		actual_week: Array(W).fill(0),
		ol_total: 0,
		actual_total: 0
	})
	const finish = (a: Internal) => {
		a.actual_week = a.actual_day.map((d, w) => d.reduce((s, v, i) => s + (weeks[w].slots[i] ? v : 0), 0))
		a.ol_total = a.ol_week.reduce((s, v) => s + v, 0)
		a.actual_total = a.actual_week.reduce((s, v) => s + v, 0)
	}
	const add = (into: Internal, from: Internal, sign = 1) => {
		from.ol_week.forEach((v, w) => (into.ol_week[w] += sign * v))
		from.actual_day.forEach((d, w) => d.forEach((v, i) => (into.actual_day[w][i] += sign * v)))
		from.actual_week.forEach((v, w) => (into.actual_week[w] += sign * v))
		into.ol_total += sign * from.ol_total
		into.actual_total += sign * from.actual_total
	}

	const byId = new Map(input.categories.map((c) => [c.id, c]))
	const kids = new Map<number, number[]>()
	for (const c of input.categories) {
		const p = c.parent_id ?? 0
		kids.set(p, [...(kids.get(p) ?? []), c.id])
	}
	for (const [p, ids] of kids) kids.set(p, ids.sort((a, b) => byId.get(a)!.sort_order - byId.get(b)!.sort_order || a - b))

	const rows = new Map<number, { cat: CalcCategory; leaf: boolean; agg: Internal }>()
	const order: number[] = []
	const walk = (id: number) => {
		const cat = byId.get(id)!
		const children = kids.get(id) ?? []
		const agg = zero()
		order.push(id)
		if (!children.length) {
			for (const [wn, amt] of Object.entries(input.ol[id] ?? {})) {
				const w = weeks.findIndex((x) => x.week_no === Number(wn))
				if (w >= 0) agg.ol_week[w] += cents(amt)
			}
			for (const [wn, bySlot] of Object.entries(input.actual[id] ?? {})) {
				const w = weeks.findIndex((x) => x.week_no === Number(wn))
				if (w >= 0) for (const [slot, amt] of Object.entries(bySlot)) agg.actual_day[w][Number(slot)] += cents(amt)
			}
		} else {
			for (const k of children) {
				walk(k)
				add(agg, rows.get(k)!.agg)
			}
		}
		finish(agg)
		rows.set(id, { cat, leaf: !children.length, agg })
	}
	for (const flow of ['CASH_IN', 'CASH_OUT'] as Flow[]) for (const r of kids.get(0) ?? []) if (byId.get(r)!.flow_type === flow) walk(r)

	const flowTotal = (flow: Flow) => {
		const t = zero()
		for (const { cat, agg } of rows.values()) if (cat.parent_id === null && cat.flow_type === flow) add(t, agg)
		return t
	}
	const tin = flowTotal('CASH_IN')
	const tout = flowTotal('CASH_OUT')
	const surplus = zero()
	add(surplus, tin)
	add(surplus, tout, -1)

	// Running balance, in column order; empty columns add nothing.
	const base = input.saldo_awal_bank == null ? 0 : cents(input.saldo_awal_bank)
	let run = base
	let olRun = base
	const saldoDay: (number | null)[][] = []
	const saldoWeek: number[] = []
	const saldoOlWeek: number[] = []
	const awalOl: number[] = []
	const awalActual: number[] = []
	const awalDay: (number | null)[][] = []
	weeks.forEach((w, wi) => {
		awalOl.push(olRun)
		awalActual.push(run)
		saldoDay.push(Array(7).fill(null))
		awalDay.push(Array(7).fill(null))
		w.slots.forEach((d, i) => {
			if (!d) return
			awalDay[wi][i] = run
			run += surplus.actual_day[wi][i]
			saldoDay[wi][i] = run
		})
		saldoWeek.push(run)
		olRun += surplus.ol_week[wi]
		saldoOlWeek.push(olRun)
	})

	const dayOut = (a: Internal) => a.actual_day.map((d, w) => d.map((v, i) => (weeks[w].slots[i] ? out(v) : null)))
	const toAgg = (a: Internal): Agg => ({
		ol_week: a.ol_week.map(out),
		actual_week: a.actual_week.map(out),
		ach_week: a.ol_week.map((o, w) => ach(a.actual_week[w], o)),
		actual_day: dayOut(a),
		ol_total: out(a.ol_total),
		actual_total: out(a.actual_total),
		ach_total: ach(a.actual_total, a.ol_total)
	})
	const toResume = (a: Internal): ResumeAgg => {
		let t = 0
		let x = 0
		const r: ResumeAgg = { target_mtd: [], actual_mtd: [], ach_mtd: [], ol_week: [], actual_week: [], ach_week: [] }
		a.ol_week.forEach((o, w) => {
			t += o
			x += a.actual_week[w]
			r.target_mtd.push(out(t))
			r.actual_mtd.push(out(x))
			r.ach_mtd.push(ach(x, t))
			r.ol_week.push(out(o))
			r.actual_week.push(out(a.actual_week[w]))
			r.ach_week.push(ach(a.actual_week[w], o))
		})
		return r
	}
	const identity = (id: number) => {
		const { cat, leaf } = rows.get(id)!
		return { id, parent_id: cat.parent_id, flow_type: cat.flow_type, name: cat.name, depth: cat.depth, is_leaf: leaf }
	}

	return {
		rows: order.map((id): OutlookRow => ({ ...identity(id), ...toAgg(rows.get(id)!.agg) })),
		totals: { CASH_IN: toAgg(tin), CASH_OUT: toAgg(tout), SURPLUS: toAgg(surplus) },
		saldo_awal_set: input.saldo_awal_bank != null,
		saldo_awal_row: {
			total: out(base),
			ol_week: awalOl.map(out),
			actual_week: awalActual.map(out),
			actual_day: awalDay.map((d) => d.map((v) => (v == null ? null : out(v))))
		},
		saldo_day: saldoDay.map((d) => d.map((v) => (v == null ? null : out(v)))),
		saldo_week: saldoWeek.map(out),
		saldo_ol_week: saldoOlWeek.map(out),
		saldo_akhir: out(run),
		saldo_akhir_date: lastDayOf(input.year, input.month),
		resume: {
			rows: order.map((id) => ({ ...identity(id), ...toResume(rows.get(id)!.agg) })),
			totals: { CASH_IN: toResume(tin), CASH_OUT: toResume(tout), SURPLUS: toResume(surplus) },
			saldo: saldoWeek.map(out),
			saldo_awal: {
				monthly: out(base),
				weeks: weeks.map((_, w) => ({
					target_mtd: out(awalOl[w]),
					actual_mtd: out(awalActual[w]),
					ol_week: out(awalOl[w]),
					actual_week: out(awalActual[w])
				}))
			}
		}
	}
}
