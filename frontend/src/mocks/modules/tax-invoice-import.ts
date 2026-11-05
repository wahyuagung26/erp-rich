import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { recordHistory } from '../history'
import { resolve as resolveInvoice } from './purchase-invoice'
import { resolve as resolveReturn } from './purchase-return'
import type { TaxInvoiceImportPreview, TaxInvoiceImportRow, TaxInvoiceImportSource } from '@/utils/types'

// Contract: docs/tax-invoice-import/. The mock cannot parse a real spreadsheet, so the preview is built from the
// documents that exist in db (ignoring the file's contents) plus a few canned problem rows — enough to exercise
// every status in the UI. The backend replaces this with a real parse of the exported Laporan Pajak file.
const MAX_SIZE = 10 * 1024 * 1024
const EXTENSIONS = ['xlsx', 'xls', 'csv']
const FIRST_DATA_ROW = 6 // legacy export layout: data starts at row 6
const previews = new Map<string, TaxInvoiceImportPreview>()

const invalid = (message: string, field: string) => ({ message: 'Validasi gagal', errors: { [field]: [message] } })

function buildRows(source: TaxInvoiceImportSource): TaxInvoiceImportRow[] {
	const isInvoice = source === 'purchase_invoice'
	const documents = (isInvoice ? db.purchaseInvoice.map(resolveInvoice) : db.purchaseReturn.map(resolveReturn))
		.filter((item) => item.approval_status === 'approved' && item.pkp_active)
		.map((item) => ({
			id: item.id,
			reference: item.number,
			name: item.supplier_name ?? '–',
			existing: item.tax_invoice,
			date: (item.approved_at ?? item.date).slice(0, 10),
			prefix: isInvoice ? '010.000-26.' : '011.000-26.'
		}))
	const rows: TaxInvoiceImportRow[] = documents.map((doc) => ({
		row: 0,
		reference: doc.reference,
		name: doc.name,
		number: `${doc.prefix}${String(9000 + doc.id).padStart(8, '0')}`,
		date: doc.date,
		status: doc.existing ? 'to_be_replaced' : 'matched'
	}))
	rows.push(
		{
			row: 0,
			reference: source === 'purchase_invoice' ? 'BL-RICH/9999/09/2026' : 'RB-RICH/9999/09/2026',
			name: 'Supplier tidak dikenal',
			number: '010.000-26.00009999',
			date: '2026-09-20',
			status: 'unmatched',
			message: 'Referensi tidak ditemukan'
		},
		{
			row: 0,
			reference: documents[0]?.reference ?? '–',
			name: documents[0]?.name ?? '–',
			number: '',
			date: '',
			status: 'skipped',
			message: 'Nomor seri dan tanggal kosong'
		},
		{
			row: 0,
			reference: documents[0]?.reference ?? '–',
			name: documents[0]?.name ?? '–',
			number: 'ABC-123',
			date: '2026-09-20',
			status: 'error',
			message: 'Format nomor seri faktur pajak tidak valid'
		}
	)
	return rows.map((row, index) => ({ ...row, row: FIRST_DATA_ROW + index }))
}

export function registerTaxInvoiceImport(mock: MockAdapter) {
	mock.onPost('/tax-invoice-import/preview').reply((config) => {
		const form = config.data as FormData
		const source = String(form.get('source')) as TaxInvoiceImportSource
		const file = form.get('file')
		if (source !== 'purchase_invoice' && source !== 'purchase_return') return [422, invalid('Jenis import tidak valid', 'source')]
		if (!(file instanceof File)) return [422, invalid('File wajib dipilih', 'file')]
		if (!EXTENSIONS.includes(file.name.split('.').at(-1)?.toLowerCase() ?? ''))
			return [422, invalid('File harus berformat XLSX, XLS, atau CSV', 'file')]
		if (file.size > MAX_SIZE) return [422, invalid('Ukuran file maksimal 10 MB', 'file')]
		const rows = buildRows(source)
		const count = (status: TaxInvoiceImportRow['status']) => rows.filter((row) => row.status === status).length
		const preview: TaxInvoiceImportPreview = {
			token: crypto.randomUUID(),
			source,
			file_name: file.name,
			summary: {
				total: rows.length,
				matched: count('matched'),
				to_be_replaced: count('to_be_replaced'),
				unmatched: count('unmatched'),
				skipped: count('skipped'),
				error: count('error')
			},
			rows
		}
		previews.set(preview.token, preview)
		return [200, { data: preview }]
	})

	mock.onPost('/tax-invoice-import').reply((config) => {
		const { token } = JSON.parse(config.data) as { token?: string }
		const preview = token ? previews.get(token) : undefined
		if (!preview) return [422, { message: 'Preview sudah kedaluwarsa, upload ulang file' }]
		let imported = 0
		for (const row of preview.rows) {
			if (row.status !== 'matched' && row.status !== 'to_be_replaced') continue
			const doc = (preview.source === 'purchase_invoice' ? db.purchaseInvoice : db.purchaseReturn).find((item) => item.number === row.reference)
			if (!doc) continue
			doc.tax_invoice = { number: row.number, date: row.date, file: null }
			recordHistory(preview.source === 'purchase_invoice' ? 'purchase-invoice' : 'purchase-return', doc.id, {
				title: 'Faktur Pajak Diimpor',
				kind: 'info',
				summary: row.number
			})
			imported++
		}
		previews.delete(preview.token)
		return [200, { data: { imported, skipped: preview.rows.length - imported }, message: `${imported} faktur pajak berhasil diimpor` }]
	})
}
