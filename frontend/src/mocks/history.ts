import type MockAdapter from 'axios-mock-adapter'
import { db } from './db'
import { date, money } from '@/utils/format'
import type { HistoryChange, HistoryEvent, HistoryKind, JournalStatus } from '@/utils/types'

// Record-history engine for the mock: every write handler calls recordHistory(); the GET route is
// registered per resource by registerHistoryRoute(). Contract: docs/conventions.md#record-history-resourceidhistory.
const keyOf = (resource: string, id: number) => `${resource}:${id}`

export const userName = () => {
	try {
		return JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin'
	} catch {
		return 'Admin'
	}
}

interface NewEvent {
	title: string
	kind: HistoryKind
	summary?: string | null
	changes?: HistoryChange[]
	actor?: string
}

export function recordHistory(resource: string, id: number, event: NewEvent) {
	const list = (db.history[keyOf(resource, id)] ??= [])
	list.push({
		id: list.reduce((max, item) => Math.max(max, item.id), 0) + 1,
		at: new Date().toISOString(),
		actor: event.actor ?? userName(),
		title: event.title,
		kind: event.kind,
		summary: event.summary ?? null,
		changes: event.changes ?? []
	})
}

// An update event; `changes` empty means the user saved without touching any field.
export function recordUpdate(resource: string, id: number, changes: HistoryChange[]) {
	recordHistory(resource, id, { title: 'Diubah', kind: 'updated', summary: changes.length ? null : 'Disimpan tanpa perubahan data', changes })
}

export function purgeHistory(resource: string, id: number) {
	delete db.history[keyOf(resource, id)]
}

// ---- diff helpers (compare the RESOLVED rows so labels show names, not ids) ----

export interface FieldSpec<T> {
	key: keyof T & string
	label: string
	format?: (value: unknown) => string
}

const plain = (value: unknown) => (value === null || value === undefined || value === '' ? '–' : String(value))
export const fmtMoney = (value: unknown) => money(Number(value ?? 0))
export const fmtDate = (value: unknown) => (value ? date(String(value)) : '–')
export const fmtPkp = (value: unknown) => (value ? 'PKP Aktif' : 'Non-PKP')

export function diffFields<T extends object>(before: T, after: T, specs: FieldSpec<T>[]): HistoryChange[] {
	return specs.flatMap(({ key, label, format = plain }) => {
		const from = format(before[key])
		const to = format(after[key])
		return from === to ? [] : [{ label, from, to }]
	})
}

// Per-product line diff: changed fields are labelled "<field> · <product>"; added/removed products are listed once.
export function diffLines<L extends object>(
	before: L[],
	after: L[],
	opts: { id: (line: L) => number; name: (line: L) => string; specs: FieldSpec<L>[]; itemLabel?: string }
): HistoryChange[] {
	const changes: HistoryChange[] = []
	for (const line of after) {
		const old = before.find((item) => opts.id(item) === opts.id(line))
		if (!old) {
			changes.push({ label: opts.itemLabel ?? 'Produk', from: '–', to: opts.name(line) })
			continue
		}
		for (const change of diffFields(old, line, opts.specs)) changes.push({ ...change, label: `${change.label} · ${opts.name(line)}` })
	}
	for (const old of before)
		if (!after.some((item) => opts.id(item) === opts.id(old))) changes.push({ label: opts.itemLabel ?? 'Produk', from: opts.name(old), to: '–' })
	return changes
}

export const fmtCount = (unit: string) => (value: unknown) => `${(value as unknown[] | null | undefined)?.length ?? 0} ${unit}`

// Journal-style documents have no stable line id, so lines are matched by account (the nth line of the same account
// pairs with the nth line of that account on the other side) and diffed field by field.
interface AccountLine {
	account_id: number
	account_code?: string
	account_name?: string
	department_name?: string
	cash_flow_name?: string
	detail_description?: string
	debit: number
	credit: number
}
type Keyed<L> = L & { key: number }
function keyByAccount<L extends AccountLine>(lines: L[]): Keyed<L>[] {
	const seen = new Map<number, number>()
	return lines.map((line) => {
		const nth = (seen.get(line.account_id) ?? 0) + 1
		seen.set(line.account_id, nth)
		return { ...line, key: line.account_id * 100 + nth }
	})
}
const ACCOUNT_LINE_FIELDS: FieldSpec<Keyed<AccountLine>>[] = [
	{ key: 'debit', label: 'Debit', format: fmtMoney },
	{ key: 'credit', label: 'Kredit', format: fmtMoney },
	{ key: 'department_name', label: 'Departemen' },
	{ key: 'cash_flow_name', label: 'Arus Kas' },
	{ key: 'detail_description', label: 'Keterangan Baris' }
]
export function diffAccountLines(before: AccountLine[], after: AccountLine[]): HistoryChange[] {
	return diffLines(keyByAccount(before), keyByAccount(after), {
		id: (line) => line.key,
		name: (line) => `${line.account_code ?? ''} ${line.account_name ?? `Akun #${line.account_id}`}`.trim(),
		specs: ACCOUNT_LINE_FIELDS,
		itemLabel: 'Akun'
	})
}

// Approval-flow events for submitted → approved / rejected → submitted documents (journals, cash advance).
export function recordStatusChange(resource: string, id: number, to: JournalStatus, reason?: string | null) {
	if (to === 'approved') recordHistory(resource, id, { title: 'Disetujui', kind: 'approved' })
	else if (to === 'rejected') recordHistory(resource, id, { title: 'Ditolak', kind: 'rejected', summary: reason ?? null })
	else recordHistory(resource, id, { title: 'Diajukan Ulang', kind: 'info' })
}

// GET /<resource>/:id/history — newest first. `exists` keeps the 404 identical to the module's own get.
export function registerHistoryRoute(mock: MockAdapter, resource: string, exists: (id: number) => boolean, notFound: string) {
	mock.onGet(new RegExp(`/${resource}/\\d+/history$`)).reply((config) => {
		const id = Number(config.url?.split('/').at(-2))
		if (!exists(id)) return [404, { message: notFound }]
		const events: HistoryEvent[] = [...(db.history[keyOf(resource, id)] ?? [])]
		return [200, { data: events.reverse() }]
	})
}
