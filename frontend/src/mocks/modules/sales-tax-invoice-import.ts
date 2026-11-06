import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { recordHistory } from '../history'
import type { SalesInvoiceTaxInvoice, SalesTaxInvoiceImportPreview, SalesTaxInvoiceImportSource, TaxInvoiceImportRow } from '@/utils/types'

// Contract: docs/sales-tax-invoice-import/. A copy of the pembelian mock (separate module by owner decision). The mock cannot parse a real
// spreadsheet, so the preview is built from the documents that exist in db (ignoring the file's contents) plus a few canned problem rows.
const MAX_SIZE = 10 * 1024 * 1024
const EXTENSIONS = ['xlsx', 'xls', 'csv']
const FIRST_DATA_ROW = 6 // assumed export layout (same as pembelian): data starts at row 6
const MAX_NUMBER_LENGTH = 25 // same rule as PUT /sales-invoice/:id/tax-invoice
const previews = new Map<string, SalesTaxInvoiceImportPreview>()

const invalid = (message: string, field: string) => ({ message: 'Validasi gagal', errors: { [field]: [message] } })

// Minimal shape shared by invoice and return rows (both carry a faktur pajak); db.salesReturn is owned by the Retur Penjualan module.
interface TaxDocument {
	id: number
	number: string
	date: string
	customer_id?: number
	sales_invoice_id?: number // a sales-return row has no customer of its own: it comes from the source invoice
	customer_name?: string
	pkp_active?: boolean
	approval_status?: string
	approved_at?: string | null
	tax_invoice?: SalesInvoiceTaxInvoice | null
}
const documents = (source: SalesTaxInvoiceImportSource): TaxDocument[] => (source === 'sales_invoice' ? db.salesInvoice : db.salesReturn)
const history = (source: SalesTaxInvoiceImportSource) => (source === 'sales_invoice' ? 'sales-invoice' : 'sales-return')
const customerName = (doc: TaxDocument) => {
	const customerId = doc.customer_id ?? db.salesInvoice.find((item) => item.id === doc.sales_invoice_id)?.customer_id
	return doc.customer_name ?? db.customer.find((item) => item.id === customerId)?.name ?? '–'
}
const eligible = (doc: TaxDocument) => doc.approval_status === 'approved' && doc.pkp_active === true
const taken = (source: SalesTaxInvoiceImportSource, number: string, exceptId: number) =>
	documents(source).some((item) => item.id !== exceptId && item.tax_invoice?.number.toLowerCase() === number.toLowerCase())

function buildRows(source: SalesTaxInvoiceImportSource): TaxInvoiceImportRow[] {
	const prefix = source === 'sales_invoice' ? '010.000-26.' : '011.000-26.'
	const used = new Set<string>()
	const rows: TaxInvoiceImportRow[] = documents(source)
		.filter(eligible)
		.map((doc) => {
			const number = `${prefix}${String(9000 + doc.id).padStart(8, '0')}`
			const row = {
				row: 0,
				reference: doc.number,
				name: customerName(doc),
				number,
				date: (doc.approved_at ?? doc.date).slice(0, 10)
			}
			if (taken(source, number, doc.id) || used.has(number.toLowerCase()))
				return { ...row, status: 'error' as const, message: 'Nomor seri sudah dipakai dokumen lain' }
			used.add(number.toLowerCase())
			return { ...row, status: doc.tax_invoice ? ('to_be_replaced' as const) : ('matched' as const) }
		})
	const first = documents(source).find(eligible)
	const ineligible = documents(source).find((doc) => !eligible(doc))
	const takenNumber = documents(source).find((doc) => doc.tax_invoice)?.tax_invoice?.number
	rows.push(
		{
			row: 0,
			reference: source === 'sales_invoice' ? 'RIN.INV260930/999' : 'RET.RIN260930/999',
			name: 'Customer tidak dikenal',
			number: '010.000-26.00009999',
			date: '2026-09-20',
			status: 'unmatched',
			message: 'Referensi tidak ditemukan'
		},
		{
			row: 0,
			reference: first?.number ?? '–',
			name: first ? customerName(first) : '–',
			number: '',
			date: '',
			status: 'skipped',
			message: 'Nomor seri dan tanggal kosong'
		},
		{
			row: 0,
			reference: first?.number ?? '–',
			name: first ? customerName(first) : '–',
			number: 'ABC-123',
			date: '2026-09-20',
			status: 'error',
			message: 'Format nomor seri faktur pajak tidak valid'
		}
	)
	if (ineligible)
		rows.push({
			row: 0,
			reference: ineligible.number,
			name: customerName(ineligible),
			number: '010.000-26.00008888',
			date: '2026-09-20',
			status: 'unmatched',
			message: ineligible.approval_status !== 'approved' ? 'Dokumen belum approved' : 'Dokumen non-PKP'
		})
	if (takenNumber && first)
		rows.push({
			row: 0,
			reference: first.number,
			name: customerName(first),
			number: takenNumber,
			date: '2026-09-20',
			status: 'error',
			message: 'Nomor seri sudah dipakai dokumen lain'
		})
	return rows.map((row, index) => ({ ...row, row: FIRST_DATA_ROW + index }))
}

export function registerSalesTaxInvoiceImport(mock: MockAdapter) {
	mock.onPost('/sales-tax-invoice-import/preview').reply((config) => {
		const form = config.data as FormData
		const source = String(form.get('source')) as SalesTaxInvoiceImportSource
		const file = form.get('file')
		if (source !== 'sales_invoice' && source !== 'sales_return') return [422, invalid('Jenis import tidak valid', 'source')]
		if (!(file instanceof File)) return [422, invalid('File wajib dipilih', 'file')]
		if (!EXTENSIONS.includes(file.name.split('.').at(-1)?.toLowerCase() ?? ''))
			return [422, invalid('File harus berformat XLSX, XLS, atau CSV', 'file')]
		if (file.size > MAX_SIZE) return [422, invalid('Ukuran file maksimal 10 MB', 'file')]
		const rows = buildRows(source)
		const count = (status: TaxInvoiceImportRow['status']) => rows.filter((row) => row.status === status).length
		const preview: SalesTaxInvoiceImportPreview = {
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

	mock.onPost('/sales-tax-invoice-import').reply((config) => {
		const { token } = JSON.parse(config.data) as { token?: string }
		const preview = token ? previews.get(token) : undefined
		if (!preview) return [422, { message: 'Preview sudah kedaluwarsa, upload ulang file' }]
		let imported = 0
		for (const row of preview.rows) {
			if (row.status !== 'matched' && row.status !== 'to_be_replaced') continue
			const doc = documents(preview.source).find((item) => item.number === row.reference)
			// re-check server-side: the document may have changed since the preview
			if (!doc || !eligible(doc) || row.number.length > MAX_NUMBER_LENGTH || taken(preview.source, row.number, doc.id)) continue
			doc.tax_invoice = { number: row.number, date: row.date, file: null }
			recordHistory(history(preview.source), doc.id, { title: 'Faktur Pajak Diimpor', kind: 'info', summary: row.number })
			imported++
		}
		previews.delete(preview.token)
		return [200, { data: { imported, skipped: preview.rows.length - imported }, message: `${imported} faktur pajak berhasil diimpor` }]
	})
}
