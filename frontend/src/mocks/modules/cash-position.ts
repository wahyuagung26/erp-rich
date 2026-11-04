import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { companyIdOf } from '../lib'
import type { CashPosition, CashPositionRow } from '@/utils/types'

type Move = { account_id: number; date: string; debit: number; credit: number; flow: boolean }

// Flatten every approved cash/bank movement in the company into one list.
function movements(companyId: number): Move[] {
	const cashIds = new Set(db.account.filter((a) => a.company_id === companyId && a.type === 'cash_bank' && !a.deleted_at).map((a) => a.id))
	const out: Move[] = []

	// Jurnal Umum — any approved line whose account is a cash/bank account.
	for (const j of db.journal) {
		if (j.status !== 'approved') continue
		for (const line of j.lines) {
			if (cashIds.has(Number(line.account_id)))
				out.push({ account_id: Number(line.account_id), date: j.date, debit: line.debit || 0, credit: line.credit || 0, flow: !!line.cash_flow })
		}
	}
	// Jurnal Pengeluaran — the header cash account is credited by cash_out.
	for (const j of db.journalExpense) {
		if (j.status === 'approved' && cashIds.has(j.cash_account_id))
			out.push({ account_id: j.cash_account_id, date: j.date, debit: 0, credit: j.cash_out, flow: !!j.cash_flow })
	}
	// Jurnal Pemasukan — the header cash account is debited by cash_in.
	for (const j of db.journalIncome) {
		if (j.status === 'approved' && cashIds.has(j.cash_account_id))
			out.push({ account_id: j.cash_account_id, date: j.date, debit: j.cash_in, credit: 0, flow: !!j.cash_flow })
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
}
