import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import type { Journal, JournalLine, JournalStatus } from '@/utils/types'

type JournalRequest = Omit<Journal, 'id' | 'number' | 'total' | 'status' | 'rejection_reason' | 'approved_by' | 'approved_at'> & {
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
	if (!body.attachment) return 'Lampiran wajib diunggah'
	if (!Array.isArray(body.lines) || body.lines.length < 1) return 'Minimal satu detail jurnal'
	for (const line of body.lines) {
		const account = db.account.find((a) => a.id === Number(line.account_id) && !a.deleted_at)
		if (!account) return 'Akun perkiraan tidak valid'
		if (Number(line.debit) < 0 || Number(line.credit) < 0 || (Number(line.debit) > 0 && Number(line.credit) > 0))
			return 'Debit dan kredit tidak valid'
		if (account.type === 'cash_bank' && !line.cash_flow) return 'Arus kas wajib untuk akun kas/bank'
	}
	const debit = body.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
	const credit = body.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0)
	return debit > 0 && debit === credit ? null : 'Total debit dan kredit harus sama dan lebih dari nol'
}

// Contract: docs/journal/
export function registerJournal(mock: MockAdapter) {
	mock.onGet('/journal').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = db.journal
		if (p.q) rows = rows.filter((j) => `${j.number} ${j.voucher} ${j.description}`.toLowerCase().includes(String(p.q).toLowerCase()))
		if (p.status) rows = rows.filter((j) => j.status === p.status)
		if (p.date_from) rows = rows.filter((j) => j.date >= String(p.date_from))
		if (p.date_to) rows = rows.filter((j) => j.date <= String(p.date_to))
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [
			200,
			paginate(
				rows.map((row) => ({ ...row, lines: row.lines.map(lineOf) })),
				p
			)
		]
	})

	mock.onGet(/\/journal\/\d+$/).reply((config) => {
		const journal = db.journal.find((row) => row.id === idOf(config.url))
		return journal ? [200, { data: { ...journal, lines: journal.lines.map(lineOf) } }] : [404, { message: 'Jurnal tidak ditemukan' }]
	})

	mock.onPost('/journal').reply((config) => {
		const body = JSON.parse(config.data) as JournalRequest
		const validationError = validateRequest(body)
		if (validationError) return [422, { message: validationError, errors: { lines: [validationError] } }]

		const total = body.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
		const seqNo = String(db.journal.length + 1).padStart(3, '0')
		const row: Journal = {
			id: nextId(db.journal),
			number: String(body.number ?? '').trim() || `JU-MOCK-${seqNo}`,
			date: body.date,
			voucher: body.voucher.trim(),
			description: body.description.trim(),
			attachment: body.attachment,
			status: 'submitted',
			rejection_reason: null,
			approved_by: null,
			approved_at: null,
			lines: body.lines.map(lineOf),
			total
		}
		db.journal.unshift(row)
		return [201, { data: row, message: 'Jurnal diajukan' }]
	})

	mock.onPut(/\/journal\/\d+$/).reply((config) => {
		const journal = db.journal.find((row) => row.id === idOf(config.url))
		if (!journal) return [404, { message: 'Jurnal tidak ditemukan' }]
		if (journal.status !== 'submitted') return [422, { message: 'Hanya jurnal submitted yang dapat diedit' }]
		const body = JSON.parse(config.data) as JournalRequest
		const validationError = validateRequest(body)
		if (validationError) return [422, { message: validationError, errors: { lines: [validationError] } }]

		journal.number = String(body.number ?? '').trim() || journal.number
		journal.date = body.date
		journal.voucher = body.voucher.trim()
		journal.description = body.description.trim()
		journal.attachment = body.attachment
		journal.lines = body.lines.map(lineOf)
		journal.total = journal.lines.reduce((sum, line) => sum + line.debit, 0)
		journal.rejection_reason = null
		return [200, { data: { ...journal, lines: journal.lines.map(lineOf) }, message: 'Jurnal diperbarui' }]
	})

	mock.onDelete(/\/journal\/\d+$/).reply((config) => {
		const index = db.journal.findIndex((row) => row.id === idOf(config.url))
		if (index === -1) return [404, { message: 'Jurnal tidak ditemukan' }]
		if (db.journal[index].status !== 'submitted') return [422, { message: 'Hanya jurnal submitted yang dapat dihapus' }]
		db.journal.splice(index, 1)
		return [200, { message: 'Jurnal dihapus' }]
	})

	mock.onPatch(/\/journal\/\d+\/status$/).reply((config) => {
		const body = JSON.parse(config.data) as { status?: JournalStatus; date?: string }
		const journal = db.journal.find((row) => row.id === statusIdOf(config.url))
		if (!journal) return [404, { message: 'Jurnal tidak ditemukan' }]
		if (!validStatus(body.status)) return [422, { message: 'Status jurnal tidak valid' }]

		const transitions: Record<JournalStatus, JournalStatus[]> = {
			submitted: ['approved', 'rejected'],
			approved: [],
			rejected: ['submitted']
		}
		if (!transitions[journal.status].includes(body.status)) return [422, { message: 'Perubahan status jurnal tidak valid' }]

		if (body.status === 'approved') {
			if (body.date !== undefined && !isDate(body.date)) return [422, { message: 'Tanggal jurnal tidak valid' }]
			if (body.date) journal.date = body.date
			journal.approved_by = currentUserName()
			journal.approved_at = new Date().toISOString()
		}
		if (body.status === 'submitted') {
			journal.approved_by = null
			journal.approved_at = null
		}

		journal.status = body.status
		journal.rejection_reason = body.status === 'rejected' ? 'Jurnal ditolak, silakan periksa kembali detailnya.' : null
		return [
			200,
			{
				data: { ...journal, lines: journal.lines.map(lineOf) },
				message: body.status === 'approved' ? 'Jurnal disetujui' : body.status === 'rejected' ? 'Jurnal ditolak' : 'Jurnal diajukan'
			}
		]
	})
}
