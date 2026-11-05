import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { companyIdOf, nextId, paginate, sortBy, summarize, type ListParams } from '../lib'
import {
	diffFields,
	diffLines,
	fmtDate,
	fmtMoney,
	purgeHistory,
	recordHistory,
	recordUpdate,
	registerHistoryRoute,
	userName,
	type FieldSpec
} from '../history'
import { resolve as resolveInvoice } from './purchase-invoice'
import { isPeriodClosed } from './posting'
import type {
	JournalAttachment,
	PurchaseInvoice,
	PurchaseInvoiceReturnableLines,
	PurchaseInvoiceTaxInvoice,
	PurchaseReturn,
	PurchaseReturnLine,
	PurchaseReturnRequest,
	PurchaseReturnSettlement,
	PurchaseReturnSettlementRequest
} from '@/utils/types'

// Contract: docs/purchase-return/.
const VAT_RATE = 11
const TAX_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const idOf = (url?: string) => Number(url?.split('/').at(-1))
const parentIdOf = (url?: string) => Number(url?.split('/').at(-2))
const grandParentIdOf = (url?: string) => Number(url?.split('/').at(-3))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))
const today = () => new Date().toISOString().slice(0, 10)

type Stored = (typeof db.purchaseReturn)[number]

const invalid = (message: string, field?: string) => ({
	message: field ? 'Validasi gagal' : message,
	...(field ? { errors: { [field]: [message] } } : {})
})

function amounts(quantity: number, price: number, isPkp: boolean) {
	const dpp = Math.round(quantity * price)
	const ppn = isPkp ? Math.round((dpp * VAT_RATE) / 100) : 0
	return { dpp, ppn, total: dpp + ppn }
}

// Quantity of `productId` already returned on this invoice by OTHER returns (any approval status).
const returnedBefore = (invoiceId: number, productId: number, exceptId = 0) =>
	db.purchaseReturn
		.filter((item) => item.purchase_invoice_id === invoiceId && item.id !== exceptId)
		.flatMap((item) => item.lines)
		.filter((line) => line.product_id === productId)
		.reduce((sum, line) => sum + line.quantity, 0)

function resolveLine(
	invoice: PurchaseInvoice | undefined,
	productId: number,
	quantity: number,
	returnId: number,
	isPkp: boolean
): PurchaseReturnLine {
	const source = invoice?.lines.find((line) => line.product_id === productId)
	const price = source?.price ?? 0
	return {
		product_id: productId,
		product_code: source?.product_code,
		product_name: source?.product_name,
		brand_name: source?.brand_name,
		unit_name: source?.unit_name,
		quantity_purchased: source?.quantity ?? 0,
		quantity_returned_before: returnedBefore(invoice?.id ?? 0, productId, returnId),
		quantity,
		price,
		...amounts(quantity, price, isPkp)
	}
}

const monthLabel = (date: string) =>
	new Date(`${date.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const closedMessage = (date: string) => `Periode ${monthLabel(date)} sudah closing`

function settlementsOf(returnId: number, companyId: number | null): PurchaseReturnSettlement[] {
	return db.purchaseReturnSettlement
		.filter((item) => item.purchase_return_id === returnId)
		.map((item) => ({
			id: item.id,
			date: item.date,
			type: item.type,
			payable_number: item.payable_number,
			payment_number: item.payment_number,
			bank_account_id: item.bank_account_id,
			bank_account_name: db.bankAccount.find((bank) => bank.id === item.bank_account_id)?.bank_name,
			description: item.description,
			amount: item.amount,
			locked: isPeriodClosed(companyId, item.date)
		}))
}

export function resolve(row: Stored, companyId: number | null = null): PurchaseReturn {
	const source = db.purchaseInvoice.find((item) => item.id === row.purchase_invoice_id)
	const invoice = source && resolveInvoice(source)
	const warehouse = db.warehouse.find((item) => item.id === row.warehouse_id && !item.deleted_at)
	const lines = row.lines.map((line) => resolveLine(invoice, line.product_id, line.quantity, row.id, row.pkp_active))
	const dpp = lines.reduce((sum, line) => sum + line.dpp, 0)
	const ppn = lines.reduce((sum, line) => sum + line.ppn, 0)
	const total = dpp + ppn
	const settlements = settlementsOf(row.id, companyId)
	const used_total = settlements.filter((item) => item.type === 'payable_deduction').reduce((sum, item) => sum + item.amount, 0)
	const refunded_total = settlements.filter((item) => item.type === 'cash_bank').reduce((sum, item) => sum + item.amount, 0)
	const remaining_total = Math.max(total - used_total - refunded_total, 0)
	return {
		...row,
		purchase_invoice_number: invoice?.number,
		supplier_invoice_number: invoice?.supplier_invoice_number,
		supplier_id: invoice?.supplier_id,
		supplier_code: invoice?.supplier_code,
		supplier_name: invoice?.supplier_name,
		department_id: invoice?.department_id,
		department_code: invoice?.department_code,
		department_name: invoice?.department_name,
		warehouse_code: warehouse?.code,
		warehouse_name: warehouse?.name,
		lines,
		dpp,
		ppn,
		total,
		used_total,
		refunded_total,
		remaining_total,
		settlement_status: row.approval_status === 'approved' && remaining_total === 0 ? 'settled' : 'open',
		settlements
	}
}

function validate(body: PurchaseReturnRequest, invoice: PurchaseInvoice, returnId = 0): ReturnType<typeof invalid> | null {
	if (!isDate(body.date)) return invalid('Tanggal wajib diisi', 'date')
	if (body.date > today()) return invalid('Tanggal tidak boleh melebihi hari ini', 'date')
	if (body.date < invoice.date) return invalid('Tanggal retur tidak boleh sebelum tanggal invoice', 'date')
	if (!db.warehouse.some((item) => item.id === Number(body.warehouse_id) && !item.deleted_at)) return invalid('Gudang wajib dipilih', 'warehouse_id')
	const reason = String(body.reason || '').trim()
	if (!reason) return invalid('Alasan retur wajib diisi', 'reason')
	if (reason.length > 250) return invalid('Alasan retur maksimal 250 karakter', 'reason')
	const sent = Array.isArray(body.lines) ? body.lines : []
	if (new Set(sent.map((line) => Number(line.product_id))).size !== sent.length)
		return invalid('Produk tidak boleh muncul lebih dari satu kali', 'lines')
	if (!sent.some((line) => Number(line.quantity) > 0)) return invalid('Isi jumlah retur minimal satu produk', 'lines')
	for (const line of sent) {
		const source = invoice.lines.find((item) => item.product_id === Number(line.product_id))
		if (!source) return invalid('Produk retur harus berasal dari invoice', 'lines')
		const quantity = Number(line.quantity)
		if (!(quantity >= 0)) return invalid('Jumlah retur tidak valid', 'lines')
		const available = source.quantity - returnedBefore(invoice.id, source.product_id, returnId)
		if (quantity > available) return invalid(`Jumlah retur ${source.product_name} melebihi sisa yang bisa diretur (${available})`, 'lines')
	}
	return null
}

const storedLines = (body: PurchaseReturnRequest): PurchaseReturnLine[] =>
	body.lines
		.filter((line) => Number(line.quantity) > 0)
		.map((line) => ({
			product_id: Number(line.product_id),
			quantity_purchased: 0,
			quantity_returned_before: 0,
			quantity: Number(line.quantity),
			price: 0,
			dpp: 0,
			ppn: 0,
			total: 0
		}))

const FIELDS: FieldSpec<PurchaseReturn>[] = [
	{ key: 'date', label: 'Tanggal', format: fmtDate },
	{ key: 'warehouse_name', label: 'Gudang' },
	{ key: 'reason', label: 'Alasan Retur' }
]
const LINE_FIELDS: FieldSpec<PurchaseReturnLine>[] = [{ key: 'quantity', label: 'Jumlah Retur' }]
const TAX_FIELDS: FieldSpec<PurchaseInvoiceTaxInvoice>[] = [
	{ key: 'number', label: 'Nomor Faktur Pajak' },
	{ key: 'date', label: 'Tanggal Faktur Pajak', format: fmtDate },
	{ key: 'file', label: 'File Faktur Pajak', format: (file) => (file as JournalAttachment | null)?.name ?? '–' }
]

export function registerPurchaseReturn(mock: MockAdapter) {
	registerHistoryRoute(mock, 'purchase-return', (id) => db.purchaseReturn.some((item) => item.id === id), 'Retur pembelian tidak ditemukan')

	mock.onGet(/\/purchase-invoice\/\d+\/returnable-lines$/).reply((config) => {
		const source = db.purchaseInvoice.find((item) => item.id === parentIdOf(config.url))
		if (!source) return [404, { message: 'Invoice pembelian tidak ditemukan' }]
		if (source.approval_status !== 'approved') return [422, { message: 'Hanya invoice yang sudah disetujui yang bisa diretur' }]
		const invoice = resolveInvoice(source)
		const exceptId = Number((config.params as { exclude_return_id?: number } | undefined)?.exclude_return_id) || 0
		const data: PurchaseInvoiceReturnableLines = {
			purchase_invoice: {
				id: invoice.id,
				number: invoice.number,
				date: invoice.date,
				supplier_invoice_number: invoice.supplier_invoice_number,
				supplier_code: invoice.supplier_code,
				supplier_name: invoice.supplier_name,
				department_code: invoice.department_code,
				department_name: invoice.department_name,
				pkp_active: invoice.pkp_active
			},
			lines: invoice.lines.map((line) => resolveLine(invoice, line.product_id, 0, exceptId, invoice.pkp_active))
		}
		return [200, { data }]
	})

	mock.onGet('/purchase-return').reply((config) => {
		const p = (config.params ?? {}) as ListParams & {
			approval_status?: string
			settlement_status?: string
			supplier_id?: string | number
			date_from?: string
			date_to?: string
		}
		const companyId = companyIdOf(config)
		let rows = db.purchaseReturn.map((item) => resolve(item, companyId))
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((row) =>
				[row.number, row.purchase_invoice_number, row.supplier_invoice_number, row.supplier_code, row.supplier_name, row.reason]
					.join(' ')
					.toLowerCase()
					.includes(q)
			)
		}
		if (p.supplier_id) rows = rows.filter((row) => row.supplier_id === Number(p.supplier_id))
		if (p.date_from) rows = rows.filter((row) => row.date >= String(p.date_from))
		if (p.date_to) rows = rows.filter((row) => row.date <= String(p.date_to))
		// KPI tiles: honour search + dates, ignore the status filters below (docs/conventions.md).
		const summary = summarize(
			rows,
			{
				pending: (row) => row.approval_status === 'pending',
				open: (row) => row.approval_status === 'approved' && row.settlement_status === 'open',
				settled: (row) => row.settlement_status === 'settled'
			},
			(row) => row.remaining_total,
			['pending', 'open']
		)
		if (p.approval_status) rows = rows.filter((row) => row.approval_status === p.approval_status)
		if (p.settlement_status) rows = rows.filter((row) => row.settlement_status === p.settlement_status)
		const page = paginate(sortBy(rows, p.sort_by, p.sort_order), p)
		return [200, { data: page.data, meta: { ...page.meta, summary } }]
	})

	mock.onGet(/\/purchase-return\/\d+$/).reply((config) => {
		const row = db.purchaseReturn.find((item) => item.id === idOf(config.url))
		return row ? [200, { data: resolve(row, companyIdOf(config)) }] : [404, { message: 'Retur pembelian tidak ditemukan' }]
	})

	mock.onPost('/purchase-return').reply((config) => {
		const body = JSON.parse(config.data) as PurchaseReturnRequest
		const source = db.purchaseInvoice.find((item) => item.id === Number(body.purchase_invoice_id))
		if (!source) return [422, invalid('Invoice pembelian wajib dipilih', 'purchase_invoice_id')]
		if (source.approval_status !== 'approved') return [422, invalid('Hanya invoice yang sudah disetujui yang bisa diretur', 'purchase_invoice_id')]
		const invoice = resolveInvoice(source)
		const error = validate(body, invoice)
		if (error) return [422, error]
		const id = nextId(db.purchaseReturn)
		const row: Stored = {
			id,
			number: `RB-RICH/${String(id).padStart(4, '0')}/${body.date.slice(5, 7)}/${body.date.slice(0, 4)}`,
			date: body.date,
			purchase_invoice_id: invoice.id,
			warehouse_id: Number(body.warehouse_id),
			reason: String(body.reason).trim(),
			pkp_active: invoice.pkp_active,
			approval_status: 'pending',
			approved_by: null,
			approved_at: null,
			tax_invoice: null,
			created_by: userName(),
			lines: storedLines(body),
			dpp: 0,
			ppn: 0,
			total: 0
		}
		db.purchaseReturn.unshift(row)
		recordHistory('purchase-return', id, { title: 'Dibuat', kind: 'created', summary: `Dari invoice ${invoice.number}` })
		return [201, { data: resolve(row, companyIdOf(config)), message: 'Retur pembelian ditambahkan' }]
	})

	mock.onPut(/\/purchase-return\/\d+$/).reply((config) => {
		const row = db.purchaseReturn.find((item) => item.id === idOf(config.url))
		if (!row) return [404, { message: 'Retur pembelian tidak ditemukan' }]
		if (row.approval_status === 'approved') return [422, { message: 'Retur yang sudah disetujui tidak boleh diubah' }]
		const body = JSON.parse(config.data) as PurchaseReturnRequest
		const invoice = resolveInvoice(db.purchaseInvoice.find((item) => item.id === row.purchase_invoice_id) as PurchaseInvoice) // locked
		const error = validate(body, invoice, row.id)
		if (error) return [422, error]
		const before = resolve(row, companyIdOf(config))
		Object.assign(row, { date: body.date, warehouse_id: Number(body.warehouse_id), reason: String(body.reason).trim(), lines: storedLines(body) })
		const after = resolve(row, companyIdOf(config))
		recordUpdate('purchase-return', row.id, [
			...diffFields(before, after, FIELDS),
			...diffLines(before.lines, after.lines, {
				id: (line) => line.product_id,
				name: (line) => line.product_name ?? `Produk #${line.product_id}`,
				specs: LINE_FIELDS
			})
		])
		return [200, { data: after, message: 'Retur pembelian diperbarui' }]
	})

	mock.onDelete(/\/purchase-return\/\d+$/).reply((config) => {
		const index = db.purchaseReturn.findIndex((item) => item.id === idOf(config.url))
		if (index < 0) return [404, { message: 'Retur pembelian tidak ditemukan' }]
		const row = db.purchaseReturn[index]
		if (row.approval_status === 'approved') return [422, { message: 'Retur yang sudah disetujui tidak boleh dihapus' }]
		db.purchaseReturn.splice(index, 1)
		purgeHistory('purchase-return', row.id)
		return [200, { message: 'Retur pembelian dihapus' }]
	})

	mock.onPatch(/\/purchase-return\/\d+\/approval$/).reply((config) => {
		const row = db.purchaseReturn.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: 'Retur pembelian tidak ditemukan' }]
		const { status } = JSON.parse(config.data) as { status?: string }
		if (status === 'approved') {
			if (row.approval_status === 'approved') return [422, { message: 'Retur sudah disetujui' }]
			row.approval_status = 'approved'
			row.approved_by = userName()
			row.approved_at = new Date().toISOString()
			recordHistory('purchase-return', row.id, { title: 'Disetujui', kind: 'approved' })
			return [200, { data: resolve(row, companyIdOf(config)), message: 'Retur disetujui' }]
		}
		if (status === 'pending') {
			if (row.approval_status !== 'approved') return [422, { message: 'Retur belum disetujui' }]
			if (settlementsOf(row.id, null).length)
				return [422, { message: 'Persetujuan tidak bisa dibatalkan karena retur sudah dipakai atau dikembalikan' }]
			row.approval_status = 'pending'
			row.approved_by = null
			row.approved_at = null
			recordHistory('purchase-return', row.id, { title: 'Persetujuan Dibatalkan', kind: 'info' })
			return [200, { data: resolve(row, companyIdOf(config)), message: 'Persetujuan dibatalkan' }]
		}
		return [422, { message: 'Status persetujuan tidak valid' }]
	})

	mock.onPost(/\/purchase-return\/\d+\/settlements$/).reply((config) => {
		const row = db.purchaseReturn.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: 'Retur pembelian tidak ditemukan' }]
		if (row.approval_status !== 'approved') return [422, { message: 'Retur harus disetujui sebelum dikembalikan' }]
		const body = JSON.parse(config.data) as PurchaseReturnSettlementRequest
		const companyId = companyIdOf(config)
		const current = resolve(row, companyId)
		if (!isDate(body.date)) return [422, invalid('Tanggal wajib diisi', 'date')]
		if (body.date > today()) return [422, invalid('Tanggal tidak boleh melebihi hari ini', 'date')]
		if (body.date < row.date) return [422, invalid('Tanggal tidak boleh sebelum tanggal retur', 'date')]
		if (isPeriodClosed(companyId, body.date)) return [422, invalid(closedMessage(body.date), 'date')]
		if (!db.bankAccount.some((item) => item.id === Number(body.bank_account_id) && !item.deleted_at))
			return [422, invalid('Rekening cash / bank wajib dipilih', 'bank_account_id')]
		const amount = Math.round(Number(body.amount))
		if (!(amount > 0)) return [422, invalid('Nominal harus lebih dari nol', 'amount')]
		if (amount > current.remaining_total) return [422, invalid(`Nominal melebihi sisa retur (${current.remaining_total})`, 'amount')]
		const id = nextId(db.purchaseReturnSettlement)
		db.purchaseReturnSettlement.push({
			id,
			purchase_return_id: row.id,
			date: body.date,
			type: 'cash_bank',
			payable_number: null,
			payment_number: null,
			bank_account_id: Number(body.bank_account_id),
			description: String(body.description || '').trim(),
			amount
		})
		recordHistory('purchase-return', row.id, { title: 'Pengembalian Dana Dicatat', kind: 'info', summary: fmtMoney(amount) })
		return [201, { data: resolve(row, companyId), message: 'Pengembalian dana dicatat' }]
	})

	// Edit a cash / bank refund (date, bank account, amount, description). Locked once its period is closed.
	mock.onPut(/\/purchase-return\/\d+\/settlements\/\d+$/).reply((config) => {
		const row = db.purchaseReturn.find((item) => item.id === grandParentIdOf(config.url))
		if (!row) return [404, { message: 'Retur pembelian tidak ditemukan' }]
		const settlement = db.purchaseReturnSettlement.find((item) => item.id === idOf(config.url) && item.purchase_return_id === row.id)
		if (!settlement) return [404, { message: 'Penyelesaian retur tidak ditemukan' }]
		if (settlement.type !== 'cash_bank') return [422, { message: 'Pemakaian untuk potong hutang diubah lewat menu Hutang Supplier' }]
		const companyId = companyIdOf(config)
		if (isPeriodClosed(companyId, settlement.date))
			return [422, { message: `${closedMessage(settlement.date)}, pengembalian dana tidak bisa diubah` }]
		const body = JSON.parse(config.data) as PurchaseReturnSettlementRequest
		if (!isDate(body.date)) return [422, invalid('Tanggal wajib diisi', 'date')]
		if (body.date > today()) return [422, invalid('Tanggal tidak boleh melebihi hari ini', 'date')]
		if (body.date < row.date) return [422, invalid('Tanggal tidak boleh sebelum tanggal retur', 'date')]
		if (isPeriodClosed(companyId, body.date)) return [422, invalid(closedMessage(body.date), 'date')]
		if (!db.bankAccount.some((item) => item.id === Number(body.bank_account_id) && !item.deleted_at))
			return [422, invalid('Rekening cash / bank wajib dipilih', 'bank_account_id')]
		const amount = Math.round(Number(body.amount))
		if (!(amount > 0)) return [422, invalid('Nominal harus lebih dari nol', 'amount')]
		// What this refund may grow to: the return's balance plus what it already holds.
		const capacity = resolve(row, companyId).remaining_total + settlement.amount
		if (amount > capacity) return [422, invalid(`Nominal melebihi sisa retur (${capacity})`, 'amount')]
		Object.assign(settlement, {
			date: body.date,
			bank_account_id: Number(body.bank_account_id),
			description: String(body.description || '').trim(),
			amount
		})
		recordHistory('purchase-return', row.id, { title: 'Pengembalian Dana Diubah', kind: 'updated', summary: fmtMoney(amount) })
		return [200, { data: resolve(row, companyId), message: 'Pengembalian dana diperbarui' }]
	})

	mock.onDelete(/\/purchase-return\/\d+\/settlements\/\d+$/).reply((config) => {
		const row = db.purchaseReturn.find((item) => item.id === grandParentIdOf(config.url))
		if (!row) return [404, { message: 'Retur pembelian tidak ditemukan' }]
		const index = db.purchaseReturnSettlement.findIndex((item) => item.id === idOf(config.url) && item.purchase_return_id === row.id)
		if (index < 0) return [404, { message: 'Penyelesaian retur tidak ditemukan' }]
		const settlement = db.purchaseReturnSettlement[index]
		if (settlement.type !== 'cash_bank') return [422, { message: 'Pemakaian untuk potong hutang dibatalkan lewat menu Hutang Supplier' }]
		const companyId = companyIdOf(config)
		if (isPeriodClosed(companyId, settlement.date))
			return [422, { message: `${closedMessage(settlement.date)}, pengembalian dana tidak bisa dibatalkan` }]
		db.purchaseReturnSettlement.splice(index, 1)
		recordHistory('purchase-return', row.id, { title: 'Pengembalian Dana Dibatalkan', kind: 'info', summary: fmtMoney(settlement.amount) })
		return [200, { data: resolve(row, companyId), message: 'Pengembalian dana dibatalkan' }]
	})

	mock.onGet(/\/purchase-return\/\d+\/tax-invoice$/).reply((config) => {
		const row = db.purchaseReturn.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: 'Retur pembelian tidak ditemukan' }]
		if (!row.pkp_active) return [422, { message: 'Retur non-PKP tidak memiliki faktur pajak' }]
		return [200, { data: row.tax_invoice }]
	})

	mock.onPut(/\/purchase-return\/\d+\/tax-invoice$/).reply((config) => {
		const row = db.purchaseReturn.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: 'Retur pembelian tidak ditemukan' }]
		if (!row.pkp_active) return [422, { message: 'Retur non-PKP tidak memiliki faktur pajak' }]
		if (row.approval_status !== 'approved') return [422, { message: 'Faktur pajak hanya bisa diisi untuk retur yang sudah disetujui' }]
		const body = JSON.parse(config.data) as { number?: string; date?: string; file?: JournalAttachment | null }
		const number = String(body.number || '').trim()
		if (!number) return [422, invalid('Nomor faktur pajak wajib diisi', 'number')]
		if (number.length > 25) return [422, invalid('Nomor faktur pajak maksimal 25 karakter', 'number')]
		if (!isDate(body.date)) return [422, invalid('Tanggal faktur pajak wajib diisi', 'date')]
		const file = body.file ?? null
		if (file && !TAX_FILE_TYPES.includes(file.type)) return [422, invalid('Lampiran harus berupa PDF, JPG, atau PNG', 'file')]
		if (file && file.size > 5 * 1024 * 1024) return [422, invalid('Ukuran lampiran maksimal 5 MB', 'file')]
		const lower = number.toLowerCase()
		const duplicate =
			db.purchaseReturn.some((item) => item.id !== row.id && item.tax_invoice?.number.toLowerCase() === lower) ||
			db.purchaseInvoice.some((item) => item.tax_invoice?.number.toLowerCase() === lower)
		if (duplicate) return [422, invalid('Nomor faktur pajak sudah dipakai dokumen lain', 'number')]
		const previous = row.tax_invoice
		row.tax_invoice = { number, date: String(body.date), file }
		recordHistory('purchase-return', row.id, {
			title: previous ? 'Faktur Pajak Diubah' : 'Faktur Pajak Disimpan',
			kind: 'info',
			summary: number,
			changes: previous ? diffFields(previous, row.tax_invoice, TAX_FIELDS) : []
		})
		return [200, { data: resolve(row, companyIdOf(config)), message: 'Faktur pajak disimpan' }]
	})
}
