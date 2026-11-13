import type { Day, Flow, SumberDana } from '@/views/outlook/types'
import type { CalcCategory } from '../outlook-calc'

export interface OutlookWeekRow {
	week_no: number
	slots: Day[]
	ends: Day[]
}
export interface LampiranRecord {
	id: number
	keterangan: string
	sumber_dana: SumberDana
	hari: Record<number, number>
}
export interface OutlookPeriodRow {
	id: number
	year: number
	month: number
	saldo_awal_bank: number | null
	weeks: OutlookWeekRow[]
	categories: CalcCategory[]
	ol: Record<number, Record<number, number>> // category → week_no → amount
	actual: Record<number, Record<number, Record<number, number>>> // category → week_no → slot(0-6) → amount
	lampiran: LampiranRecord[]
	seq: { category: number; lampiran: number }
}
export interface OutlookStore {
	periods: OutlookPeriodRow[]
	nextId: number
}

interface Node {
	name: string
	children?: Node[]
}
// Template shaped after the RAK workbook (Cash In 4 groups; Cash Out grouped by HPP / Operasional / Administrasi).
const TEMPLATE: Record<Flow, Node[]> = {
	CASH_IN: [
		{ name: 'Penjualan Produk' },
		{ name: 'Diskon & Retur Produk' },
		{ name: 'Pinjaman (Soft Loan) / Penerimaan Lain-lain' },
		{ name: 'Pendapatan Lainnya (Bunga Bank & Biaya Kirim)' }
	],
	CASH_OUT: [
		{
			name: 'HARGA POKOK PENJUALAN (HPP)',
			children: [
				{ name: 'HPP Produk (Atasan & Bawahan)', children: [{ name: 'Biaya Konveksi' }, { name: 'Pembelian Bahan Baku' }] },
				{ name: 'HPP Jasa / Projek / Lainnya' }
			]
		},
		{ name: 'BIAYA OPERASIONAL DAN PENJUALAN', children: [{ name: 'Biaya Pemasaran' }, { name: 'Biaya Operasional Lainnya' }] },
		{ name: 'BIAYA ADMINISTRASI UMUM', children: [{ name: 'Gaji, Bonus, Lembur & BPJS' }, { name: 'Pajak (PPh) & PPN' }] }
	]
}

// Builds a category list with sequential ids from `start`, depth and sort_order set.
function buildCategories(start: number): CalcCategory[] {
	const out: CalcCategory[] = []
	let id = start
	const add = (nodes: Node[], flow: Flow, parent: number | null, depth: number) =>
		nodes.forEach((n, i) => {
			const mine = id++
			out.push({ id: mine, parent_id: parent, flow_type: flow, name: n.name, sort_order: i + 1, depth })
			if (n.children) add(n.children, flow, mine, depth + 1)
		})
	add(TEMPLATE.CASH_IN, 'CASH_IN', null, 1)
	add(TEMPLATE.CASH_OUT, 'CASH_OUT', null, 1)
	return out
}

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (t: Date) => `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`

export const emptyWeeks = (): OutlookWeekRow[] =>
	Array.from({ length: 5 }, (_, i) => ({ week_no: i + 1, slots: Array(7).fill(null), ends: Array(7).fill(null) }))

// Monday-based 5 weeks; days outside the month stay empty (legacy default_slots).
function monthWeeks(year: number, month: number): OutlookWeekRow[] {
	const first = new Date(year, month - 1, 1, 12)
	const monday = new Date(first)
	monday.setDate(first.getDate() - ((first.getDay() + 6) % 7))
	return emptyWeeks().map((w, wi) => ({
		...w,
		slots: w.slots.map((_, i) => {
			const t = new Date(monday)
			t.setDate(monday.getDate() + wi * 7 + i)
			return t.getMonth() === month - 1 ? iso(t) : null
		})
	}))
}

function hash(...n: number[]) {
	return n.reduce((h, x) => (h * 31 + x * 17 + 7) % 997, 11)
}

// Typical weekly OL per leaf (Rp); anything not listed gets a small default.
const OL: Record<string, number> = {
	'Penjualan Produk': 220_000_000,
	'Diskon & Retur Produk': 8_000_000,
	'Pendapatan Lainnya (Bunga Bank & Biaya Kirim)': 6_000_000,
	'Biaya Konveksi': 60_000_000,
	'Pembelian Bahan Baku': 45_000_000,
	'HPP Jasa / Projek / Lainnya': 12_000_000,
	'Biaya Pemasaran': 18_000_000,
	'Biaya Operasional Lainnya': 14_000_000,
	'Gaji, Bonus, Lembur & BPJS': 46_000_000,
	'Pajak (PPh) & PPN': 20_000_000
}

function fill(p: OutlookPeriodRow, withActual: boolean, outFactor = 1) {
	const parents = new Set(p.categories.map((c) => c.parent_id))
	for (const c of p.categories) {
		if (parents.has(c.id)) continue
		const weekly = OL[c.name]
		if (!weekly) continue
		p.ol[c.id] = Object.fromEntries(p.weeks.map((w) => [w.week_no, weekly + (hash(c.id, w.week_no) % 5) * 1_000_000]))
		if (!withActual) continue
		p.actual[c.id] = {}
		for (const w of p.weeks) {
			const days: Record<number, number> = {}
			const work = w.slots.filter((d) => d && ![0, 6].includes(new Date(`${d}T12:00:00`).getDay())).length || 1
			w.slots.forEach((d, i) => {
				if (!d || [0, 6].includes(new Date(`${d}T12:00:00`).getDay())) return
				const f = 0.75 + (hash(c.id, w.week_no, i) % 55) / 100 // 75%–129% of an even split
				days[i] = Math.round(((weekly / work) * f * (c.flow_type === 'CASH_OUT' ? outFactor : 1)) / 1000) * 1000
			})
			p.actual[c.id][w.week_no] = days
		}
	}
}

function period(
	id: number,
	year: number,
	month: number,
	opts: { weeks?: OutlookWeekRow[]; saldo: number | null; actual: boolean; values: boolean; outFactor?: number }
): OutlookPeriodRow {
	const categories = buildCategories(id * 100)
	const p: OutlookPeriodRow = {
		id,
		year,
		month,
		saldo_awal_bank: opts.saldo,
		weeks: opts.weeks ?? emptyWeeks(),
		categories,
		ol: {},
		actual: {},
		lampiran: [],
		seq: { category: id * 100 + categories.length, lampiran: 0 }
	}
	if (opts.values) fill(p, opts.actual, opts.outFactor)
	return p
}

// Jul 2026 is closed in Posting (locked, read-only); Oct 2026 is a full month; Nov 2026 is a fresh period (structure only, columns still empty).
export const outlookSeed = (): OutlookStore => {
	const jul = period(1, 2026, 7, { weeks: monthWeeks(2026, 7), saldo: null, actual: true, values: true, outFactor: 1.3 }) // saldo awal is aligned to the cash/bank ledger by the mock
	const octWeeks = monthWeeks(2026, 10)
	octWeeks[4].slots[4] = '2026-10-30' // week 5 column 5 = a 2-day range 30–31 Oct
	octWeeks[4].ends[4] = '2026-10-31'
	octWeeks[4].slots[5] = null
	const oct = period(2, 2026, 10, { weeks: octWeeks, saldo: 480_000_000, actual: true, values: true })
	oct.lampiran = [
		{ id: 1, keterangan: 'Perbaikan mesin jahit (tidak dianggarkan)', sumber_dana: 'CASH_OUT', hari: { 8: 7_500_000 } },
		{ id: 2, keterangan: 'Pelunasan piutang lama', sumber_dana: 'CASH_IN', hari: { 15: 12_000_000, 22: 5_000_000 } }
	]
	oct.seq.lampiran = 2
	jul.lampiran = []
	const nov = period(3, 2026, 11, { saldo: null, actual: false, values: false })
	return { periods: [jul, oct, nov], nextId: 4 }
}
