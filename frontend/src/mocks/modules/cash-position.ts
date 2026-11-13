import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { companyIdOf } from '../lib'
import { isPeriodPosted } from './posting'
import type { CashPosition, CashPositionDifference, CashPositionRow } from '@/utils/types'

type Source = CashPositionDifference['rows'][number]['source']
type Cause = 'unposted' | 'counter_cash' | 'reversed' | 'untagged'

// One cash/bank leg of a document. `debit`/`credit` = what the account balance sees (0 until the period is posted);
// `arus` = what the Laporan Arus Kas counts (by the Arus Kas tag's position, 0 when untagged).
type Move = {
	source: Source
	source_label: string
	id: number
	number: string
	account_id: number
	date: string
	debit: number
	credit: number
	arus: number
	cause: Cause | null
}

const LABEL: Record<Source, string> = {
	journal: 'Jurnal Umum',
	'journal-expense': 'Jurnal Pengeluaran',
	'journal-income': 'Jurnal Pemasukan',
	'cash-advance': 'Uang Muka Operasional',
	'supplier-advance': 'Uang Muka Supplier',
	'customer-deposit': 'Titipan Customer'
}

const monthYear = (date: string) => `${date.slice(5, 7)}/${date.slice(0, 4)}`

const CAUSE_TEXT: Record<Cause, (period: string) => string> = {
	unposted: (d) => `Belum diposting. Jalankan Posting periode ${monthYear(d)} (dokumen harus sudah disetujui).`,
	counter_cash: () => 'Jurnal posting tidak mengubah saldo kas/bank (akun lawannya juga akun kas), padahal dokumen bertag arus kas.',
	reversed: () => 'Arah tag arus kas di dokumen terbalik (uang masuk bertag keluar atau sebaliknya). Ganti tag arus kas di dokumen.',
	untagged: () => ''
}

// Flatten every approved cash/bank leg in the company into one list.
function movements(companyId: number): Move[] {
	const cashIds = new Set(db.account.filter((a) => a.company_id === companyId && a.type === 'cash_bank' && !a.deleted_at).map((a) => a.id))
	const position = new Map(db.cashFlow.map((f) => [f.code, f.position]))
	const out: Move[] = []

	// `raw` = the real cash movement; `flow` = Arus Kas code; `counterCash` = the other side is a cash account too (net zero on balances).
	function add(
		source: Source,
		doc: { id: number; number: string; date: string },
		account_id: number,
		raw: { debit: number; credit: number },
		flow: string | null | undefined,
		opts: { posted?: boolean; counterCash?: boolean } = {}
	) {
		if (!cashIds.has(account_id)) return
		const posted = opts.posted ?? true
		const net = raw.debit - raw.credit
		const pos = flow ? position.get(flow) : undefined
		const arus = !flow ? 0 : pos === 'IN' ? Math.abs(net) : pos === 'OUT' ? -Math.abs(net) : net
		const moves = posted && !opts.counterCash
		let cause: Cause | null = null
		if (!posted && arus !== 0) cause = 'unposted'
		else if (posted && opts.counterCash && arus !== 0) cause = 'counter_cash'
		else if (!flow) cause = 'untagged'
		else if (Math.sign(arus) !== Math.sign(net)) cause = 'reversed'
		out.push({
			source,
			source_label: LABEL[source],
			id: doc.id,
			number: doc.number,
			account_id,
			date: doc.date,
			debit: moves ? raw.debit : 0,
			credit: moves ? raw.credit : 0,
			arus,
			cause
		})
	}

	// Jurnal Umum — any approved line whose account is a cash/bank account (line-level tag).
	for (const j of db.journal) {
		if (j.status === 'approved')
			for (const l of j.lines) add('journal', j, Number(l.account_id), { debit: l.debit || 0, credit: l.credit || 0 }, l.cash_flow)
	}
	// Jurnal Pengeluaran / Pemasukan — the header cash account, header-level tag.
	for (const j of db.journalExpense) {
		if (j.status === 'approved') add('journal-expense', j, j.cash_account_id, { debit: 0, credit: j.cash_out }, j.cash_flow)
	}
	for (const j of db.journalIncome) {
		if (j.status === 'approved') add('journal-income', j, j.cash_account_id, { debit: j.cash_in, credit: 0 }, j.cash_flow)
	}
	// Documents that post through the Posting run: the balance moves only once their period is posted.
	const posted = (date: string) => isPeriodPosted(companyId, date.slice(0, 7))
	const isCash = (id: number) => cashIds.has(id)
	for (const d of db.cashAdvance) {
		if (d.status === 'approved')
			add('cash-advance', d, d.cash_account_id, { debit: 0, credit: d.amount }, d.cash_flow, {
				posted: posted(d.date),
				counterCash: isCash(d.advance_account_id)
			})
	}
	for (const d of db.supplierAdvance)
		add('supplier-advance', d, d.cash_account_id, { debit: 0, credit: d.amount }, d.cash_flow, { posted: posted(d.date) })
	for (const d of db.customerDeposit)
		add('customer-deposit', d, d.cash_account_id, { debit: d.amount, credit: 0 }, d.cash_flow, { posted: posted(d.date) })
	return out
}

// Total balance of all cash/bank accounts of the company at the end of `date` (used by the Outlook balance check).
export function cashBankBalance(companyId: number, date: string): number {
	return movements(companyId)
		.filter((m) => m.date <= date)
		.reduce((s, m) => s + m.debit - m.credit, 0)
}

const today = () => new Date().toISOString().slice(0, 10)
const isDate = (v: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(v))

// Contract: docs/cash-position/
export function registerCashPosition(mock: MockAdapter) {
	mock.onGet('/cash-position').reply((config) => {
		const p = config.params ?? {}
		let date_from = isDate(p.date_from) ? String(p.date_from) : today()
		let date_to = isDate(p.date_to) ? String(p.date_to) : date_from
		if (date_to < date_from) [date_from, date_to] = [date_to, date_from]
		const companyId = companyIdOf(config)
		if (companyId === null)
			return [
				200,
				{ data: { date_from, date_to, rows: [], total: { opening: 0, cash_in: 0, cash_out: 0, closing: 0 }, cash_flow_closing: 0, difference: 0 } }
			]

		const accounts = db.account
			.filter((a) => a.company_id === companyId && a.type === 'cash_bank' && !a.deleted_at)
			.sort((a, b) => a.code.localeCompare(b.code))
		const moves = movements(companyId)

		const rows: CashPositionRow[] = accounts.map((a) => {
			const mine = moves.filter((m) => m.account_id === a.id)
			const opening = mine.filter((m) => m.date < date_from).reduce((s, m) => s + m.debit - m.credit, 0)
			const cash_in = mine.filter((m) => m.date >= date_from && m.date <= date_to).reduce((s, m) => s + m.debit, 0)
			const cash_out = mine.filter((m) => m.date >= date_from && m.date <= date_to).reduce((s, m) => s + m.credit, 0)
			return { account_id: a.id, account_code: a.code, account_name: a.name, opening, cash_in, cash_out, closing: opening + cash_in - cash_out }
		})

		const total = rows.reduce(
			(t, r) => ({
				opening: t.opening + r.opening,
				cash_in: t.cash_in + r.cash_in,
				cash_out: t.cash_out + r.cash_out,
				closing: t.closing + r.closing
			}),
			{ opening: 0, cash_in: 0, cash_out: 0, closing: 0 }
		)
		// Cash-flow report balance: cumulative Arus Kas amounts up to `date_to`.
		const cash_flow_closing = moves.filter((m) => m.date <= date_to).reduce((s, m) => s + m.arus, 0)
		return [
			200,
			{ data: { date_from, date_to, rows, total, cash_flow_closing, difference: total.closing - cash_flow_closing } satisfies CashPosition }
		]
	})

	// One row per document whose cash-account balance differs from what the Arus Kas report counts (Σ selisih = `difference`).
	mock.onGet('/cash-position/difference').reply((config) => {
		const p = config.params ?? {}
		const date_to = isDate(p.date_to) ? String(p.date_to) : today()
		const companyId = companyIdOf(config)
		const accounts = new Map(db.account.filter((a) => a.company_id === companyId).map((a) => [a.id, a]))
		const docs = new Map<string, { move: Move; saldo: number; arus: number; causes: Set<Cause>; untagged: Set<string> }>()
		for (const m of companyId === null ? [] : movements(companyId)) {
			if (m.date > date_to) continue
			const key = `${m.source}-${m.id}`
			const d = docs.get(key) ?? { move: m, saldo: 0, arus: 0, causes: new Set<Cause>(), untagged: new Set<string>() }
			d.saldo += m.debit - m.credit
			d.arus += m.arus
			if (m.cause) d.causes.add(m.cause)
			if (m.cause === 'untagged') d.untagged.add(accounts.get(m.account_id)?.name ?? '')
			docs.set(key, d)
		}
		const rows = [...docs.values()]
			.filter((d) => d.saldo !== d.arus)
			.sort((a, b) => a.move.date.localeCompare(b.move.date) || a.move.number.localeCompare(b.move.number))
			.map(({ move: m, saldo, arus, causes, untagged }) => {
				const cause = (['unposted', 'counter_cash', 'reversed'] as const).find((c) => causes.has(c))
				const isJournal = m.source.startsWith('journal')
				const text = cause
					? CAUSE_TEXT[cause](m.date)
					: isJournal
						? `Akun kas tanpa tag arus kas: ${[...untagged].join(', ')}`
						: 'Dokumen belum diberi tag arus kas. Pilih arus kas di dokumen.'
				return {
					// Untagged cash lines of a journal are one collapsible group (like legacy); every other cause stands alone.
					group: !cause && isJournal ? 'untagged_journal' : null,
					source: m.source,
					source_label: m.source_label,
					id: m.id,
					number: m.number,
					date: m.date,
					saldo_kas: saldo,
					arus_kas: arus,
					selisih: saldo - arus,
					cause: text
				}
			})
		const sum = (k: 'saldo_kas' | 'arus_kas' | 'selisih') => rows.reduce((s, r) => s + r[k], 0)
		const groups = [
			{
				key: 'untagged_journal',
				label: 'Jurnal dengan akun kas tanpa tag arus kas',
				action: 'Beri tag arus kas pada akun kas/bank tersebut, atau setujui pasangan jurnal pindah bukunya.'
			}
		]
		return [
			200,
			{
				data: {
					date_to,
					groups,
					rows,
					total: { saldo_kas: sum('saldo_kas'), arus_kas: sum('arus_kas'), selisih: sum('selisih') }
				} satisfies CashPositionDifference
			}
		]
	})
}
