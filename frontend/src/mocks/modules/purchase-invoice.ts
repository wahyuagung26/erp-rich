import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import type {
	JournalAttachment,
	PurchaseInvoice,
	PurchaseInvoiceLine,
	PurchaseInvoiceRequest,
	PurchaseOrder,
	PurchaseOrderLine,
	PurchaseReceipt,
	PurchaseReceiptInvoiceableLines
} from '@/utils/types'

const VAT_RATE = 11
const TAX_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const idOf = (url?: string) => Number(url?.split('/').at(-1))
const parentIdOf = (url?: string) => Number(url?.split('/').at(-2))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))
const today = () => new Date().toISOString().slice(0, 10)
const userName = () => {
	try {
		return JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin'
	} catch {
		return 'Admin'
	}
}

function amounts(quantity: number, price: number, isPkp: boolean) {
	const dpp = Math.round(quantity * price)
	const ppn = isPkp ? Math.round((dpp * VAT_RATE) / 100) : 0
	return { dpp, ppn, total: dpp + ppn }
}

// Lines the receipt actually took in; the invoice has exactly these products.
const receivedLines = (receipt: PurchaseReceipt) => receipt.lines.filter((line) => line.quantity > 0)

// Default price = the PO line's net unit price (after discount).
function defaultPrice(po: PurchaseOrder | undefined, productId: number) {
	const poLine = po?.lines.find((line: PurchaseOrderLine) => line.product_id === productId)
	if (!poLine || !(poLine.quantity > 0)) return 0
	const net = Math.max(Math.round(poLine.quantity * poLine.price) - Math.round(poLine.discount), 0)
	return Math.round(net / poLine.quantity)
}

function resolveLine(productId: number, quantity: number, price: number, isPkp: boolean): PurchaseInvoiceLine {
	const product = db.product.find((item) => item.id === productId && !item.deleted_at)
	return {
		product_id: productId,
		product_code: product?.code,
		product_name: product?.name,
		brand_name: product?.brand_name,
		unit_name: product?.unit_name,
		quantity,
		price,
		...amounts(quantity, price, isPkp)
	}
}

function resolve(row: PurchaseInvoice): PurchaseInvoice {
	const receipt = db.purchaseReceipt.find((item) => item.id === row.purchase_receipt_id)
	const po = receipt && db.purchaseOrder.find((item) => item.id === receipt.purchase_order_id)
	const supplier = po && db.supplier.find((item) => item.id === po.supplier_id && !item.deleted_at)
	const department = receipt && db.department.find((item) => item.id === receipt.department_id && !item.deleted_at)
	const lines = row.lines.map((line) => {
		const received = receipt?.lines.find((item) => item.product_id === line.product_id)
		return resolveLine(line.product_id, received?.quantity ?? 0, line.price, row.pkp_active)
	})
	const dpp = lines.reduce((sum, line) => sum + line.dpp, 0)
	const ppn = lines.reduce((sum, line) => sum + line.ppn, 0)
	return {
		...row,
		purchase_receipt_number: receipt?.number,
		purchase_order_id: po?.id,
		purchase_order_number: po?.number,
		supplier_id: po?.supplier_id,
		supplier_code: supplier?.code,
		supplier_name: supplier?.name,
		department_id: receipt?.department_id,
		department_code: department?.code,
		department_name: department?.name,
		lines,
		dpp,
		ppn,
		total: dpp + ppn
	}
}

function invalid(message: string, field?: string) {
	return { message: field ? 'Validasi gagal' : message, ...(field ? { errors: { [field]: [message] } } : {}) }
}

function validate(body: PurchaseInvoiceRequest, receipt: PurchaseReceipt): ReturnType<typeof invalid> | null {
	if (!isDate(body.date)) return invalid('Tanggal wajib diisi', 'date')
	if (body.date > today()) return invalid('Tanggal tidak boleh melebihi hari ini', 'date')
	if (!String(body.supplier_invoice_number || '').trim()) return invalid('Nomor invoice supplier wajib diisi', 'supplier_invoice_number')
	if (String(body.supplier_invoice_number).trim().length > 30)
		return invalid('Nomor invoice supplier maksimal 30 karakter', 'supplier_invoice_number')
	if (String(body.description || '').trim().length > 250) return invalid('Keterangan maksimal 250 karakter', 'description')
	const expected = receivedLines(receipt).map((line) => line.product_id)
	const sent = Array.isArray(body.lines) ? body.lines.map((line) => Number(line.product_id)) : []
	if (sent.length !== expected.length || expected.some((id) => !sent.includes(id)))
		return invalid('Produk invoice harus sama dengan produk yang diterima', 'lines')
	if (new Set(sent).size !== sent.length) return invalid('Produk tidak boleh muncul lebih dari satu kali', 'lines')
	if (body.lines.some((line) => !(Number(line.price) > 0))) return invalid('Harga satuan harus lebih dari nol', 'lines')
	return null
}

function buildLines(body: PurchaseInvoiceRequest): PurchaseInvoiceLine[] {
	return body.lines.map((line) => ({
		product_id: Number(line.product_id),
		quantity: 0,
		price: Math.round(Number(line.price)),
		dpp: 0,
		ppn: 0,
		total: 0
	}))
}

export function registerPurchaseInvoice(mock: MockAdapter) {
	mock.onGet(/\/purchase-receipt\/\d+\/invoiceable-lines$/).reply((config) => {
		const receipt = db.purchaseReceipt.find((item) => item.id === parentIdOf(config.url))
		if (!receipt) return [404, { message: 'Penerimaan pembelian tidak ditemukan' }]
		if (receipt.invoice_status === 'invoiced') return [422, { message: 'Penerimaan sudah dibuat invoice' }]
		const po = db.purchaseOrder.find((item) => item.id === receipt.purchase_order_id)
		const supplier = po && db.supplier.find((item) => item.id === po.supplier_id && !item.deleted_at)
		const department = db.department.find((item) => item.id === receipt.department_id && !item.deleted_at)
		const pkp = Boolean(po?.pkp_active)
		const data: PurchaseReceiptInvoiceableLines = {
			purchase_receipt: {
				id: receipt.id,
				number: receipt.number,
				date: receipt.date,
				delivery_note_number: receipt.delivery_note_number,
				department_id: receipt.department_id,
				department_code: department?.code,
				department_name: department?.name,
				purchase_order_number: po?.number,
				supplier_code: supplier?.code,
				supplier_name: supplier?.name,
				pkp_active: pkp
			},
			lines: receivedLines(receipt).map((line) => resolveLine(line.product_id, line.quantity, defaultPrice(po, line.product_id), pkp))
		}
		return [200, { data }]
	})

	mock.onGet('/purchase-invoice').reply((config) => {
		const p = (config.params ?? {}) as ListParams & { approval_status?: string; date_from?: string; date_to?: string }
		let rows = db.purchaseInvoice.map(resolve)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((row) =>
				[
					row.number,
					row.supplier_invoice_number,
					row.purchase_receipt_number,
					row.purchase_order_number,
					row.supplier_code,
					row.supplier_name,
					row.description
				]
					.join(' ')
					.toLowerCase()
					.includes(q)
			)
		}
		if (p.approval_status) rows = rows.filter((row) => row.approval_status === p.approval_status)
		if (p.date_from) rows = rows.filter((row) => row.date >= String(p.date_from))
		if (p.date_to) rows = rows.filter((row) => row.date <= String(p.date_to))
		return [200, paginate(sortBy(rows, p.sort_by, p.sort_order), p)]
	})

	mock.onGet(/\/purchase-invoice\/\d+$/).reply((config) => {
		const row = db.purchaseInvoice.find((item) => item.id === idOf(config.url))
		return row ? [200, { data: resolve(row) }] : [404, { message: 'Invoice pembelian tidak ditemukan' }]
	})

	mock.onPost('/purchase-invoice').reply((config) => {
		const body = JSON.parse(config.data) as PurchaseInvoiceRequest
		const receipt = db.purchaseReceipt.find((item) => item.id === Number(body.purchase_receipt_id))
		if (!receipt) return [422, invalid('Penerimaan pembelian tidak valid', 'purchase_receipt_id')]
		if (receipt.invoice_status === 'invoiced') return [422, { message: 'Penerimaan sudah dibuat invoice' }]
		const error = validate(body, receipt)
		if (error) return [422, error]
		const po = db.purchaseOrder.find((item) => item.id === receipt.purchase_order_id)
		const id = nextId(db.purchaseInvoice)
		const row: PurchaseInvoice = {
			id,
			number: `BL-RICH/${String(id).padStart(4, '0')}/${body.date.slice(5, 7)}/${body.date.slice(0, 4)}`,
			date: body.date,
			purchase_receipt_id: receipt.id,
			supplier_invoice_number: String(body.supplier_invoice_number).trim(),
			description: String(body.description || '').trim(),
			pkp_active: Boolean(po?.pkp_active),
			approval_status: 'pending',
			approved_by: null,
			approved_at: null,
			kontrabon_number: null,
			tax_invoice: null,
			created_by: userName(),
			lines: buildLines(body),
			dpp: 0,
			ppn: 0,
			total: 0
		}
		db.purchaseInvoice.unshift(row)
		receipt.invoice_status = 'invoiced'
		return [201, { data: resolve(row), message: 'Invoice pembelian ditambahkan' }]
	})

	mock.onPut(/\/purchase-invoice\/\d+$/).reply((config) => {
		const row = db.purchaseInvoice.find((item) => item.id === idOf(config.url))
		if (!row) return [404, { message: 'Invoice pembelian tidak ditemukan' }]
		if (row.approval_status === 'approved') return [422, { message: 'Invoice yang sudah disetujui tidak boleh diubah' }]
		const body = JSON.parse(config.data) as PurchaseInvoiceRequest
		const receipt = db.purchaseReceipt.find((item) => item.id === row.purchase_receipt_id) as PurchaseReceipt // locked
		const error = validate(body, receipt)
		if (error) return [422, error]
		Object.assign(row, {
			date: body.date,
			supplier_invoice_number: String(body.supplier_invoice_number).trim(),
			description: String(body.description || '').trim(),
			lines: buildLines(body)
		})
		return [200, { data: resolve(row), message: 'Invoice pembelian diperbarui' }]
	})

	mock.onDelete(/\/purchase-invoice\/\d+$/).reply((config) => {
		const index = db.purchaseInvoice.findIndex((item) => item.id === idOf(config.url))
		if (index < 0) return [404, { message: 'Invoice pembelian tidak ditemukan' }]
		const row = db.purchaseInvoice[index]
		if (row.approval_status === 'approved') return [422, { message: 'Invoice yang sudah disetujui tidak boleh dihapus' }]
		db.purchaseInvoice.splice(index, 1)
		const receipt = db.purchaseReceipt.find((item) => item.id === row.purchase_receipt_id)
		if (receipt) receipt.invoice_status = 'not_invoiced'
		return [200, { message: 'Invoice pembelian dihapus' }]
	})

	mock.onPatch(/\/purchase-invoice\/\d+\/approval$/).reply((config) => {
		const row = db.purchaseInvoice.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: 'Invoice pembelian tidak ditemukan' }]
		const { status } = JSON.parse(config.data) as { status?: string }
		if (status !== 'approved') return [422, { message: 'Status persetujuan tidak valid' }]
		if (row.approval_status === 'approved') return [422, { message: 'Invoice sudah disetujui' }]
		const now = new Date()
		const seq = String(db.purchaseInvoice.filter((item) => item.kontrabon_number).length + 1).padStart(4, '0')
		row.approval_status = 'approved'
		row.approved_by = userName()
		row.approved_at = now.toISOString()
		row.kontrabon_number = `KB-RICH/${seq}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
		return [200, { data: resolve(row), message: 'Invoice disetujui' }]
	})

	mock.onGet(/\/purchase-invoice\/\d+\/tax-invoice$/).reply((config) => {
		const row = db.purchaseInvoice.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: 'Invoice pembelian tidak ditemukan' }]
		if (!row.pkp_active) return [422, { message: 'Invoice non-PKP tidak memiliki faktur pajak' }]
		return [200, { data: row.tax_invoice }]
	})

	mock.onPut(/\/purchase-invoice\/\d+\/tax-invoice$/).reply((config) => {
		const row = db.purchaseInvoice.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: 'Invoice pembelian tidak ditemukan' }]
		if (!row.pkp_active) return [422, { message: 'Invoice non-PKP tidak memiliki faktur pajak' }]
		const body = JSON.parse(config.data) as { number?: string; date?: string; file?: JournalAttachment | null }
		const number = String(body.number || '').trim()
		if (!number) return [422, invalid('Nomor faktur pajak wajib diisi', 'number')]
		if (number.length > 25) return [422, invalid('Nomor faktur pajak maksimal 25 karakter', 'number')]
		if (!isDate(body.date)) return [422, invalid('Tanggal faktur pajak wajib diisi', 'date')]
		const file = body.file ?? null
		if (file && !TAX_FILE_TYPES.includes(file.type)) return [422, invalid('Lampiran harus berupa PDF, JPG, atau PNG', 'file')]
		if (file && file.size > 5 * 1024 * 1024) return [422, invalid('Ukuran lampiran maksimal 5 MB', 'file')]
		const duplicate = db.purchaseInvoice.some((item) => item.id !== row.id && item.tax_invoice?.number.toLowerCase() === number.toLowerCase())
		if (duplicate) return [422, invalid('Nomor faktur pajak sudah dipakai invoice lain', 'number')]
		row.tax_invoice = { number, date: String(body.date), file }
		return [200, { data: resolve(row), message: 'Faktur pajak disimpan' }]
	})
}
