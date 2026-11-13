import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { companyIdOf } from '../lib'
import type { CashPosition, CashPositionDifference, CashPositionRow } from '@/utils/types'

type Move = Pick<CashPositionDifference['rows'][number], 'source' | 'source_label' | 'id' | 'number'> & {
	account_id: number
	date: string
	debit: number
	credit: number
	flow: boolean
}

// Flatten every approved cash/bank movement in the company into one list.
function movements(companyId: number): Move[] {
	const cashIds = new Set(db.account.filter((a) => a.company_id === companyId && a.type === 'cash_bank' && !a.deleted_at).map((a) => a.id))
	const out: Move[] = []

	// Jurnal Umum — any approved line whose account is a cash/bank account.
	for (const j of db.journal) {
		if (j.status !== 'approved') continue
		for (const line of j.lines) {
			if (cashIds.has(Number(line.account_id)))
				out.push({
					source: 'journal',
					source_label: 'Jurnal Umum',
					id: j.id,
					number: j.number,
					account_id: Number(line.account_id),
					date: j.date,
					debit: line.debit || 0,
					credit: line.credit || 0,
					flow: !!line.cash_flow
				})
		}
	}
	// Jurnal Pengeluaran — the header cash account is credited by cash_out.
	for (const j of db.journalExpense) {
		if (j.status === 'approved' && cashIds.has(j.cash_account_id))
			out.push({
				source: 'journal-expense',
				source_label: 'Jurnal Pengeluaran',
				id: j.id,
				number: j.number,
				account_id: j.cash_account_id,
				date: j.date,
				debit: 0,
				credit: j.cash_out,
				flow: !!j.cash_flow
			})
	}
	// Jurnal Pemasukan — the header cash account is debited by cash_in.
	for (const j of db.journalIncome) {
		if (j.status === 'approved' && cashIds.has(j.cash_account_id))
			out.push({
				source: 'journal-income',
				source_label: 'Jurnal Pemasukan',
				id: j.id,
				number: j.number,
				account_id: j.cash_account_id,
				date: j.date,
				debit: j.cash_in,
				credit: 0,
				flow: !!j.cash_flow
			})
	}
	return out
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
		// Cash-flow report balance: cumulative movements up to `date_to` that carry an Arus Kas code.
		const cash_flow_closing = moves.filter((m) => m.flow && m.date <= date_to).reduce((s, m) => s + m.debit - m.credit, 0)
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
		const docs = new Map<string, { move: Move; saldo: number; arus: number; untagged: Set<string> }>()
		for (const m of companyId === null ? [] : movements(companyId)) {
			if (m.date > date_to) continue
			const key = `${m.source}-${m.id}`
			const d = docs.get(key) ?? { move: m, saldo: 0, arus: 0, untagged: new Set<string>() }
			d.saldo += m.debit - m.credit
			if (m.flow) d.arus += m.debit - m.credit
			else d.untagged.add(accounts.get(m.account_id)?.name ?? '')
			docs.set(key, d)
		}
		const rows = [...docs.values()]
			.filter((d) => d.saldo !== d.arus)
			.sort((a, b) => a.move.date.localeCompare(b.move.date) || a.move.number.localeCompare(b.move.number))
			.map(({ move: m, saldo, arus, untagged }) => ({
				group: 'untagged_journal',
				source: m.source,
				source_label: m.source_label,
				id: m.id,
				number: m.number,
				date: m.date,
				saldo_kas: saldo,
				arus_kas: arus,
				selisih: saldo - arus,
				cause: `Akun kas tanpa tag arus kas: ${[...untagged].join(', ')}`
			}))
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
