import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { companyIdOf } from '../lib'
import { postingSeed, type PostingState } from '../fixtures/posting'
import type { Account, ClosingHistory, ClosingReconciliation, ClosingStatus, ReconCheck, ReopenHistory } from '@/utils/types'

const FIRST_PERIOD = '2026-06' // books start here, used as next_period when nothing is closed
// Demo only: an unexplained assets-side gap (e.g. a migrated opening balance) from Sep 2026 on,
// so the Neraca check has something to flag. Aug 2026 and earlier reconcile cleanly.
const GAP_FROM = '2026-09'
const GAP = 1_250_000

const isPeriod = (v: unknown) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v))
const currentPeriod = () => new Date().toISOString().slice(0, 7)

function addMonths(period: string, n: number): string {
	const [y, m] = period.split('-').map(Number)
	const d = new Date(Date.UTC(y, m - 1 + n, 1))
	return d.toISOString().slice(0, 7)
}

const monthLabel = (period: string) =>
	new Date(`${period}-01T00:00:00Z`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function currentUserName(): string {
	try {
		return JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin'
	} catch {
		return 'Admin'
	}
}

function stateOf(companyId: number | null): PostingState {
	const key = companyId ?? 0
	return (db.posting[key] ??= postingSeed())
}

type Entry = { date: string; account_id: number; debit: number; credit: number }

// Approved ledger entries across all journal types (cash side of Pemasukan/Pengeluaran included).
function approvedEntries(): Entry[] {
	const out: Entry[] = []
	for (const j of db.journal) {
		if (j.status === 'approved')
			for (const l of j.lines) out.push({ date: j.date, account_id: Number(l.account_id), debit: l.debit, credit: l.credit })
	}
	for (const j of db.journalExpense) {
		if (j.status !== 'approved') continue
		for (const l of j.lines) out.push({ date: j.date, account_id: Number(l.account_id), debit: l.debit, credit: l.credit })
		out.push({ date: j.date, account_id: j.cash_account_id, debit: 0, credit: j.cash_out })
	}
	for (const j of db.journalIncome) {
		if (j.status !== 'approved') continue
		for (const l of j.lines) out.push({ date: j.date, account_id: Number(l.account_id), debit: l.debit, credit: l.credit })
		out.push({ date: j.date, account_id: j.cash_account_id, debit: j.cash_in, credit: 0 })
	}
	return out
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)

function summaryOf(period: string) {
	const types = new Map<number, Account['type']>(db.account.map((a) => [a.id, a.type]))
	const rows = approvedEntries().filter((e) => e.date.slice(0, 7) === period)
	const profit = sum(rows.filter((e) => ['revenue', 'expense'].includes(types.get(e.account_id) ?? '')).map((e) => e.credit - e.debit))
	return { total_debit: sum(rows.map((e) => e.debit)), total_credit: sum(rows.map((e) => e.credit)), profit }
}

function reconcile(period: string, closedUntil: string | null): ClosingReconciliation {
	const types = new Map<number, Account['type']>(db.account.map((a) => [a.id, a.type]))
	const summary = summaryOf(period)

	// Neraca: cumulative up to period end.
	const upto = approvedEntries().filter((e) => e.date.slice(0, 7) <= period)
	const net = (kinds: Account['type'][], sign: 1 | -1) =>
		sum(upto.filter((e) => kinds.includes(types.get(e.account_id) as Account['type'])).map((e) => sign * (e.debit - e.credit)))
	const assets = net(['cash_bank', 'asset'], 1) + (period >= GAP_FROM ? GAP : 0)
	const liabilities = net(['liability'], -1)
	const equity = net(['equity'], -1)
	const retained = net(['revenue', 'expense'], -1)
	const bsDiff = assets - (liabilities + equity + retained)

	const pending = (rows: { date: string; status: string }[]) => rows.filter((r) => r.status === 'submitted' && r.date.slice(0, 7) === period).length
	const pendingRows = [
		{ label: 'Jurnal Umum', value: pending(db.journal) },
		{ label: 'Jurnal Pemasukan', value: pending(db.journalIncome) },
		{ label: 'Jurnal Pengeluaran', value: pending(db.journalExpense) }
	]
	const pendingTotal = sum(pendingRows.map((r) => r.value))

	const tbDiff = summary.total_debit - summary.total_credit
	const checks: ReconCheck[] = [
		{
			key: 'trial_balance',
			label: 'Trial Balance',
			status: tbDiff === 0 ? 'pass' : 'fail',
			unit: 'rupiah',
			rows: [
				{ label: 'Total Debit', value: summary.total_debit },
				{ label: 'Total Kredit', value: summary.total_credit }
			],
			difference: tbDiff
		},
		{
			key: 'balance_sheet',
			label: 'Neraca Seimbang',
			status: bsDiff === 0 ? 'pass' : 'fail',
			unit: 'rupiah',
			rows: [
				{ label: 'Aset', value: assets },
				{ label: 'Liabilitas', value: liabilities },
				{ label: 'Ekuitas', value: equity },
				{ label: 'Laba Berjalan', value: retained }
			],
			difference: bsDiff
		},
		{
			key: 'pending_journals',
			label: 'Jurnal Belum Selesai',
			status: pendingTotal === 0 ? 'pass' : 'warn',
			unit: 'dokumen',
			rows: pendingRows,
			difference: pendingTotal
		}
	]
	const status = checks.some((c) => c.status === 'fail') ? 'error' : checks.some((c) => c.status === 'warn') ? 'warning' : 'ok'
	return { period, closed: !!closedUntil && period <= closedUntil, status, summary, checks }
}

function statusOf(s: PostingState): ClosingStatus {
	const next = s.closed_until ? addMonths(s.closed_until, 1) : FIRST_PERIOD
	return {
		closed_until: s.closed_until,
		next_period: next,
		current_period: currentPeriod(),
		can_close: next <= currentPeriod() && s.repost_pending.every((r) => r.posted),
		can_reopen: s.closed_until !== null, // the real backend also checks the user's access right
		history: s.history.slice(0, 10),
		reopen_history: s.reopen_history.slice(0, 10),
		repost_pending: s.repost_pending
	}
}

const fieldError = (field: string, msg: string): [number, unknown] => [422, { message: 'Validasi gagal', errors: { [field]: [msg] } }]

// Contract: docs/posting/
// A date is locked once its period (YYYY-MM) is at or before the company's `closed_until` (docs/posting/index.md rules).
// Other mock modules use this to refuse writes into a closed period.
export function isPeriodClosed(companyId: number | null, date: string): boolean {
	const closedUntil = stateOf(companyId).closed_until
	return closedUntil !== null && date.slice(0, 7) <= closedUntil
}

// A write handler's 422 when `date` is in a closed period (null otherwise): `const closed = closedReply(config, row.date, 'jurnal tidak bisa diedit'); if (closed) return closed`.
export function closedReply(config: { headers?: Record<string, unknown> }, date: string, rest: string): [number, { message: string }] | null {
	return isPeriodClosed(companyIdOf(config), date) ? [422, { message: `Periode ${monthLabel(date.slice(0, 7))} sudah closing, ${rest}` }] : null
}

// 422 field error when a write would put a record's `date` into a closed period (null otherwise).
export function closedDateReply(config: { headers?: Record<string, unknown> }, date: unknown): [number, unknown] | null {
	if (typeof date !== 'string' || !isPeriodClosed(companyIdOf(config), date)) return null
	return [
		422,
		{
			message: 'Validasi gagal',
			errors: { date: [`Periode ${monthLabel(date.slice(0, 7))} sudah closing, tanggal tidak boleh di periode yang sudah closing`] }
		}
	]
}

// Response-side `locked` flag for records dated in a closed period (clients hide edit / delete / approval actions on it).
export function withLock<T extends { date: string }>(config: { headers?: Record<string, unknown> }, row: T): T & { locked: boolean } {
	return { ...row, locked: isPeriodClosed(companyIdOf(config), row.date) }
}

export function registerPosting(mock: MockAdapter) {
	mock.onGet('/posting').reply((config) => [200, { data: stateOf(companyIdOf(config)).runs }])

	mock.onPost('/posting').reply((config) => {
		const s = stateOf(companyIdOf(config))
		const { period } = JSON.parse(config.data) as { period?: string }
		if (!isPeriod(period)) return fieldError('period', 'Periode wajib dipilih')
		if (period! > currentPeriod()) return fieldError('period', 'Periode belum berjalan')
		if (s.closed_until && period! <= s.closed_until) return [422, { message: `Periode ${monthLabel(period!)} sudah ditutup` }]

		const run = { period: period!, posted_by: currentUserName(), posted_at: new Date().toISOString() }
		s.runs = [run, ...s.runs.filter((r) => r.period !== period)].sort((a, b) => b.period.localeCompare(a.period))
		const pending = s.repost_pending.find((r) => r.period === period)
		if (pending) pending.posted = true
		return [201, { data: run, message: `Posting periode ${monthLabel(period!)} selesai` }]
	})

	mock.onGet('/posting/closing').reply((config) => [200, { data: statusOf(stateOf(companyIdOf(config))) }])

	mock.onGet('/posting/closing/reconciliation').reply((config) => {
		const period = config.params?.period
		if (!isPeriod(period)) return fieldError('period', 'Periode wajib diisi (YYYY-MM)')
		return [200, { data: reconcile(period, stateOf(companyIdOf(config)).closed_until) }]
	})

	mock.onPost('/posting/closing').reply((config) => {
		const s = stateOf(companyIdOf(config))
		const st = statusOf(s)
		const { period } = JSON.parse(config.data) as { period?: string }
		if (period !== st.next_period) return fieldError('period', `Periode berikutnya yang dapat ditutup adalah ${monthLabel(st.next_period)}`)
		if (period > st.current_period) return [422, { message: `Periode ${monthLabel(period)} belum berjalan` }]
		const unposted = s.repost_pending.find((r) => !r.posted)
		if (unposted) return [422, { message: `Posting ulang periode ${monthLabel(unposted.period)} terlebih dahulu` }]

		const row: ClosingHistory = { period, closed_by: currentUserName(), closed_at: new Date().toISOString(), ...summaryOf(period) }
		s.history.unshift(row)
		s.closed_until = period
		s.repost_pending = s.repost_pending.filter((r) => r.period > period)
		return [201, { data: row, message: `Periode ${monthLabel(period)} ditutup` }]
	})

	mock.onPost('/posting/closing/reopen').reply((config) => {
		const s = stateOf(companyIdOf(config))
		const reason = String(JSON.parse(config.data).reason ?? '').trim()
		if (reason.length < 10) return fieldError('reason', 'Alasan wajib diisi (minimal 10 karakter)')
		if (!s.closed_until) return [422, { message: 'Belum ada periode yang ditutup' }]

		const period = s.closed_until
		const row: ReopenHistory = { period, reason, opened_by: currentUserName(), opened_at: new Date().toISOString() }
		s.history = s.history.filter((h) => h.period !== period)
		s.closed_until = s.history.length ? addMonths(period, -1) : null
		s.reopen_history.unshift(row)
		s.repost_pending = [{ period, posted: false }, ...s.repost_pending.filter((r) => r.period !== period)].sort((a, b) =>
			b.period.localeCompare(a.period)
		)
		return [200, { data: row, message: `Periode ${monthLabel(period)} dibuka kembali` }]
	})
}
