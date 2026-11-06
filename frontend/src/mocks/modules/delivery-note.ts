import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { deliveryNoteNumber } from '../numbering'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import { diffFields, diffLines, fmtDate, purgeHistory, recordHistory, recordUpdate, registerHistoryRoute, userName, type FieldSpec } from '../history'
import { findSalesInvoice, unapproveGuards } from './sales-invoice'
import type { DeliveryNoteRow } from '../fixtures/delivery-note'
import type { DeliveryNote, DeliveryNoteLine, DeliveryNoteRequest, SalesInvoice } from '@/utils/types'

const NOT_FOUND = 'Surat jalan tidak ditemukan'
const idOf = (url?: string) => Number(url?.split('/').at(-1))
const parentIdOf = (url?: string) => Number(url?.split('/').at(-2))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))
const today = () => new Date().toISOString().slice(0, 10)

const noteOfInvoice = (invoiceId: number, excludeId?: number) =>
	db.deliveryNote.find((item) => item.sales_invoice_id === invoiceId && item.id !== excludeId)

// Documentary only, so it must never be a reason for the invoice to disappear: while an SJ exists the invoice stays approved.
unapproveGuards.push((invoiceId) => {
	const note = noteOfInvoice(invoiceId)
	return note ? `Invoice sudah memiliki surat jalan ${note.number}, hapus surat jalan terlebih dahulu` : null
})

// Every invoice line, `quantity` taken from the stored SJ line (0 when absent); the invoice's lines are frozen while it is approved.
function resolveLines(stored: DeliveryNoteRow['lines'], invoice?: SalesInvoice): DeliveryNoteLine[] {
	const source = invoice ? invoice.lines.map((line) => ({ product_id: line.product_id, invoice_quantity: line.quantity })) : []
	return source.map((line) => {
		const product = db.product.find((item) => item.id === line.product_id && !item.deleted_at)
		return {
			product_id: line.product_id,
			product_code: product?.code,
			product_name: product?.name,
			brand_name: product?.brand_name,
			unit_name: product?.unit_name,
			invoice_quantity: line.invoice_quantity,
			quantity: stored.find((item) => item.product_id === line.product_id)?.quantity ?? 0
		}
	})
}

function resolve(row: DeliveryNoteRow): DeliveryNote {
	const invoice = findSalesInvoice(row.sales_invoice_id)
	const lines = resolveLines(row.lines, invoice)
	return {
		...row,
		sales_invoice_number: invoice?.number,
		sales_invoice_date: invoice?.date,
		customer_id: invoice?.customer_id,
		customer_code: invoice?.customer_code,
		customer_name: invoice?.customer_name,
		department_code: invoice?.department_code,
		department_name: invoice?.department_name,
		total_quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
		lines
	}
}

function invalid(message: string, field?: string) {
	return { message: 'Validasi gagal', ...(field ? { errors: { [field]: [message] } } : {}) }
}

type Invalid = ReturnType<typeof invalid>

const textTooLong = (value: unknown, max: number) => String(value ?? '').trim().length > max

function validate(body: DeliveryNoteRequest, invoice: SalesInvoice): Invalid | null {
	if (!isDate(body.date)) return invalid('Tanggal wajib diisi', 'date')
	if (body.date > today()) return invalid('Tanggal tidak boleh melebihi hari ini', 'date')
	if (!String(body.delivery_address ?? '').trim()) return invalid('Alamat pengiriman wajib diisi', 'delivery_address')
	if (textTooLong(body.delivery_address, 250)) return invalid('Alamat pengiriman maksimal 250 karakter', 'delivery_address')
	if (textTooLong(body.recipient, 100)) return invalid('Nama penerima maksimal 100 karakter', 'recipient')
	if (textTooLong(body.driver, 100)) return invalid('Nama driver maksimal 100 karakter', 'driver')
	if (textTooLong(body.vehicle, 50)) return invalid('No. kendaraan maksimal 50 karakter', 'vehicle')
	if (textTooLong(body.description, 250)) return invalid('Keterangan maksimal 250 karakter', 'description')
	if (!Array.isArray(body.lines) || body.lines.length === 0) return invalid('Minimal satu produk harus dikirim', 'lines')
	const seen = new Set<number>()
	for (const line of body.lines) {
		const productId = Number(line.product_id)
		const quantity = Number(line.quantity)
		const source = invoice.lines.find((item) => item.product_id === productId)
		if (!source) return invalid('Produk tidak ada di invoice', 'lines')
		if (seen.has(productId)) return invalid('Produk yang sama tidak boleh muncul dua kali', 'lines')
		seen.add(productId)
		if (!Number.isFinite(quantity) || quantity < 0) return invalid('Jumlah tidak boleh negatif', 'lines')
		if (quantity > source.quantity) return invalid(`Jumlah melebihi qty invoice (maksimal ${source.quantity})`, 'lines')
	}
	if (!body.lines.some((line) => Number(line.quantity) > 0)) return invalid('Minimal satu produk harus dikirim', 'lines')
	return null
}

function buildRow(body: DeliveryNoteRequest, base: Pick<DeliveryNoteRow, 'id' | 'number' | 'sales_invoice_id' | 'created_by'>): DeliveryNoteRow {
	return {
		...base,
		date: body.date,
		delivery_address: String(body.delivery_address).trim(),
		recipient: String(body.recipient ?? '').trim(),
		driver: String(body.driver ?? '').trim(),
		vehicle: String(body.vehicle ?? '').trim(),
		description: String(body.description ?? '').trim(),
		lines: body.lines
			.filter((line) => Number(line.quantity) > 0)
			.map((line) => ({ product_id: Number(line.product_id), quantity: Math.round(Number(line.quantity) * 1000) / 1000 }))
	}
}

const FIELDS: FieldSpec<DeliveryNote>[] = [
	{ key: 'date', label: 'Tanggal', format: fmtDate },
	{ key: 'delivery_address', label: 'Alamat Pengiriman' },
	{ key: 'recipient', label: 'Nama Penerima' },
	{ key: 'driver', label: 'Nama Driver' },
	{ key: 'vehicle', label: 'No. Kendaraan' },
	{ key: 'description', label: 'Keterangan' }
]
const LINE_FIELDS: FieldSpec<DeliveryNoteLine>[] = [{ key: 'quantity', label: 'Jumlah Dikirim' }]

// Contract: docs/delivery-note/
export function registerDeliveryNote(mock: MockAdapter) {
	registerHistoryRoute(mock, 'delivery-note', (id) => db.deliveryNote.some((item) => item.id === id), NOT_FOUND)

	// Picker: approved invoices that have no surat jalan yet.
	mock.onGet('/delivery-note/deliverable-invoices').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		let rows = db.salesInvoice
			.filter((item) => item.approval_status === 'approved' && !noteOfInvoice(item.id))
			.map((item) => findSalesInvoice(item.id)!)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((row) => [row.number, row.customer_code, row.customer_name].join(' ').toLowerCase().includes(q))
		}
		rows = sortBy(rows, 'date', 'desc')
		const page = paginate(
			rows.map((row) => ({
				id: row.id,
				number: row.number,
				date: row.date,
				customer_id: row.customer_id,
				customer_code: row.customer_code,
				customer_name: row.customer_name
			})),
			p
		)
		return [200, { data: page.data, meta: page.meta }]
	})

	mock.onGet(/\/sales-invoice\/\d+\/deliverable-lines$/).reply((config) => {
		const invoice = findSalesInvoice(parentIdOf(config.url))
		if (!invoice) return [404, { message: 'Invoice penjualan tidak ditemukan' }]
		if (invoice.approval_status !== 'approved') return [422, { message: 'Invoice belum disetujui' }]
		const existing = noteOfInvoice(invoice.id)
		if (existing) return [422, { message: `Invoice ini sudah memiliki surat jalan ${existing.number}` }]
		const lines = resolveLines([], invoice).map((line) => ({ ...line, quantity: line.invoice_quantity }))
		return [
			200,
			{
				data: {
					sales_invoice: {
						id: invoice.id,
						number: invoice.number,
						date: invoice.date,
						customer_id: invoice.customer_id,
						customer_code: invoice.customer_code,
						customer_name: invoice.customer_name,
						customer_address: invoice.customer_address,
						department_code: invoice.department_code,
						department_name: invoice.department_name
					},
					lines
				}
			}
		]
	})

	mock.onGet('/delivery-note').reply((config) => {
		const p = (config.params ?? {}) as ListParams & { sales_invoice_id?: string | number; date_from?: string; date_to?: string }
		let rows = db.deliveryNote.map(resolve)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((row) =>
				[
					row.number,
					row.sales_invoice_number,
					row.customer_code,
					row.customer_name,
					row.delivery_address,
					row.recipient,
					row.driver,
					row.vehicle,
					row.description
				]
					.join(' ')
					.toLowerCase()
					.includes(q)
			)
		}
		if (p.sales_invoice_id) rows = rows.filter((row) => row.sales_invoice_id === Number(p.sales_invoice_id))
		if (p.date_from) rows = rows.filter((row) => row.date >= String(p.date_from))
		if (p.date_to) rows = rows.filter((row) => row.date <= String(p.date_to))
		const page = paginate(sortBy(rows, p.sort_by, p.sort_order), p)
		return [200, { data: page.data, meta: page.meta }]
	})

	mock.onGet(/\/delivery-note\/\d+$/).reply((config) => {
		const row = db.deliveryNote.find((item) => item.id === idOf(config.url))
		return row ? [200, { data: resolve(row) }] : [404, { message: NOT_FOUND }]
	})

	mock.onPost('/delivery-note').reply((config) => {
		const body = JSON.parse(config.data) as DeliveryNoteRequest
		const invoice = body.sales_invoice_id ? findSalesInvoice(Number(body.sales_invoice_id)) : undefined
		if (!invoice) return [422, invalid('Invoice penjualan wajib dipilih', 'sales_invoice_id')]
		if (invoice.approval_status !== 'approved') return [422, invalid('Invoice belum disetujui', 'sales_invoice_id')]
		const existing = noteOfInvoice(invoice.id)
		if (existing) return [422, invalid(`Invoice ini sudah memiliki surat jalan ${existing.number}`, 'sales_invoice_id')]
		const error = validate(body, invoice)
		if (error) return [422, error]
		const id = nextId(db.deliveryNote)
		const number = deliveryNoteNumber(invoice.number)
		const row = buildRow(body, { id, number, sales_invoice_id: invoice.id, created_by: userName() })
		db.deliveryNote.unshift(row)
		recordHistory('delivery-note', id, { title: 'Dibuat', kind: 'created', summary: `Dari invoice ${invoice.number}` })
		recordHistory('sales-invoice', invoice.id, { title: 'Surat Jalan Dibuat', kind: 'info', summary: number })
		return [201, { data: resolve(row), message: 'Surat jalan ditambahkan' }]
	})

	mock.onPut(/\/delivery-note\/\d+$/).reply((config) => {
		const row = db.deliveryNote.find((item) => item.id === idOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		const body = JSON.parse(config.data) as DeliveryNoteRequest
		const invoice = findSalesInvoice(row.sales_invoice_id)
		if (!invoice) return [422, { message: 'Invoice penjualan tidak ditemukan' }]
		const error = validate(body, invoice) // sales_invoice_id in the body is ignored — immutable, see docs/delivery-note/update-delivery-note.md
		if (error) return [422, error]
		const before = resolve(row)
		Object.assign(row, buildRow(body, row))
		const after = resolve(row)
		recordUpdate('delivery-note', row.id, [
			...diffFields(before, after, FIELDS),
			...diffLines(before.lines, after.lines, {
				id: (line) => line.product_id,
				name: (line) => line.product_name ?? `Produk #${line.product_id}`,
				specs: LINE_FIELDS
			})
		])
		return [200, { data: after, message: 'Surat jalan diperbarui' }]
	})

	mock.onDelete(/\/delivery-note\/\d+$/).reply((config) => {
		const index = db.deliveryNote.findIndex((item) => item.id === idOf(config.url))
		if (index < 0) return [404, { message: NOT_FOUND }]
		const [removed] = db.deliveryNote.splice(index, 1)
		purgeHistory('delivery-note', removed.id)
		recordHistory('sales-invoice', removed.sales_invoice_id, { title: 'Surat Jalan Dihapus', kind: 'info', summary: removed.number })
		return [200, { message: 'Surat jalan dihapus' }]
	})
}
