import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { companyIdOf, nextId, paginate, sortBy, summarize, type ListParams } from '../lib'
import {
	diffAccountLines,
	diffFields,
	fmtCount,
	fmtDate,
	purgeHistory,
	recordHistory,
	recordStatusChange,
	recordUpdate,
	registerHistoryRoute,
	type FieldSpec
} from '../history'
import { closedReply, isPeriodClosed, closedDateReply } from './posting'
import type { Journal, JournalLine, JournalStatus } from '@/utils/types'

type JournalRequest = Omit<
	Journal,
	'id' | 'number' | 'total' | 'status' | 'rejection_reason' | 'approved_by' | 'approved_at' | 'created_by' | 'created_at'
> & {
	number?: string
}

const idOf = (url?: string) => Number(url?.split('/').at(-1))
const statusIdOf = (url?: string) => Number(url?.split('/').at(-2))
const validStatus = (value: unknown): value is JournalStatus => ['submitted', 'approved', 'rejected'].includes(String(value))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))

// Prototype: the approver is whoever is logged in on this browser.
function currentUserName(): string {
	try {
		return JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin'
	} catch {
		return 'Admin'
	}
}

function lineOf(line: JournalLine): JournalLine {
	const account = db.account.find((a) => a.id === Number(line.account_id) && !a.deleted_at)
	const department = db.department.find((d) => d.id === Number(line.department_id) && !d.deleted_at)
	const cashFlow = db.cashFlow.find((flow) => flow.code === line.cash_flow)
	return {
		account_id: Number(line.account_id),
		account_code: account?.code,
		account_name: account?.name,
		account_type: account?.type,
		department_id: line.department_id ? Number(line.department_id) : null,
		department_code: department?.code,
		department_name: department?.name,
		cash_flow: line.cash_flow ?? null,
		cash_flow_name: cashFlow?.name,
		detail_description: String(line.detail_description ?? '').trim(),
		debit: Number(line.debit) || 0,
		credit: Number(line.credit) || 0
	}
}

function validateRequest(body: JournalRequest): string | null {
	if (!String(body.voucher ?? '').trim()) return 'Voucher wajib diisi'
	if (!String(body.description ?? '').trim()) return 'Keterangan wajib diisi'
	if (!Array.isArray(body.attachments) || !body.attachments.length) return 'Lampiran wajib diunggah'
	if (body.attachments.length > 5) return 'Maksimal 5 lampiran'
	if (!Array.isArray(body.lines) || body.lines.length < 1) return 'Minimal satu detail jurnal'
	for (const line of body.lines) {
		const account = db.account.find((a) => a.id === Number(line.account_id) && !a.deleted_at)
		if (!account) return 'Akun perkiraan tidak valid'
		if (Number(line.debit) < 0 || Number(line.credit) < 0 || (Number(line.debit) > 0 && Number(line.credit) > 0))
			return 'Debit dan kredit tidak valid'
		if (!db.department.some((d) => d.id === Number(line.department_id) && !d.deleted_at)) return 'Departemen wajib dipilih'
		if (account.type === 'cash_bank' && !line.cash_flow) return 'Arus kas wajib untuk akun kas/bank'
	}
	const debit = body.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
	const credit = body.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0)
	return debit > 0 && debit === credit ? null : 'Total debit dan kredit harus sama dan lebih dari nol'
}

// `locked` = date falls in a closed period (record is frozen).
const withLock = (row: Journal, companyId: number | null): Journal => ({
	...row,
	lines: row.lines.map(lineOf),
	locked: isPeriodClosed(companyId, row.date)
})

const FIELDS: FieldSpec<Journal>[] = [
	{ key: 'date', label: 'Tanggal', format: fmtDate },
	{ key: 'voucher', label: 'Voucher' },
	{ key: 'description', label: 'Keterangan' },
	{ key: 'attachments', label: 'Lampiran', format: fmtCount('file') }
]

// Contract: docs/journal/
export function registerJournal(mock: MockAdapter) {
	registerHistoryRoute(mock, 'journal', (id) => db.journal.some((row) => row.id === id), 'Jurnal tidak ditemukan')

	mock.onGet('/journal').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = db.journal
		if (p.q) rows = rows.filter((j) => `${j.number} ${j.voucher} ${j.description}`.toLowerCase().includes(String(p.q).toLowerCase()))
		if (p.date_from) rows = rows.filter((j) => j.date >= String(p.date_from))
		if (p.date_to) rows = rows.filter((j) => j.date <= String(p.date_to))
		// KPI tiles: honour search + dates, ignore the status filter below (docs/conventions.md).
		const summary = summarize(
			rows,
			{ pending: (j) => j.status === 'submitted', approved: (j) => j.status === 'approved', rejected: (j) => j.status === 'rejected' },
			(j) => j.total,
			['pending', 'approved']
		)
		if (p.status) rows = rows.filter((j) => j.status === p.status)
		rows = sortBy(rows, p.sort_by, p.sort_order)
		const companyId = companyIdOf(config)
		const page = paginate(
			rows.map((row) => withLock(row, companyId)),
			p
		)
		return [200, { data: page.data, meta: { ...page.meta, summary } }]
	})

	mock.onGet(/\/journal\/\d+$/).reply((config) => {
		const journal = db.journal.find((row) => row.id === idOf(config.url))
		return journal ? [200, { data: withLock(journal, companyIdOf(config)) }] : [404, { message: 'Jurnal tidak ditemukan' }]
	})

	mock.onPost('/journal').reply((config) => {
		const body = JSON.parse(config.data) as JournalRequest
		const closedDate = closedDateReply(config, body.date)
		if (closedDate) return closedDate
		const validationError = validateRequest(body)
		if (validationError) return [422, { message: validationError, errors: { lines: [validationError] } }]

		const total = body.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
		const seqNo = String(db.journal.length + 1).padStart(3, '0')
		const row: Journal = {
			id: nextId(db.journal),
			number: String(body.number ?? '').trim() || `JU-MOCK-${seqNo}`,
			date: body.date,
			voucher: body.voucher.trim(),
			created_by: currentUserName(),
			created_at: new Date().toISOString(),
			description: body.description.trim(),
			attachments: body.attachments,
			status: 'submitted',
			rejection_reason: null,
			approved_by: null,
			approved_at: null,
			lines: body.lines.map(lineOf),
			total
		}
		db.journal.unshift(row)
		recordHistory('journal', row.id, { title: 'Dibuat', kind: 'created' })
		return [201, { data: row, message: 'Jurnal diajukan' }]
	})

	mock.onPut(/\/journal\/\d+$/).reply((config) => {
		const journal = db.journal.find((row) => row.id === idOf(config.url))
		if (!journal) return [404, { message: 'Jurnal tidak ditemukan' }]
		if (journal.status !== 'submitted') return [422, { message: 'Hanya jurnal submitted yang dapat diedit' }]
		const closed = closedReply(config, journal.date, 'jurnal tidak bisa diedit')
		if (closed) return closed
		const body = JSON.parse(config.data) as JournalRequest
		const closedDate = closedDateReply(config, body.date)
		if (closedDate) return closedDate
		const validationError = validateRequest(body)
		if (validationError) return [422, { message: validationError, errors: { lines: [validationError] } }]

		const before = { ...journal, lines: journal.lines.map(lineOf) }
		journal.number = String(body.number ?? '').trim() || journal.number
		journal.date = body.date
		journal.voucher = body.voucher.trim()
		journal.description = body.description.trim()
		journal.attachments = body.attachments
		journal.lines = body.lines.map(lineOf)
		journal.total = journal.lines.reduce((sum, line) => sum + line.debit, 0)
		journal.rejection_reason = null
		recordUpdate('journal', journal.id, [...diffFields(before, journal, FIELDS), ...diffAccountLines(before.lines, journal.lines)])
		return [200, { data: { ...journal, lines: journal.lines.map(lineOf) }, message: 'Jurnal diperbarui' }]
	})

	mock.onDelete(/\/journal\/\d+$/).reply((config) => {
		const index = db.journal.findIndex((row) => row.id === idOf(config.url))
		if (index === -1) return [404, { message: 'Jurnal tidak ditemukan' }]
		if (db.journal[index].status !== 'submitted') return [422, { message: 'Hanya jurnal submitted yang dapat dihapus' }]
		const closed = closedReply(config, db.journal[index].date, 'jurnal tidak bisa dihapus')
		if (closed) return closed
		const [removed] = db.journal.splice(index, 1)
		purgeHistory('journal', removed.id)
		return [200, { message: 'Jurnal dihapus' }]
	})

	mock.onPatch(/\/journal\/\d+\/status$/).reply((config) => {
		const body = JSON.parse(config.data) as { status?: JournalStatus; date?: string }
		const journal = db.journal.find((row) => row.id === statusIdOf(config.url))
		if (!journal) return [404, { message: 'Jurnal tidak ditemukan' }]
		if (!validStatus(body.status)) return [422, { message: 'Status jurnal tidak valid' }]

		const transitions: Record<JournalStatus, JournalStatus[]> = {
			submitted: ['approved', 'rejected'],
			approved: ['submitted'],
			rejected: ['submitted']
		}
		if (!transitions[journal.status].includes(body.status)) return [422, { message: 'Perubahan status jurnal tidak valid' }]
		// A journal in a closed period is frozen: no approve / reject / cancel approval / resubmit.
		const closed = closedReply(config, journal.date, 'status jurnal tidak bisa diubah')
		if (closed) return closed

		if (body.status === 'approved') {
			if (body.date !== undefined && !isDate(body.date)) return [422, { message: 'Tanggal jurnal tidak valid' }]
			const closedDate = closedDateReply(config, body.date)
			if (closedDate) return closedDate
			if (body.date) journal.date = body.date
			journal.approved_by = currentUserName()
			journal.approved_at = new Date().toISOString()
		}
		if (body.status === 'submitted') {
			journal.approved_by = null
			journal.approved_at = null
		}

		const wasApproved = journal.status === 'approved'
		journal.status = body.status
		journal.rejection_reason = body.status === 'rejected' ? 'Jurnal ditolak, silakan periksa kembali detailnya.' : null
		if (wasApproved) recordHistory('journal', journal.id, { title: 'Approval Dibatalkan', kind: 'info' })
		else recordStatusChange('journal', journal.id, body.status, journal.rejection_reason)
		return [
			200,
			{
				data: withLock(journal, companyIdOf(config)),
				message: wasApproved
					? 'Approval dibatalkan'
					: body.status === 'approved'
						? 'Jurnal disetujui'
						: body.status === 'rejected'
							? 'Jurnal ditolak'
							: 'Jurnal diajukan'
			}
		]
	})
}
