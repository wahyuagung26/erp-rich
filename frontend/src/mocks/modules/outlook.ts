import type MockAdapter from 'axios-mock-adapter'
import type { AxiosRequestConfig } from 'axios'
import { db } from '../db'
import { companyIdOf } from '../lib'
import { calculate, lastDayOf, type CalcCategory } from '../outlook-calc'
import { emptyWeeks, outlookSeed, type LampiranRecord, type OutlookPeriodRow, type OutlookStore } from '../fixtures/outlook'
import { cashBankBalance } from './cash-position'
import { closedReply, isPeriodClosed } from './posting'
import {
	EDGE_DAYS,
	LAMPIRAN_MAX_ROWS,
	LAMPIRAN_MAX_TEXT,
	MAX_ABS,
	MAX_DEPTH,
	MAX_NAME,
	MONTHS,
	RANGE_FIRST_SLOT,
	RANGE_MAX_DAYS,
	RANGE_WEEK,
	type Flow,
	type LampiranRow,
	type OutlookStateEmpty,
	type OutlookStateFull,
	type Rekon,
	type SumberDana
} from '@/views/outlook/types'

type Reply = [number, unknown]

const pad = (n: number) => String(n).padStart(2, '0')
const firstOf = (year: number, month: number) => `${year}-${pad(month)}-01`
const label = (year: number, month: number) => `${MONTHS[month - 1]} ${year}`
const round2 = (n: number) => Math.round(n * 100) / 100
const fail = (message: string, errors?: Record<string, string[]>): Reply => [422, errors ? { message, errors } : { message }]
const notFound = (what: string): Reply => [404, { message: `${what} tidak ditemukan` }]

const isDate = (v: unknown): v is string =>
	typeof v === 'string' &&
	/^\d{4}-\d{2}-\d{2}$/.test(v) &&
	!Number.isNaN(Date.parse(`${v}T12:00:00`)) &&
	new Date(`${v}T12:00:00`).toISOString().slice(0, 10) === v
const addDays = (date: string, n: number) => {
	const t = new Date(`${date}T12:00:00`)
	t.setDate(t.getDate() + n)
	return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86_400_000)
const cleanText = (v: unknown) =>
	String(v ?? '')
		.replace(/\s+/g, ' ')
		.trim()

// null/''/0 → 0 (delete); a number or numeric string within ±MAX_ABS → rounded; anything else → 'invalid'.
function parseAmount(v: unknown): number | 'invalid' {
	if (v === null || v === undefined || v === '' || v === false) return 0
	const n = typeof v === 'number' ? v : Number(String(v).trim())
	return Number.isFinite(n) && Math.abs(n) <= MAX_ABS ? round2(n) : 'invalid'
}

// Contract: docs/outlook/
function storeOf(companyId: number | null): OutlookStore {
	const key = companyId ?? 0
	if (db.outlook[key]) return db.outlook[key]
	const store = (db.outlook[key] = outlookSeed())
	// Jul 2026 is the locked demo month: align its opening balance so the balance check reads "Balance" against the cash/bank ledger.
	const jul = store.periods.find((p) => p.year === 2026 && p.month === 7)
	if (jul && companyId !== null) {
		const without = calc(jul).saldo_akhir
		jul.saldo_awal_bank = round2(cashBankBalance(companyId, lastDayOf(2026, 7)) - without)
	}
	return store
}

const calc = (p: OutlookPeriodRow) =>
	calculate({
		saldo_awal_bank: p.saldo_awal_bank,
		year: p.year,
		month: p.month,
		weeks: p.weeks,
		categories: p.categories,
		ol: p.ol,
		actual: p.actual
	})

function rekonOf(companyId: number | null, outlook: number, date: string, set: boolean): Rekon {
	const bank = companyId === null ? null : round2(cashBankBalance(companyId, date))
	if (bank === null) return { date, status: 'tidak_tersedia', outlook, bank, selisih: null }
	if (!set) return { date, status: 'belum_diisi', outlook, bank, selisih: null }
	const selisih = round2(outlook - bank)
	return { date, status: Math.round(selisih * 100) === 0 ? 'balance' : 'tidak_balance', outlook, bank, selisih }
}

function lampiranOf(p: OutlookPeriodRow) {
	const rows: LampiranRow[] = p.lampiran.map((r) => ({
		...r,
		hari: { ...r.hari },
		total: round2(Object.values(r.hari).reduce((s, v) => s + v, 0))
	}))
	// Vertical totals = Cash In − Cash Out.
	const day_totals: Record<number, number> = {}
	let total = 0
	for (const r of rows) {
		const sign = r.sumber_dana === 'CASH_OUT' ? -1 : 1
		for (const [d, v] of Object.entries(r.hari)) day_totals[Number(d)] = round2((day_totals[Number(d)] ?? 0) + sign * v)
		total = round2(total + sign * r.total)
	}
	return { rows, count: rows.length, max: LAMPIRAN_MAX_ROWS, day_totals, total }
}

function stateOf(companyId: number | null, p: OutlookPeriodRow): OutlookStateFull {
	const c = calc(p)
	return {
		exists: true,
		can_edit: true,
		period: {
			id: p.id,
			year: p.year,
			month: p.month,
			locked: isPeriodClosed(companyId, firstOf(p.year, p.month)),
			saldo_awal_bank: p.saldo_awal_bank
		},
		weeks: p.weeks.map((w) => {
			const dated = [...w.slots, ...w.ends].filter((d): d is string => !!d).sort()
			return {
				week_no: w.week_no,
				start_date: dated[0] ?? null,
				end_date: dated[dated.length - 1] ?? null,
				slots: [...w.slots],
				ends: [...w.ends]
			}
		}),
		calc: { ...c, rekon: rekonOf(companyId, c.saldo_akhir, c.saldo_akhir_date, c.saldo_awal_set) },
		lampiran: lampiranOf(p)
	}
}

const bodyOf = (config: AxiosRequestConfig) => {
	try {
		return JSON.parse(config.data ?? '{}') as Record<string, unknown>
	} catch {
		return {}
	}
}

// Shared prelude of every period write: company, period, closing lock. `fn` returns the reply; success replies carry the fresh state.
function write(
	config: AxiosRequestConfig,
	periodId: number,
	fn: (p: OutlookPeriodRow, body: Record<string, unknown>) => { status?: number; message: string; result?: unknown } | Reply
): Reply {
	const companyId = companyIdOf(config)
	if (companyId === null) return fail('Pilih perusahaan aktif terlebih dahulu')
	const p = storeOf(companyId).periods.find((x) => x.id === periodId)
	if (!p) return notFound('Periode')
	const locked = closedReply(config, firstOf(p.year, p.month), 'Outlook tidak bisa diubah')
	if (locked) return locked
	const r = fn(p, bodyOf(config))
	if (Array.isArray(r)) return r
	return [r.status ?? 200, { data: { state: stateOf(companyId, p), ...(r.result !== undefined ? { result: r.result } : {}) }, message: r.message }]
}

const cleanName = (v: unknown) => {
	const n = cleanText(v)
	return n && n.length <= MAX_NAME ? n : null
}

function findCategory(p: OutlookPeriodRow, id: number) {
	return p.categories.find((c) => c.id === id)
}
function descendants(p: OutlookPeriodRow, id: number): number[] {
	const ids = [id]
	for (let i = 0; i < ids.length; i++) for (const c of p.categories) if (c.parent_id === ids[i]) ids.push(c.id)
	return ids
}
const countEntries = (p: OutlookPeriodRow, ids: number[]) => {
	let ol = 0
	let actual = 0
	for (const id of ids) {
		ol += Object.keys(p.ol[id] ?? {}).length
		for (const bySlot of Object.values(p.actual[id] ?? {})) actual += Object.keys(bySlot).length
	}
	return { ol, actual }
}
function dropValues(p: OutlookPeriodRow, ids: number[]) {
	for (const id of ids) {
		delete p.ol[id]
		delete p.actual[id]
	}
}

function lampiranFields(p: OutlookPeriodRow, body: Record<string, unknown>) {
	const errors: Record<string, string[]> = {}
	const keterangan = cleanText(body.keterangan)
	if (!keterangan || keterangan.length > LAMPIRAN_MAX_TEXT) errors.keterangan = [`Keterangan wajib diisi, maksimal ${LAMPIRAN_MAX_TEXT} karakter`]
	const sumber = String(body.sumber_dana ?? '').toUpperCase()
	if (sumber !== 'CASH_IN' && sumber !== 'CASH_OUT') errors.sumber_dana = ['Sumber Dana wajib dipilih: Cash In atau Cash Out']
	const len = new Date(p.year, p.month, 0).getDate()
	const hari: Record<number, number> = {}
	const dayErrors: string[] = []
	const raw = body.hari && typeof body.hari === 'object' ? (body.hari as Record<string, unknown>) : {}
	for (const [d, v] of Object.entries(raw)) {
		if (!/^\d+$/.test(d) || Number(d) < 1 || Number(d) > len) {
			dayErrors.push(`Tanggal ${d} di luar bulan periode`)
			continue
		}
		const n = parseAmount(v)
		if (n === 'invalid') dayErrors.push(`Nominal tanggal ${Number(d)} harus berupa angka yang valid`)
		else if (n !== 0) hari[Number(d)] = n
	}
	if (dayErrors.length) errors.hari = dayErrors
	if (Object.keys(errors).length) return { error: fail('Data Lampiran tidak valid', errors) }
	return { value: { keterangan, sumber_dana: sumber as SumberDana, hari } }
}

export function registerOutlook(mock: MockAdapter) {
	mock.onGet('/outlook/state').reply((config) => {
		const year = Number(config.params?.year)
		const month = Number(config.params?.month)
		if (!Number.isInteger(year) || year < 2000 || year > 2100) return fail('Validasi gagal', { year: ['Tahun harus antara 2000 dan 2100'] })
		if (!Number.isInteger(month) || month < 1 || month > 12) return fail('Validasi gagal', { month: ['Bulan tidak valid'] })
		const companyId = companyIdOf(config)
		const p = companyId === null ? undefined : storeOf(companyId).periods.find((x) => x.year === year && x.month === month)
		if (p) return [200, { data: stateOf(companyId, p) }]
		const empty: OutlookStateEmpty = { exists: false, can_edit: true, year, month, locked: isPeriodClosed(companyId, firstOf(year, month)) }
		return [200, { data: empty }]
	})

	mock.onPost('/outlook/periods').reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return fail('Pilih perusahaan aktif terlebih dahulu')
		const { year, month } = bodyOf(config) as { year?: number; month?: number }
		if (!Number.isInteger(year) || year! < 2000 || year! > 2100 || !Number.isInteger(month) || month! < 1 || month! > 12)
			return fail('Tahun/bulan tidak valid')
		const closed = closedReply(config, firstOf(year!, month!), 'periode Outlook tidak bisa dibuat')
		if (closed) return closed
		const store = storeOf(companyId)
		if (store.periods.some((p) => p.year === year && p.month === month)) return [409, { message: `Periode ${label(year!, month!)} sudah tersedia` }]
		const p: OutlookPeriodRow = {
			id: store.nextId++,
			year: year!,
			month: month!,
			saldo_awal_bank: null,
			weeks: emptyWeeks(),
			categories: [],
			ol: {},
			actual: {},
			lampiran: [],
			seq: { category: 0, lampiran: 0 }
		}
		store.periods.push(p)
		return [201, { data: { state: stateOf(companyId, p) }, message: 'Periode dibuat' }]
	})

	mock.onPost(/^\/outlook\/periods\/\d+\/duplicate$/).reply((config) => {
		const companyId = companyIdOf(config)
		if (companyId === null) return fail('Pilih perusahaan aktif terlebih dahulu')
		const store = storeOf(companyId)
		const source = store.periods.find((p) => p.id === Number(config.url!.split('/')[3]))
		if (!source) return notFound('Periode sumber')
		const { target_year: ty, target_month: tm, replace } = bodyOf(config) as { target_year?: number; target_month?: number; replace?: boolean }
		if (!Number.isInteger(ty) || ty! < 2000 || ty! > 2100 || !Number.isInteger(tm) || tm! < 1 || tm! > 12)
			return fail('Tahun/bulan tujuan tidak valid')
		if (ty === source.year && tm === source.month) return [409, { message: 'Periode tujuan sama dengan periode sumber' }]
		const closed = closedReply(config, firstOf(ty!, tm!), 'periode Outlook tidak bisa dibuat atau diganti')
		if (closed) return closed

		let target = store.periods.find((p) => p.year === ty && p.month === tm)
		let replaced: { categories: number; ol: number; actual: number } | null = null
		if (target) {
			const ids = target.categories.map((c) => c.id)
			const n = countEntries(target, ids)
			if (!replace)
				return [
					409,
					{
						message: `Periode ${label(ty!, tm!)} sudah tersedia`,
						data: { exists: true, period_id: target.id, year: ty, month: tm, categories: ids.length, ol_rows: n.ol, actual_rows: n.actual }
					}
				]
			replaced = { categories: ids.length, ol: n.ol, actual: n.actual }
			target.categories = []
			target.ol = {}
			target.actual = {}
		} else {
			target = {
				id: store.nextId++,
				year: ty!,
				month: tm!,
				saldo_awal_bank: null,
				weeks: emptyWeeks(),
				categories: [],
				ol: {},
				actual: {},
				lampiran: [],
				seq: { category: 0, lampiran: 0 }
			}
			store.periods.push(target)
		}
		const map = new Map<number, number>()
		for (const c of [...source.categories].sort((a, b) => a.depth - b.depth || a.id - b.id)) {
			const id = ++target.seq.category + target.id * 1000
			map.set(c.id, id)
			target.categories.push({ ...c, id, parent_id: c.parent_id === null ? null : map.get(c.parent_id)! })
		}
		return [
			replaced ? 200 : 201,
			{
				data: { state: stateOf(companyId, target), result: { year: ty, month: tm, replaced } },
				message: replaced ? 'Template periode diganti' : 'Periode diduplikasi'
			}
		]
	})

	mock.onPut(/^\/outlook\/periods\/\d+\/columns\/\d+\/\d+$/).reply((config) => {
		const [, , , id, , weekNo, slotNo] = config.url!.split('/')
		return write(config, Number(id), (p, body) => {
			const week = p.weeks.find((w) => w.week_no === Number(weekNo))
			if (!week) return notFound('Minggu')
			const slot = Number(slotNo)
			if (!Number.isInteger(slot) || slot < 1 || slot > 7) return fail('Kolom tidak valid', { slot: ['Kolom harus 1 sampai 7'] })
			const i = slot - 1
			const start = cleanText(body.start)
			const end = cleanText(body.end)
			const min = addDays(firstOf(p.year, p.month), -EDGE_DAYS)
			const max = addDays(lastDayOf(p.year, p.month), EDGE_DAYS)
			const bound = `Tanggal harus antara ${min} dan ${max} (bulan periode dan ${EDGE_DAYS} hari sebelum/sesudahnya)`

			if (!start) {
				if (!week.slots[i]) return { message: 'Tanggal tidak berubah' }
				let removed = 0
				for (const bySlot of Object.values(p.actual)) {
					const cells = bySlot[week.week_no]
					if (cells && cells[i] !== undefined) {
						delete cells[i]
						removed++
					}
				}
				week.slots[i] = null
				week.ends[i] = null
				return { message: 'Tanggal dikosongkan', result: { removed_actual: removed } }
			}
			if (!isDate(start)) return fail('Tanggal tidak valid', { start: ['Tanggal tidak valid (format YYYY-MM-DD)'] })
			if (start < min || start > max) return fail('Tanggal tidak valid', { start: [bound] })
			let last: string | null = null
			if (end && end !== start) {
				if (week.week_no !== RANGE_WEEK || slot < RANGE_FIRST_SLOT)
					return fail('Rentang hanya untuk kolom 5-7 minggu 5', { end: ['Kolom ini hanya bisa satu tanggal'] })
				if (!isDate(end)) return fail('Tanggal akhir tidak valid', { end: ['Tanggal tidak valid (format YYYY-MM-DD)'] })
				if (end < start) return fail('Tanggal akhir tidak boleh sebelum tanggal mulai', { end: ['Tanggal akhir sebelum tanggal mulai'] })
				if (end < min || end > max) return fail('Tanggal tidak valid', { end: [bound] })
				if (daysBetween(start, end) + 1 > RANGE_MAX_DAYS)
					return fail(`Rentang maksimal ${RANGE_MAX_DAYS} hari`, { end: [`Rentang melebihi ${RANGE_MAX_DAYS} hari`] })
				last = end
			}
			const was = week.slots[i] === start && week.ends[i] === last
			week.slots[i] = start
			week.ends[i] = last
			if (was) return { message: 'Tanggal tidak berubah' }
			return { message: last ? 'Rentang tanggal diperbarui' : 'Tanggal kolom diperbarui', result: { removed_actual: 0 } }
		})
	})

	mock.onPut(/^\/outlook\/periods\/\d+\/opening-balance$/).reply((config) =>
		write(config, Number(config.url!.split('/')[3]), (p, body) => {
			const raw = body.amount
			if (raw === null || raw === undefined || (typeof raw === 'string' && raw.trim() === '')) p.saldo_awal_bank = null
			else {
				const n = parseAmount(raw)
				if (n === 'invalid') return fail('Saldo awal bank tidak valid', { amount: ['Isi dengan angka'] })
				p.saldo_awal_bank = n
			}
			return { message: 'Saldo awal disimpan' }
		})
	)

	mock.onPost(/^\/outlook\/periods\/\d+\/categories$/).reply((config) =>
		write(config, Number(config.url!.split('/')[3]), (p, body) => {
			const name = cleanName(body.name)
			if (!name) return fail('Nama kategori wajib diisi', { name: [`Nama kategori wajib diisi (maksimal ${MAX_NAME} karakter)`] })
			let flow = body.flow_type as Flow
			let parent: CalcCategory | undefined
			let depth = 1
			const reset = { ol: 0, actual: 0 }
			if (body.parent_id === undefined || body.parent_id === null || body.parent_id === '' || Number(body.parent_id) === 0) {
				if (flow !== 'CASH_IN' && flow !== 'CASH_OUT') return fail('Jenis arus kas tidak valid', { flow_type: ['Pilih Cash In atau Cash Out'] })
			} else {
				parent = findCategory(p, Number(body.parent_id))
				if (!parent) return notFound('Kategori induk')
				depth = parent.depth + 1
				if (depth > MAX_DEPTH) return fail(`Kategori maksimal ${MAX_DEPTH} level`, { parent_id: ['Level 4 tidak diperbolehkan'] })
				flow = parent.flow_type
				if (!p.categories.some((c) => c.parent_id === parent!.id)) Object.assign(reset, countEntries(p, [parent.id]), dropValues(p, [parent.id]))
			}
			const siblings = p.categories.filter((c) => (parent ? c.parent_id === parent.id : c.parent_id === null && c.flow_type === flow))
			const id = p.id * 1000 + ++p.seq.category
			p.categories.push({
				id,
				parent_id: parent?.id ?? null,
				flow_type: flow,
				name,
				sort_order: Math.max(0, ...siblings.map((c) => c.sort_order)) + 1,
				depth
			})
			return { status: 201, message: 'Kategori ditambahkan', result: { category_id: id, reset } }
		})
	)

	mock.onPut(/^\/outlook\/periods\/\d+\/categories\/\d+$/).reply((config) => {
		const [, , , id, , cid] = config.url!.split('/')
		return write(config, Number(id), (p, body) => {
			const name = cleanName(body.name)
			if (!name) return fail('Nama kategori wajib diisi', { name: [`Nama kategori wajib diisi (maksimal ${MAX_NAME} karakter)`] })
			const c = findCategory(p, Number(cid))
			if (!c) return notFound('Kategori')
			c.name = name
			return { message: 'Kategori diubah' }
		})
	})

	mock.onDelete(/^\/outlook\/periods\/\d+\/categories\/\d+$/).reply((config) => {
		const [, , , id, , cid] = config.url!.split('/')
		return write(config, Number(id), (p) => {
			if (!findCategory(p, Number(cid))) return notFound('Kategori')
			const ids = descendants(p, Number(cid))
			dropValues(p, ids)
			p.categories = p.categories.filter((c) => !ids.includes(c.id))
			return { message: 'Kategori dihapus' }
		})
	})

	mock.onPut(/^\/outlook\/periods\/\d+\/entries$/).reply((config) =>
		write(config, Number(config.url!.split('/')[3]), (p, body) => {
			const { kind } = body
			if (kind !== 'ol' && kind !== 'actual') return fail('Jenis nilai tidak valid')
			const amount = parseAmount(body.amount)
			if (amount === 'invalid') return fail('Nominal tidak valid', { amount: ['Isi dengan angka (maksimal 9.999.999.999.999,99)'] })
			const cat = findCategory(p, Number(body.category_id))
			if (!cat) return notFound('Kategori')
			if (p.categories.some((c) => c.parent_id === cat.id))
				return fail('Kategori ini memiliki sub kategori; OL/actual hanya bisa diisi pada kategori paling bawah')
			const week = p.weeks.find((w) => w.week_no === Number(body.week_no))
			if (!week) return fail('Minggu tidak ditemukan')
			if (kind === 'ol') {
				const cells = (p.ol[cat.id] ??= {})
				if (amount === 0) delete cells[week.week_no]
				else cells[week.week_no] = amount
				return { message: 'Tersimpan' }
			}
			const slot = Number(body.slot)
			if (!Number.isInteger(slot) || slot < 1 || slot > 7) return fail('Kolom tidak valid', { slot: ['Kolom harus 1 sampai 7'] })
			if (!week.slots[slot - 1]) return fail(`Kolom ${slot} minggu ${week.week_no} belum bertanggal. Isi tanggal kolomnya lebih dulu`)
			const cells = ((p.actual[cat.id] ??= {})[week.week_no] ??= {})
			if (amount === 0) delete cells[slot - 1]
			else cells[slot - 1] = amount
			return { message: 'Tersimpan' }
		})
	)

	mock.onPost(/^\/outlook\/periods\/\d+\/lampiran$/).reply((config) =>
		write(config, Number(config.url!.split('/')[3]), (p, body) => {
			const f = lampiranFields(p, body)
			if (f.error) return f.error
			if (p.lampiran.length >= LAMPIRAN_MAX_ROWS) return fail(`Lampiran periode ini sudah mencapai batas ${LAMPIRAN_MAX_ROWS} baris`)
			const row: LampiranRecord = { id: ++p.seq.lampiran, ...f.value! }
			p.lampiran.push(row)
			return { status: 201, message: 'Lampiran ditambahkan', result: { id: row.id } }
		})
	)

	mock.onPut(/^\/outlook\/periods\/\d+\/lampiran\/\d+$/).reply((config) => {
		const [, , , id, , lid] = config.url!.split('/')
		return write(config, Number(id), (p, body) => {
			const row = p.lampiran.find((r) => r.id === Number(lid))
			if (!row) return notFound('Baris Lampiran pada periode ini')
			const f = lampiranFields(p, body)
			if (f.error) return f.error
			Object.assign(row, f.value)
			return { message: 'Lampiran disimpan' }
		})
	})

	mock.onDelete(/^\/outlook\/periods\/\d+\/lampiran\/\d+$/).reply((config) => {
		const [, , , id, , lid] = config.url!.split('/')
		return write(config, Number(id), (p) => {
			if (!p.lampiran.some((r) => r.id === Number(lid))) return notFound('Baris Lampiran pada periode ini')
			p.lampiran = p.lampiran.filter((r) => r.id !== Number(lid))
			return { message: 'Lampiran dihapus' }
		})
	})
}
