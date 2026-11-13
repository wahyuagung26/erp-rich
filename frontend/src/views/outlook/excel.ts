import { dmy } from './grid'
import { MONTHS, type Agg, type Flow, type OutlookStateFull, type ResumeAgg } from './types'

type Cell = string | number | { value: number; format: string }

// Snapshot of calculated values (Daily + Resume Weekly + Lampiran) — no formulas (decision OD-08). Built in the browser for the prototype.
const ach = (v: number | null): Cell => (v == null ? '-' : { value: v / 100, format: '0.0%' })
const slotLabel = (d: string | null) => (d ? dmy(d) : '')

export async function exportOutlook(state: OutlookStateFull, company: string) {
	const writer = await import('write-excel-file/browser')
	const { period, weeks, calc, lampiran } = state
	const title = `Outlook Daily - ${company} - ${MONTHS[period.month - 1]} ${period.year}`

	// ---- Daily
	const dayHead = weeks.flatMap((w) => [
		`M${w.week_no} OL`,
		`M${w.week_no} Actual`,
		`M${w.week_no} % Ach`,
		...w.slots.map((d, i) => `M${w.week_no} ${slotLabel(d) || `kolom ${i + 1}`}`)
	])
	const dailyAgg = (label: string, a: Agg, flow: Flow | null): Cell[] => [
		label,
		a.ol_total,
		a.actual_total,
		...weeks.flatMap((w, wi) => [
			a.ol_week[wi],
			a.actual_week[wi],
			flow ? ach(a.ach_week[wi]) : '',
			...a.actual_day[wi].map((v, i) => (w.slots[i] ? (v ?? 0) : ''))
		])
	]
	const daily: Cell[][] = [
		[title],
		[],
		['Kategori', 'Total OL (1 bulan)', 'Total Actual (1 bulan)', ...dayHead],
		[
			'Saldo Awal',
			period.saldo_awal_bank ?? '',
			calc.saldo_awal_row.total,
			...weeks.flatMap((w, wi) => [
				calc.saldo_awal_row.ol_week[wi],
				calc.saldo_awal_row.actual_week[wi],
				'',
				...calc.saldo_awal_row.actual_day[wi].map((v, i) => (w.slots[i] ? (v ?? 0) : ''))
			])
		]
	]
	for (const [flow, label] of [
		['CASH_IN', 'CASH IN'],
		['CASH_OUT', 'CASH OUT']
	] as const) {
		daily.push([label])
		for (const r of calc.rows.filter((x) => x.flow_type === flow)) daily.push(dailyAgg(`${'    '.repeat(r.depth - 1)}${r.name}`, r, flow))
	}
	daily.push(
		dailyAgg('Total Cash In', calc.totals.CASH_IN, 'CASH_IN'),
		dailyAgg('Total Cash Out', calc.totals.CASH_OUT, 'CASH_OUT'),
		dailyAgg('Surplus (Defisit)', calc.totals.SURPLUS, null)
	)
	daily.push([
		'Saldo Balance',
		'',
		calc.saldo_akhir,
		...weeks.flatMap((w, wi) => [calc.saldo_ol_week[wi], calc.saldo_week[wi], '', ...calc.saldo_day[wi].map((v, i) => (w.slots[i] ? (v ?? 0) : ''))])
	])

	// ---- Resume Weekly
	const rs = calc.resume
	const last = weeks.length - 1
	const resumeAgg = (label: string, a: ResumeAgg, flow: Flow | null): Cell[] => [
		label,
		a.target_mtd[last],
		...weeks.flatMap((_, wi) => [
			a.target_mtd[wi],
			a.actual_mtd[wi],
			flow ? ach(a.ach_mtd[wi]) : '',
			a.ol_week[wi],
			a.actual_week[wi],
			flow ? ach(a.ach_week[wi]) : ''
		])
	]
	const resume: Cell[][] = [
		[title],
		[],
		[
			'Kategori',
			'OL Monthly (1 bulan)',
			...weeks.flatMap((w) =>
				['Bulan Berjalan Target', 'Bulan Berjalan Actual', 'Bulan Berjalan % Ach', 'Mingguan OL', 'Mingguan Actual', 'Mingguan % Ach'].map(
					(h) => `M${w.week_no} ${h}`
				)
			)
		],
		['Saldo Awal', rs.saldo_awal.monthly, ...rs.saldo_awal.weeks.flatMap((x) => [x.target_mtd, x.actual_mtd, '', x.ol_week, x.actual_week, ''])]
	]
	for (const [flow, label] of [
		['CASH_IN', 'CASH IN'],
		['CASH_OUT', 'CASH OUT']
	] as const) {
		resume.push([label])
		for (const r of rs.rows.filter((x) => x.flow_type === flow)) resume.push(resumeAgg(`${'    '.repeat(r.depth - 1)}${r.name}`, r, flow))
	}
	resume.push(
		resumeAgg('Total Cash In', rs.totals.CASH_IN, 'CASH_IN'),
		resumeAgg('Total Cash Out', rs.totals.CASH_OUT, 'CASH_OUT'),
		resumeAgg('Surplus (Defisit)', rs.totals.SURPLUS, null)
	)
	resume.push(['Saldo Balance', '', ...rs.saldo.flatMap((v) => ['', v, '', '', v, ''])])

	// ---- Lampiran
	const nd = new Date(period.year, period.month, 0).getDate()
	const days = Array.from({ length: nd }, (_, i) => i + 1)
	const src = { CASH_IN: 'Cash In', CASH_OUT: 'Cash Out' }
	const lamp: Cell[][] = [
		[title],
		[],
		['No', 'Keterangan Pengeluaran (Unbudget)', 'Sumber Dana', ...days, 'Total'],
		...lampiran.rows.map((r, i): Cell[] => [i + 1, r.keterangan, src[r.sumber_dana], ...days.map((d) => r.hari[d] ?? ''), r.total]),
		['', 'Total (Cash In - Cash Out)', '', ...days.map((d) => lampiran.day_totals[d] ?? ''), lampiran.total]
	]

	await writer
		.default([
			{ sheet: 'Daily', data: daily },
			{ sheet: 'Resume Weekly', data: resume },
			{ sheet: 'Lampiran', data: lamp }
		])
		.toFile(`outlook-daily-${period.year}-${String(period.month).padStart(2, '0')}.xlsx`)
}
