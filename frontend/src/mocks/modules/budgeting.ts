import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { companyIdOf, nextId, paginate, sortBy, type ListParams } from '../lib'
import { userName } from '../history'
import type { HistoryEvent } from '@/utils/types'
import {
	codeExample,
	codePattern,
	sumDocument,
	type BudgetAccount,
	type BudgetAction,
	type BudgetDocument,
	type BudgetLine,
	type BudgetStatus,
	type RealizationRow,
	type RevisionPeriod
} from '@/views/budgeting/types'

const today = () => new Date().toLocaleDateString('sv-SE')
const yearNow = () => new Date().getFullYear()
const validDate = (value: string) =>
	/^\d{4}-\d{2}-\d{2}$/.test(value ?? '') &&
	!Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
	new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
const copyLines = (lines: BudgetLine[]) => lines.map((line) => ({ ...line, months: [...line.months] }))
const idFrom = (url?: string) => Number(url?.match(/\/(\d+)(?:\/actions)?$/)?.[1])
const editable = (status: BudgetStatus) => status === 'Draft' || status === 'Ditolak'
const missing = (): [number, { message: string }] => [404, { message: 'Dokumen tidak ditemukan. Periksa kembali pilihan Anda.' }]
const invalid = (message: string): [number, { message: string }] => [422, { message }]

// The demo catalog extends master accounts with illustrative report sections and asset mapping.
// Production must obtain P&L sections and CAPEX eligibility from its own configuration.
function accounts(companyId: number): BudgetAccount[] {
	const rows: BudgetAccount[] = db.account
		.filter((a) => a.company_id === companyId && !a.deleted_at && ['revenue', 'expense'].includes(a.type))
		.map((a) => ({
			id: a.id,
			code: a.code,
			name: a.name,
			section: a.type === 'revenue' ? 'Pendapatan' : 'Beban Umum & Administrasi',
			prefix: 'EXP',
			sign: a.type === 'revenue' && a.id !== 18 ? 1 : -1
		}))
	if (companyId === 1)
		rows.push(
			{ id: 90002, code: '5000101', name: 'Harga Pokok Penjualan', section: 'Harga Pokok Penjualan', prefix: 'EXP', sign: -1 },
			{ id: 90003, code: '6100101', name: 'Beban Promosi', section: 'Beban Operasional Penjualan', prefix: 'EXP', sign: -1 },
			{ id: 90004, code: '4200101', name: 'Penghasilan Dividen', section: 'Penghasilan Dividen', prefix: 'EXP', sign: 1 },
			{ id: 90005, code: '7100101', name: 'Beban Lain-Lain', section: 'Pendapatan dan Beban Lain-Lain', prefix: 'EXP', sign: -1 },
			{ id: 90006, code: '8100101', name: 'Beban Pajak', section: 'Beban Pajak', prefix: 'EXP', sign: -1 },
			{ id: 90001, code: '1500101', name: 'Mesin dan Peralatan', section: 'Belanja Modal', prefix: 'CPX', sign: -1 }
		)
	return rows
}
function period(companyId: number): RevisionPeriod {
	const saved = db.budgetPeriod[companyId]
	const current: RevisionPeriod =
		saved && saved.year === yearNow()
			? saved
			: { year: yearNow(), start_date: null, end_date: null, is_active: false, is_open: false, revision_month_start: new Date().getMonth() + 1 }
	return {
		...current,
		is_open: !!(current.is_active && current.start_date && current.end_date && current.start_date <= today() && today() <= current.end_date),
		revision_month_start: current.start_date ? Number(current.start_date.slice(5, 7)) : new Date().getMonth() + 1
	}
}
function demoActual(companyId: number, departmentId: number, code: string, year: number): number[] {
	// Demonstration-only figures, deliberately independent of journal fixtures.
	if (companyId !== 1 || departmentId !== 4 || year !== yearNow()) return Array(12).fill(0)
	const amount = code === '4000101' ? 42000000 : code === '6000101' ? 14000000 : 0
	return Array.from({ length: 12 }, (_, i) => (i < new Date().getMonth() ? amount : 0))
}
function snapshot(doc: BudgetDocument) {
	return Object.fromEntries(
		[...new Set(doc.lines.map((line) => line.account_code))].map((code) => [
			code,
			demoActual(doc.company_id, doc.department_id, code, yearNow()).reduce((a, b) => a + b, 0)
		])
	)
}
function validateLines(value: unknown, companyId: number, year: number, excludeId?: number | number[]): string | null {
	if (!Array.isArray(value) || !value.length) return 'Tambahkan setidaknya satu rincian budget.'
	const used = new Set(
		db.budget
			.filter(
				(b) => b.company_id === companyId && b.status !== 'Dibatalkan' && !(Array.isArray(excludeId) ? excludeId.includes(b.id) : b.id === excludeId)
			)
			.flatMap((b) => b.lines.map((l) => l.code.toUpperCase()))
	)
	for (const line of value as BudgetLine[]) {
		if (!line || typeof line.code !== 'string' || typeof line.description !== 'string') return 'Isi kode dan deskripsi untuk setiap rincian.'
		const account = accounts(companyId).find((a) => a.id === Number(line.account_id))
		if (!account) return 'Akun tidak tersedia untuk budgeting. Pilih akun yang tersedia.'
		const code = String(line.code || '')
			.trim()
			.toUpperCase()
		const match = code.length <= 50 ? code.match(codePattern) : null
		if (!match)
			return `Format kode rincian ${code || account.code} belum sesuai. Gunakan AWALAN/OBG${year}/KODE_DEPT/NNN, contoh ${codeExample(year)}.`
		if (Number(match[2]) !== year) return `Tahun pada kode ${code} (${match[2]}) tidak sama dengan tahun anggaran (${year}).`
		if (match[1] !== account.prefix)
			return `Akun ${account.code} termasuk ${account.prefix === 'CPX' ? 'CAPEX' : 'OPEX'}, awalan kode harus ${account.prefix}.`
		if (used.has(code)) return `Kode rincian ${code} sudah digunakan. Gunakan kode yang berbeda.`
		used.add(code)
		if (!String(line.description || '').trim()) return `Isi deskripsi rincian ${code}.`
		if (!Array.isArray(line.months) || line.months.length !== 12 || line.months.some((n) => typeof n !== 'number' || !Number.isFinite(n) || n < 0))
			return `Nominal bulanan ${code} harus berupa angka nol atau lebih.`
	}
	return null
}
function normalize(lines: BudgetLine[], companyId: number): BudgetLine[] {
	return lines.map((line) => {
		const account = accounts(companyId).find((a) => a.id === Number(line.account_id))!
		return {
			account_id: account.id,
			account_code: account.code,
			account_name: account.name,
			section: account.section,
			prefix: account.prefix,
			sign: account.sign,
			code: line.code.trim().toUpperCase(),
			description: line.description.trim(),
			months: [...line.months]
		}
	})
}
function validateRevision(lines: unknown, original: BudgetLine[], start: number): string | null {
	if (!Array.isArray(lines) || lines.length !== original.length) return 'Rincian revisi harus sama dengan budget awal.'
	for (let i = 0; i < original.length; i++) {
		const initial = original[i]!
		const line = lines[i] as BudgetLine
		if (
			!line ||
			line.account_id !== initial.account_id ||
			line.code !== initial.code ||
			line.description !== initial.description ||
			!Array.isArray(line.months) ||
			line.months.length !== 12
		)
			return 'Akun, kode, dan deskripsi rincian harus sama dengan budget awal.'
		if (line.months.some((v, n) => typeof v !== 'number' || !Number.isFinite(v) || v < 0 || (n < start - 1 && v !== initial.months[n])))
			return 'Bulan sebelum periode revisi harus sama dengan budget awal; nominal lainnya harus nol atau lebih.'
	}
	return null
}
function historyOf(doc: BudgetDocument): HistoryEvent[] {
	return doc.history.map((event, i) => ({
		id: doc.history.length - i,
		at: event.at,
		actor: event.by,
		title: event.action,
		kind:
			event.to === 'Disetujui'
				? 'approved'
				: event.to === 'Ditolak'
					? 'rejected'
					: event.from === null
						? 'created'
						: event.from === event.to
							? 'updated'
							: 'info',
		summary: event.note || null,
		changes: event.from && event.from !== event.to ? [{ label: 'Status', from: event.from, to: event.to }] : []
	}))
}
function append(doc: BudgetDocument, action: string, next: BudgetStatus, note = '') {
	const from = doc.status
	doc.status = next
	doc.history.unshift({ action, from, to: next, note, at: new Date().toISOString(), by: userName() })
}
function action(doc: BudgetDocument, value: BudgetAction, note: string, revision: boolean): string | null {
	if (value === 'submit' && editable(doc.status)) {
		if (revision && doc.year < yearNow()) return 'Revisi tahun lalu tidak dapat diajukan.'
		append(doc, 'Diajukan', 'Diajukan', note)
	} else if (value === 'approve' && doc.status === 'Diajukan') {
		doc.ytd_snapshot = snapshot(doc)
		doc.ytd_snapshot_year = yearNow()
		doc.ytd_snapshot_month = new Date().getMonth()
		append(doc, 'Disetujui', 'Disetujui', note)
	} else if (value === 'reject' && doc.status === 'Diajukan') {
		if (!note.trim()) return 'Isi alasan penolakan sebelum melanjutkan.'
		append(doc, 'Ditolak', 'Ditolak', note.trim())
	} else if (value === 'cancel' && editable(doc.status)) append(doc, 'Dibatalkan', 'Dibatalkan', note)
	else if (value === 'unapprove' && !revision && doc.status === 'Disetujui') {
		if (db.budgetRevision.some((r) => r.company_id === doc.company_id && r.budget_id === doc.id))
			return 'Budget yang sudah memiliki revisi tidak dapat dibatalkan persetujuannya.'
		doc.ytd_snapshot = null
		doc.ytd_snapshot_year = null
		doc.ytd_snapshot_month = null
		append(doc, 'Persetujuan dibatalkan', 'Draft', note)
	} else return 'Aksi tidak tersedia untuk status dokumen saat ini.'
	return null
}
// Derived read-only fields: a budget lists its revisions, a revision carries the initial total.
function out(doc: BudgetDocument, revision: boolean): BudgetDocument {
	return revision
		? { ...doc, initial_total: sumDocument(doc.initial_lines ?? []) }
		: {
				...doc,
				revisions: db.budgetRevision
					.filter((r) => r.company_id === doc.company_id && r.budget_id === doc.id)
					.map((r) => ({ id: r.id, number: r.number, status: r.status }))
			}
}
function list(rows: BudgetDocument[], companyId: number | null, p: ListParams, revision: boolean) {
	let result = rows.filter((r) => r.company_id === companyId)
	// Legacy hides cancelled budgets from the list; revisions keep them (status filter has Dibatalkan).
	if (!revision) result = result.filter((r) => r.status !== 'Dibatalkan')
	// revision=none: budgets that can still start a revision (no non-cancelled revision yet).
	if (p.revision === 'none')
		result = result.filter((r) => !db.budgetRevision.some((v) => v.company_id === r.company_id && v.budget_id === r.id && v.status !== 'Dibatalkan'))
	if (p.q) {
		const q = String(p.q).toLowerCase()
		result = result.filter((r) => `${r.number} ${r.description} ${r.department_name}`.toLowerCase().includes(q))
	}
	if (p.year) result = result.filter((r) => r.year === Number(p.year))
	if (p.department_id) result = result.filter((r) => r.department_id === Number(p.department_id))
	if (p.status) result = result.filter((r) => r.status === p.status)
	const page = paginate(sortBy(result, p.sort_by, p.sort_order), p)
	return { ...page, data: page.data.map((r) => out(r, revision)) }
}
interface BatchInput {
	year: number
	departments: { department_code: string; lines: BudgetLine[] }[]
}
interface BatchItem {
	department_code: string
	department_name: string
	action: 'create' | 'replace' | 'reject'
	number?: string
	errors: string[]
}
function previewBatch(body: BatchInput, cid: number): BatchItem[] {
	if (
		!body ||
		!Array.isArray(body.departments) ||
		!Number.isInteger(Number(body.year)) ||
		Number(body.year) < 2000 ||
		Number(body.year) > 2100 ||
		!body.departments.length ||
		body.departments.length > 100
	)
		return [{ department_code: '', department_name: '', action: 'reject', errors: ['Isi tahun dan sedikitnya satu departemen (maksimal 100).'] }]
	if (body.departments.some((item) => !item || typeof item.department_code !== 'string'))
		return [{ department_code: '', department_name: '', action: 'reject', errors: ['Periksa kode departemen pada file.'] }]
	const codes = new Set<string>()
	const allLineCodes = new Set<string>()
	const exclude = db.budget
		.filter(
			(b) =>
				b.company_id === cid &&
				b.year === Number(body.year) &&
				body.departments.some((d) =>
					db.department.some((dept) => dept.id === b.department_id && dept.code.toUpperCase() === String(d.department_code).trim().toUpperCase())
				)
		)
		.map((b) => b.id)
	return body.departments.map((item) => {
		const code = String(item.department_code || '')
			.trim()
			.toUpperCase()
		const department = db.department.find((d) => d.company_id === cid && !d.deleted_at && d.code.toUpperCase() === code)
		const existing =
			department &&
			db.budget.find((b) => b.company_id === cid && b.department_id === department.id && b.year === Number(body.year) && b.status !== 'Dibatalkan')
		const errors: string[] = []
		if (!department) errors.push('Departemen tidak tersedia pada perusahaan ini.')
		if (codes.has(code)) errors.push('Departemen muncul lebih dari sekali.')
		codes.add(code)
		if (existing && !editable(existing.status)) errors.push(`Budget ${existing.number} berstatus ${existing.status} dan tidak dapat diganti.`)
		const error = validateLines(item.lines, cid, Number(body.year), exclude)
		if (error) errors.push(error)
		if (Array.isArray(item.lines))
			for (const line of item.lines) {
				const key = String(line.code || '')
					.trim()
					.toUpperCase()
				if (allLineCodes.has(key)) errors.push(`Kode rincian ${key} digunakan lebih dari sekali di file.`)
				allLineCodes.add(key)
			}
		return {
			department_code: code,
			department_name: department?.name ?? '',
			action: errors.length ? 'reject' : existing ? 'replace' : 'create',
			...(existing ? { number: existing.number } : {}),
			errors
		}
	})
}
export function registerBudgeting(mock: MockAdapter) {
	const importHandler = (commit: boolean) => (config: import('axios').AxiosRequestConfig) => {
		const cid = companyIdOf(config)
		if (!cid) return invalid('Pilih perusahaan terlebih dahulu.')
		const body = JSON.parse(config.data) as BatchInput
		const preview = previewBatch(body, cid)
		const valid = preview.every((item) => item.errors.length === 0)
		if (!commit) return [200, { data: { departments: preview, valid } }] as [number, unknown]
		if (!valid) return invalid('Import tidak disimpan karena ada data yang tidak valid. Periksa kembali hasil pemeriksaan.')
		const documents = body.departments.map((item) => {
			const dept = db.department.find(
				(d) => d.company_id === cid && !d.deleted_at && d.code.toUpperCase() === item.department_code.trim().toUpperCase()
			)!
			let doc = db.budget.find(
				(b) => b.company_id === cid && b.department_id === dept.id && b.year === Number(body.year) && b.status !== 'Dibatalkan'
			)
			const lines = normalize(item.lines, cid)
			if (doc) {
				doc.lines = lines
				doc.total = sumDocument(lines)
				append(doc, 'Import diperbarui', doc.status)
			} else {
				const id = nextId(db.budget)
				const year = Number(body.year)
				doc = {
					id,
					company_id: cid,
					number: `BGT/${year}/${String(id).padStart(3, '0')}`,
					department_id: dept.id,
					department_code: dept.code,
					department_name: dept.name,
					year,
					description: `Anggaran ${dept.name} ${year}`,
					status: 'Draft',
					created_by: userName(),
					created_at: new Date().toISOString(),
					lines,
					total: sumDocument(lines),
					history: [{ action: 'Import dibuat', at: new Date().toISOString(), note: '', from: null, to: 'Draft', by: userName() }],
					ytd_snapshot: null,
					ytd_snapshot_year: null,
					ytd_snapshot_month: null
				}
				db.budget.unshift(doc)
			}
			return { id: doc.id, number: doc.number, department_name: doc.department_name }
		})
		return [200, { data: { documents } }] as [number, unknown]
	}
	mock.onPost('/budgeting/import/preview').reply(importHandler(false))
	mock.onPost('/budgeting/import/commit').reply(importHandler(true))
	mock.onGet('/budgeting/accounts').reply((config) => {
		const cid = companyIdOf(config)
		const p = (config.params ?? {}) as ListParams
		const q = String(p.q ?? '').toLowerCase()
		return [200, paginate(cid ? accounts(cid).filter((a) => `${a.code} ${a.name}`.toLowerCase().includes(q)) : [], p)]
	})
	mock.onGet('/budgeting/budgets').reply((config) => [200, list(db.budget, companyIdOf(config), (config.params ?? {}) as ListParams, false)])
	mock.onGet('/budgeting/revisions').reply((config) => [200, list(db.budgetRevision, companyIdOf(config), (config.params ?? {}) as ListParams, true)])
	mock.onGet(/\/budgeting\/budgets\/\d+$/).reply((config) => {
		const row = db.budget.find((b) => b.id === idFrom(config.url) && b.company_id === companyIdOf(config))
		return row ? [200, { data: out(row, false) }] : missing()
	})
	mock.onGet(/\/budgeting\/revisions\/\d+$/).reply((config) => {
		const row = db.budgetRevision.find((b) => b.id === idFrom(config.url) && b.company_id === companyIdOf(config))
		return row ? [200, { data: out(row, true) }] : missing()
	})
	// Record-history contract (docs/conventions.md): the document's own status log, mapped to timeline events (newest first).
	for (const [path, rows] of [
		['budgets', db.budget],
		['revisions', db.budgetRevision]
	] as const)
		mock.onGet(new RegExp(`/budgeting/${path}/\\d+/history$`)).reply((config) => {
			const doc = rows.find((b) => b.id === Number(config.url?.split('/').at(-2)) && b.company_id === companyIdOf(config))
			return doc ? [200, { data: historyOf(doc) }] : missing()
		})
	mock.onPost('/budgeting/budgets').reply((config) => {
		const cid = companyIdOf(config)
		if (!cid) return invalid('Pilih perusahaan terlebih dahulu.')
		const body = JSON.parse(config.data) as { department_id: number; year: number; description: string; lines: BudgetLine[] }
		const dept = db.department.find((d) => d.id === Number(body.department_id) && d.company_id === cid && !d.deleted_at)
		if (!dept || !Number.isInteger(Number(body.year)) || Number(body.year) < 2000 || Number(body.year) > 2100 || !body.description?.trim())
			return invalid('Pilih departemen, isi tahun dan deskripsi budget.')
		const year = Number(body.year)
		if (db.budget.some((b) => b.company_id === cid && b.department_id === dept.id && b.year === year && b.status !== 'Dibatalkan'))
			return invalid('Budget aktif untuk departemen dan tahun ini sudah ada.')
		const error = validateLines(body.lines, cid, year)
		if (error) return invalid(error)
		const lines = normalize(body.lines, cid)
		const id = nextId(db.budget)
		const doc: BudgetDocument = {
			id,
			company_id: cid,
			number: `BGT/${year}/${String(id).padStart(3, '0')}`,
			department_id: dept.id,
			department_code: dept.code,
			department_name: dept.name,
			year,
			description: body.description.trim(),
			status: 'Draft',
			created_by: userName(),
			created_at: new Date().toISOString(),
			lines,
			total: sumDocument(lines),
			history: [{ action: 'Dibuat', at: new Date().toISOString(), note: '', from: null, to: 'Draft', by: userName() }],
			ytd_snapshot: null,
			ytd_snapshot_year: null,
			ytd_snapshot_month: null
		}
		db.budget.unshift(doc)
		return [201, { data: out(doc, false) }]
	})
	mock.onPut(/\/budgeting\/budgets\/\d+$/).reply((config) => {
		const cid = companyIdOf(config)
		const doc = db.budget.find((b) => b.id === idFrom(config.url) && b.company_id === cid)
		if (!doc || !cid) return missing()
		if (!editable(doc.status)) return invalid('Budget tidak dapat diubah pada status ini.')
		const body = JSON.parse(config.data) as { description: string; lines: BudgetLine[] }
		if (!body.description?.trim()) return invalid('Isi deskripsi budget.')
		const error = validateLines(body.lines, cid, doc.year, doc.id)
		if (error) return invalid(error)
		doc.description = body.description.trim()
		doc.lines = normalize(body.lines, cid)
		doc.total = sumDocument(doc.lines)
		append(doc, 'Diperbarui', doc.status)
		return [200, { data: out(doc, false) }]
	})
	mock.onPost('/budgeting/revisions').reply((config) => {
		const cid = companyIdOf(config)
		const body = JSON.parse(config.data) as { budget_id: number; description: string; lines: BudgetLine[] }
		const parent = db.budget.find((b) => b.company_id === cid && b.id === Number(body.budget_id))
		if (!parent || !cid) return missing()
		const current = period(cid)
		if (parent.status !== 'Disetujui' || parent.year !== current.year || !current.is_open)
			return invalid('Pilih budget tahun berjalan yang disetujui dan buka periode revisi terlebih dahulu.')
		if (db.budgetRevision.some((r) => r.company_id === cid && r.budget_id === parent.id && r.status !== 'Dibatalkan'))
			return invalid('Budget ini sudah memiliki revisi yang belum dibatalkan.')
		if (!body.description?.trim()) return invalid('Isi deskripsi revisi.')
		const error = validateRevision(body.lines, parent.lines, Math.max(current.revision_month_start, new Date().getMonth() + 1))
		if (error) return invalid(error)
		const id = nextId(db.budgetRevision)
		const lines = parent.lines.map((line, i) => ({ ...line, months: [...body.lines[i]!.months] }))
		const doc: BudgetDocument = {
			...parent,
			id,
			number: `REV/${parent.year}/${String(id).padStart(3, '0')}`,
			budget_id: parent.id,
			budget_number: parent.number,
			description: body.description.trim(),
			status: 'Draft',
			created_by: userName(),
			created_at: new Date().toISOString(),
			initial_lines: copyLines(parent.lines),
			lines,
			total: sumDocument(lines),
			revision_month_start: Math.max(current.revision_month_start, new Date().getMonth() + 1),
			history: [{ action: 'Dibuat', at: new Date().toISOString(), note: '', from: null, to: 'Draft', by: userName() }],
			ytd_snapshot: null,
			ytd_snapshot_year: null,
			ytd_snapshot_month: null
		}
		db.budgetRevision.unshift(doc)
		return [201, { data: out(doc, true) }]
	})
	mock.onPut(/\/budgeting\/revisions\/\d+$/).reply((config) => {
		const cid = companyIdOf(config)
		const doc = db.budgetRevision.find((b) => b.id === idFrom(config.url) && b.company_id === cid)
		if (!doc || !cid) return missing()
		const current = period(cid)
		if (!editable(doc.status) || !current.is_open || doc.year !== current.year)
			return invalid('Revisi tidak dapat diubah. Periksa status dan periode revisi.')
		const body = JSON.parse(config.data) as { description: string; lines: BudgetLine[] }
		if (!body.description?.trim()) return invalid('Isi deskripsi revisi.')
		const error = validateRevision(body.lines, doc.initial_lines ?? [], Math.max(current.revision_month_start, new Date().getMonth() + 1))
		if (error) return invalid(error)
		doc.description = body.description.trim()
		doc.lines = (doc.initial_lines ?? []).map((line, i) => ({ ...line, months: [...body.lines[i]!.months] }))
		doc.total = sumDocument(doc.lines)
		doc.revision_month_start = Math.max(current.revision_month_start, new Date().getMonth() + 1)
		append(doc, 'Diperbarui', doc.status)
		return [200, { data: out(doc, true) }]
	})
	const handleAction = (revision: boolean) => (config: import('axios').AxiosRequestConfig) => {
		const rows = revision ? db.budgetRevision : db.budget
		const doc = rows.find((b) => b.id === idFrom(config.url) && b.company_id === companyIdOf(config))
		if (!doc) return missing()
		const body = JSON.parse(config.data) as { action: BudgetAction; note?: string }
		const error = action(doc, body.action, body.note ?? '', revision)
		return error ? invalid(error) : ([200, { data: out(doc, revision) }] as [number, unknown])
	}
	mock.onPost(/\/budgeting\/budgets\/\d+\/actions$/).reply(handleAction(false))
	mock.onPost(/\/budgeting\/revisions\/\d+\/actions$/).reply(handleAction(true))
	mock.onGet('/budgeting/period').reply((config) => {
		const cid = companyIdOf(config)
		return cid ? [200, { data: period(cid) }] : invalid('Pilih perusahaan terlebih dahulu.')
	})
	mock.onPut('/budgeting/period').reply((config) => {
		const cid = companyIdOf(config)
		if (!cid) return invalid('Pilih perusahaan terlebih dahulu.')
		const body = JSON.parse(config.data) as { start_date: string; end_date: string; is_active: boolean }
		const existing = db.budgetPeriod[cid]
		if (
			!validDate(body.start_date) ||
			!validDate(body.end_date) ||
			Number(body.start_date.slice(0, 4)) !== yearNow() ||
			Number(body.end_date.slice(0, 4)) !== yearNow() ||
			body.end_date < body.start_date ||
			(body.start_date < today() && body.start_date !== existing?.start_date)
		)
			return invalid('Periksa tanggal periode: awal tidak boleh sebelum hari ini dan akhir tidak boleh sebelum awal, keduanya pada tahun berjalan.')
		db.budgetPeriod[cid] = {
			year: yearNow(),
			start_date: body.start_date,
			end_date: body.end_date,
			is_active: !!body.is_active,
			is_open: false,
			revision_month_start: Number(body.start_date.slice(5, 7))
		}
		return [200, { data: period(cid) }]
	})
	mock.onGet('/budgeting/ytd').reply((config) => {
		const cid = companyIdOf(config)
		if (!cid) return invalid('Pilih perusahaan terlebih dahulu.')
		const selection = config.params?.department_id
		const ids = selection === 'all' ? db.department.filter((d) => d.company_id === cid && !d.deleted_at).map((d) => d.id) : [Number(selection)]
		if (selection !== 'all' && !db.department.some((d) => d.company_id === cid && !d.deleted_at && d.id === ids[0]))
			return invalid('Pilih departemen yang tersedia.')
		const values = Object.fromEntries(
			accounts(cid).map((a) => [a.code, ids.reduce((sum, id) => sum + demoActual(cid, id, a.code, yearNow()).reduce((x, y) => x + y, 0), 0)])
		)
		return [200, { data: { year: yearNow(), through_month: new Date().getMonth(), values } }]
	})
	mock.onGet('/budgeting/realization').reply((config) => {
		const cid = companyIdOf(config)
		if (!cid) return invalid('Pilih perusahaan terlebih dahulu.')
		const p = config.params ?? {}
		const year = Number(p.year) || yearNow()
		const dept = p.department_id === 'all' ? null : Number(p.department_id)
		if (dept !== null && dept !== 0 && !db.department.some((d) => d.id === dept && d.company_id === cid && !d.deleted_at))
			return invalid('Pilih departemen yang tersedia.')
		const budgets = db.budget.filter(
			(b) => b.company_id === cid && b.year === year && b.status === 'Disetujui' && (dept === null || b.department_id === dept)
		)
		const grouped = new Map<string, RealizationRow>()
		for (const b of budgets) {
			const effective = db.budgetRevision.find((r) => r.company_id === cid && r.budget_id === b.id && r.status === 'Disetujui') ?? b
			for (const line of effective.lines) {
				let row = grouped.get(line.account_code)
				if (!row) {
					row = {
						group: line.prefix === 'CPX' ? 'CAPEX' : 'OPEX',
						account_code: line.account_code,
						account_name: line.account_name,
						section: line.section,
						sign: line.sign,
						budget: Array(12).fill(0),
						actual: Array(12).fill(0)
					}
					grouped.set(line.account_code, row)
				}
				line.months.forEach((v, i) => {
					row!.budget[i] = (row!.budget[i] ?? 0) + v
				})
			}
		}
		// The "no department" bucket never has a budget document, so it always lists accounts that only have realization.
		if (String(p.show_unbudgeted) === '1' || dept === 0) {
			for (const a of accounts(cid)) {
				const ids = dept === null ? db.department.filter((d) => d.company_id === cid && !d.deleted_at).map((d) => d.id) : [dept]
				if (!grouped.has(a.code) && ids.some((id) => demoActual(cid, id, a.code, year).some((v) => v !== 0)))
					grouped.set(a.code, {
						group: a.prefix === 'CPX' ? 'CAPEX' : 'OPEX',
						account_code: a.code,
						account_name: a.name,
						section: a.section,
						sign: a.sign,
						budget: Array(12).fill(0),
						actual: Array(12).fill(0)
					})
			}
		}
		for (const row of grouped.values()) {
			const departmentIds = dept === null ? db.department.filter((d) => d.company_id === cid && !d.deleted_at).map((d) => d.id) : [dept]
			for (const d of departmentIds)
				demoActual(cid, d, row.account_code, year).forEach((v, i) => {
					row.actual[i] = (row.actual[i] ?? 0) + v
				})
		}
		const rows = [...grouped.values()].filter((row) => row.budget.some((v) => v !== 0) || row.actual.some((v) => v !== 0))
		return [200, { data: { rows, year } }]
	})
	mock.onPost('/budgeting/realization/recalculate').reply((config) => {
		if (!companyIdOf(config)) return invalid('Pilih perusahaan terlebih dahulu.')
		const body = JSON.parse(config.data) as { year: number; month: number }
		if (!Number.isInteger(body.year) || body.year < 2000 || body.year > 2100 || !Number.isInteger(body.month) || body.month < 1 || body.month > 12)
			return invalid('Pilih bulan dan tahun acuan yang valid.')
		// Reference month plus the two months before it, wrapping into the previous year.
		const recalculated = [2, 1, 0].map((back) => {
			const index = body.year * 12 + body.month - 1 - back
			return { year: Math.floor(index / 12), month: (index % 12) + 1 }
		})
		return [200, { data: { recalculated } }]
	})
}
