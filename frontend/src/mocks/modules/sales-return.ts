import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { companyCode, salesReturnNumber } from '../numbering'
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
import { closedDateReply, closedMessage, closedReply, isPeriodClosed } from './posting'
import { findSalesInvoice, invoiceOutstanding, unapproveGuards } from './sales-invoice'
import type { SalesReturnRow, SalesReturnSettlementRow } from '../fixtures/sales-return'
import type {
	JournalAttachment,
	SalesInvoice,
	SalesInvoiceReturnableLines,
	SalesReturn,
	SalesReturnApprovalStatus,
	SalesReturnLine,
	SalesReturnRequest,
	SalesReturnSettlement,
	SalesReturnSettlementRequest,
	SalesReturnTaxInvoice
} from '@/utils/types'

// Contract: docs/sales-return/.
const VAT_RATE = 11
const TAX_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const NOT_FOUND = 'Retur penjualan tidak ditemukan'
const idOf = (url?: string) => Number(url?.split('/').at(-1))
const parentIdOf = (url?: string) => Number(url?.split('/').at(-2))
const grandParentIdOf = (url?: string) => Number(url?.split('/').at(-3))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))
const today = () => new Date().toISOString().slice(0, 10)

const invalid = (message: string, field?: string) => ({
	message: field ? 'Validasi gagal' : message,
	...(field ? { errors: { [field]: [message] } } : {})
})

// Server-authoritative amounts: price − discount come from the invoice line; ppn only when the invoice is PKP.
function amounts(quantity: number, price: number, discount: number, isPkp: boolean) {
	const dpp = Math.round((price - discount) * quantity)
	const ppn = isPkp ? Math.round((dpp * VAT_RATE) / 100) : 0
	return { dpp, ppn, total: dpp + ppn }
}

// Quantity of `variantId` already returned on this invoice by OTHER returns — a rejected return releases its quantity.
const returnedBefore = (invoiceId: number, variantId: number, exceptId = 0) =>
	db.salesReturn
		.filter((item) => item.sales_invoice_id === invoiceId && item.id !== exceptId && item.approval_status !== 'rejected')
		.flatMap((item) => item.lines)
		.filter((line) => line.variant_id === variantId)
		.reduce((sum, line) => sum + line.quantity, 0)

function resolveLine(invoice: SalesInvoice | undefined, variantId: number, quantity: number, returnId: number, isPkp: boolean): SalesReturnLine {
	const source = invoice?.lines.find((line) => line.variant_id === variantId)
	const price = source?.price ?? 0
	const discount = source?.discount ?? 0
	return {
		variant_id: variantId,
		product_id: source?.product_id ?? 0,
		product_code: source?.product_code,
		product_name: source?.product_name,
		sku: source?.sku,
		variant_label: source?.variant_label,
		brand_name: source?.brand_name,
		unit_name: source?.unit_name,
		quantity_sold: source?.quantity ?? 0,
		quantity_returned_before: returnedBefore(invoice?.id ?? 0, variantId, returnId),
		quantity,
		price,
		discount,
		...amounts(quantity, price, discount, isPkp)
	}
}

const settlementsOf = (returnId: number, companyId: number | null): SalesReturnSettlement[] =>
	db.salesReturnSettlement
		.filter((item) => item.sales_return_id === returnId)
		.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
		.map((item) => ({
			id: item.id,
			date: item.date,
			type: item.type,
			bank_account_id: item.bank_account_id,
			bank_account_name: db.bankAccount.find((bank) => bank.id === item.bank_account_id)?.bank_name,
			description: item.description,
			amount: item.amount,
			locked: isPeriodClosed(companyId, item.date)
		}))

function resolve(row: SalesReturnRow, companyId: number | null = null): SalesReturn {
	const invoice = findSalesInvoice(row.sales_invoice_id)
	const warehouse = db.warehouse.find((item) => item.id === row.warehouse_id && !item.deleted_at)
	const lines = row.lines.map((line) => resolveLine(invoice, line.variant_id, line.quantity, row.id, row.pkp_active))
	const dpp = lines.reduce((sum, line) => sum + line.dpp, 0)
	const ppn = lines.reduce((sum, line) => sum + line.ppn, 0)
	const total = dpp + ppn
	const settlements = settlementsOf(row.id, companyId)
	const used_total = settlements.filter((item) => item.type === 'receivable_deduction').reduce((sum, item) => sum + item.amount, 0)
	const refunded_total = settlements.filter((item) => item.type === 'cash_bank').reduce((sum, item) => sum + item.amount, 0)
	const remaining_total = Math.max(total - used_total - refunded_total, 0)
	return {
		...row,
		sales_invoice_number: invoice?.number,
		sales_invoice_date: invoice?.date,
		customer_id: invoice?.customer_id,
		customer_code: invoice?.customer_code,
		customer_name: invoice?.customer_name,
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
		invoice_outstanding: invoiceOutstanding(row.sales_invoice_id),
		settlement_status: row.approval_status === 'approved' && remaining_total === 0 ? 'settled' : 'open',
		locked: isPeriodClosed(companyId, row.date),
		settlements
	}
}

function validate(body: SalesReturnRequest, invoice: SalesInvoice, returnId = 0): ReturnType<typeof invalid> | null {
	if (!isDate(body.date)) return invalid('Tanggal wajib diisi', 'date')
	if (body.date > today()) return invalid('Tanggal tidak boleh melebihi hari ini', 'date')
	if (body.date < invoice.date) return invalid('Tanggal retur tidak boleh sebelum tanggal invoice', 'date')
	if (!db.warehouse.some((item) => item.id === Number(body.warehouse_id) && !item.deleted_at)) return invalid('Gudang wajib dipilih', 'warehouse_id')
	const reason = String(body.reason || '').trim()
	if (!reason) return invalid('Alasan retur wajib diisi', 'reason')
	if (reason.length > 250) return invalid('Alasan retur maksimal 250 karakter', 'reason')
	const sent = Array.isArray(body.lines) ? body.lines : []
	if (new Set(sent.map((line) => Number(line.variant_id))).size !== sent.length)
		return invalid('Varian produk tidak boleh muncul lebih dari satu kali', 'lines')
	if (!sent.some((line) => Number(line.quantity) > 0)) return invalid('Isi jumlah retur minimal satu produk', 'lines')
	for (const line of sent) {
		const source = invoice.lines.find((item) => item.variant_id === Number(line.variant_id))
		if (!source) return invalid('Produk retur harus berasal dari invoice', 'lines')
		const quantity = Number(line.quantity)
		if (!(quantity >= 0)) return invalid('Jumlah retur tidak valid', 'lines')
		const available = source.quantity - returnedBefore(invoice.id, source.variant_id, returnId)
		if (quantity > available) return invalid(`Jumlah retur ${source.product_name} melebihi sisa yang bisa diretur (${available})`, 'lines')
	}
	return null
}

const storedLines = (body: SalesReturnRequest): SalesReturnRow['lines'] =>
	body.lines.filter((line) => Number(line.quantity) > 0).map((line) => ({ variant_id: Number(line.variant_id), quantity: Number(line.quantity) }))

// ---- settlements ----

// Common checks of a new / edited settlement; `capacity` = what the amount may reach (return balance [+ the settlement's own amount]).
function validateSettlement(
	body: SalesReturnSettlementRequest,
	row: SalesReturnRow,
	companyId: number | null,
	capacity: number,
	invoiceCapacity: number
): ReturnType<typeof invalid> | null {
	if (!isDate(body.date)) return invalid('Tanggal wajib diisi', 'date')
	if (body.date > today()) return invalid('Tanggal tidak boleh melebihi hari ini', 'date')
	if (body.date < row.date) return invalid('Tanggal tidak boleh sebelum tanggal retur', 'date')
	if (isPeriodClosed(companyId, body.date)) return invalid(closedMessage(body.date), 'date')
	if (body.type === 'cash_bank' && !db.bankAccount.some((item) => item.id === Number(body.bank_account_id) && !item.deleted_at))
		return invalid('Rekening cash / bank wajib dipilih', 'bank_account_id')
	const amount = Math.round(Number(body.amount))
	if (!(amount > 0)) return invalid('Nominal harus lebih dari nol', 'amount')
	if (amount > capacity) return invalid(`Nominal melebihi sisa retur (${capacity})`, 'amount')
	if (body.type === 'receivable_deduction' && amount > invoiceCapacity)
		return invalid(`Nominal melebihi sisa piutang invoice (${invoiceCapacity})`, 'amount')
	return null
}

const INVOICE_DESCRIPTION = (invoiceNumber?: string) => `Potong piutang invoice ${invoiceNumber ?? ''}`.trim()

const FIELDS: FieldSpec<SalesReturn>[] = [
	{ key: 'date', label: 'Tanggal', format: fmtDate },
	{ key: 'warehouse_name', label: 'Gudang' },
	{ key: 'reason', label: 'Alasan Retur' }
]
const LINE_FIELDS: FieldSpec<SalesReturnLine>[] = [{ key: 'quantity', label: 'Jumlah Retur' }]
const TAX_FIELDS: FieldSpec<SalesReturnTaxInvoice>[] = [
	{ key: 'number', label: 'Nomor Faktur Pajak' },
	{ key: 'date', label: 'Tanggal Faktur Pajak', format: fmtDate },
	{ key: 'file', label: 'File Faktur Pajak', format: (file) => (file as JournalAttachment | null)?.name ?? '–' }
]

// "Batalkan Approval" of an invoice is refused while a (non-rejected) return hangs on it.
const invoiceHasReturn = (invoiceId: number) =>
	db.salesReturn.some((item) => item.sales_invoice_id === invoiceId && item.approval_status !== 'rejected')
		? 'Invoice sudah memiliki retur penjualan, tidak bisa membatalkan approval'
		: null

export function registerSalesReturn(mock: MockAdapter) {
	if (!unapproveGuards.includes(invoiceHasReturn)) unapproveGuards.push(invoiceHasReturn)
	registerHistoryRoute(mock, 'sales-return', (id) => db.salesReturn.some((item) => item.id === id), NOT_FOUND)

	mock.onGet(/\/sales-invoice\/\d+\/returnable-lines$/).reply((config) => {
		const invoice = findSalesInvoice(parentIdOf(config.url))
		if (!invoice) return [404, { message: 'Invoice penjualan tidak ditemukan' }]
		if (invoice.approval_status !== 'approved') return [422, { message: 'Hanya invoice yang sudah disetujui yang bisa diretur' }]
		const exceptId = Number((config.params as { exclude_return_id?: number } | undefined)?.exclude_return_id) || 0
		const data: SalesInvoiceReturnableLines = {
			sales_invoice: {
				id: invoice.id,
				number: invoice.number,
				date: invoice.date,
				customer_id: invoice.customer_id,
				customer_code: invoice.customer_code,
				customer_name: invoice.customer_name,
				department_code: invoice.department_code,
				department_name: invoice.department_name,
				pkp_active: invoice.pkp_active,
				outstanding: invoice.outstanding
			},
			lines: invoice.lines.map((line) => resolveLine(invoice, line.variant_id, 0, exceptId, invoice.pkp_active))
		}
		return [200, { data }]
	})

	mock.onGet('/sales-return').reply((config) => {
		const p = (config.params ?? {}) as ListParams & {
			approval_status?: string
			settlement_status?: string
			customer_id?: string | number
			date_from?: string
			date_to?: string
		}
		const companyId = companyIdOf(config)
		let rows = db.salesReturn.map((item) => resolve(item, companyId))
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((row) =>
				[row.number, row.sales_invoice_number, row.customer_code, row.customer_name, row.reason].join(' ').toLowerCase().includes(q)
			)
		}
		if (p.customer_id) rows = rows.filter((row) => row.customer_id === Number(p.customer_id))
		if (p.date_from) rows = rows.filter((row) => row.date >= String(p.date_from))
		if (p.date_to) rows = rows.filter((row) => row.date <= String(p.date_to))
		// KPI tiles: honour search + dates, ignore the status filters below (docs/conventions.md).
		const summary = summarize(
			rows,
			{
				pending: (row) => row.approval_status === 'pending',
				open: (row) => row.approval_status === 'approved' && row.settlement_status === 'open',
				settled: (row) => row.settlement_status === 'settled',
				rejected: (row) => row.approval_status === 'rejected'
			},
			(row) => row.remaining_total,
			['pending', 'open']
		)
		if (p.approval_status) rows = rows.filter((row) => row.approval_status === p.approval_status)
		if (p.settlement_status) rows = rows.filter((row) => row.settlement_status === p.settlement_status)
		const page = paginate(sortBy(rows, p.sort_by, p.sort_order), p)
		return [200, { data: page.data, meta: { ...page.meta, summary } }]
	})

	mock.onGet(/\/sales-return\/\d+$/).reply((config) => {
		const row = db.salesReturn.find((item) => item.id === idOf(config.url))
		return row ? [200, { data: resolve(row, companyIdOf(config)) }] : [404, { message: NOT_FOUND }]
	})

	mock.onPost('/sales-return').reply((config) => {
		const body = JSON.parse(config.data) as SalesReturnRequest
		const closedDate = closedDateReply(config, body.date)
		if (closedDate) return closedDate
		const invoice = findSalesInvoice(Number(body.sales_invoice_id))
		if (!invoice) return [422, invalid('Invoice penjualan wajib dipilih', 'sales_invoice_id')]
		if (invoice.approval_status !== 'approved') return [422, invalid('Hanya invoice yang sudah disetujui yang bisa diretur', 'sales_invoice_id')]
		const error = validate(body, invoice)
		if (error) return [422, error]
		const id = nextId(db.salesReturn)
		const row: SalesReturnRow = {
			id,
			number: salesReturnNumber(
				companyCode(config),
				body.date,
				db.salesReturn.map((item) => item.number)
			),
			date: body.date,
			sales_invoice_id: invoice.id,
			warehouse_id: Number(body.warehouse_id),
			reason: String(body.reason).trim(),
			pkp_active: invoice.pkp_active,
			approval_status: 'pending',
			rejection_reason: null,
			approved_by: null,
			approved_at: null,
			tax_invoice: null,
			created_by: userName(),
			created_at: new Date().toISOString(),
			lines: storedLines(body)
		}
		db.salesReturn.unshift(row)
		recordHistory('sales-return', id, { title: 'Dibuat', kind: 'created', summary: `Dari invoice ${invoice.number}` })
		return [201, { data: resolve(row, companyIdOf(config)), message: 'Retur penjualan ditambahkan' }]
	})

	mock.onPut(/\/sales-return\/\d+$/).reply((config) => {
		const row = db.salesReturn.find((item) => item.id === idOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		const closed = closedReply(config, row.date, 'retur penjualan tidak bisa diubah')
		if (closed) return closed
		if (row.approval_status === 'approved') return [422, { message: 'Retur yang sudah disetujui tidak boleh diubah' }]
		const body = JSON.parse(config.data) as SalesReturnRequest
		const closedDate = closedDateReply(config, body.date)
		if (closedDate) return closedDate
		const invoice = findSalesInvoice(row.sales_invoice_id) as SalesInvoice // the source invoice is fixed
		const error = validate(body, invoice, row.id)
		if (error) return [422, error]
		const before = resolve(row, companyIdOf(config))
		Object.assign(row, { date: body.date, warehouse_id: Number(body.warehouse_id), reason: String(body.reason).trim(), lines: storedLines(body) })
		const after = resolve(row, companyIdOf(config))
		recordUpdate('sales-return', row.id, [
			...diffFields(before, after, FIELDS),
			...diffLines(before.lines, after.lines, {
				id: (line) => line.variant_id,
				name: (line) => [line.product_name ?? `Produk #${line.product_id}`, line.variant_label].filter(Boolean).join(' · '),
				specs: LINE_FIELDS
			})
		])
		return [200, { data: after, message: 'Retur penjualan diperbarui' }]
	})

	mock.onDelete(/\/sales-return\/\d+$/).reply((config) => {
		const index = db.salesReturn.findIndex((item) => item.id === idOf(config.url))
		if (index < 0) return [404, { message: NOT_FOUND }]
		const row = db.salesReturn[index]
		const closed = closedReply(config, row.date, 'retur penjualan tidak bisa dihapus')
		if (closed) return closed
		if (row.approval_status === 'approved') return [422, { message: 'Retur yang sudah disetujui tidak boleh dihapus' }]
		db.salesReturn.splice(index, 1)
		purgeHistory('sales-return', row.id)
		return [200, { message: 'Retur penjualan dihapus' }]
	})

	mock.onPatch(/\/sales-return\/\d+\/approval$/).reply((config) => {
		const row = db.salesReturn.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		const { status } = JSON.parse(config.data) as { status?: SalesReturnApprovalStatus }
		if (!['pending', 'approved', 'rejected'].includes(String(status))) return [422, { message: 'Status persetujuan tidak valid' }]
		const from = row.approval_status
		const verb =
			status === 'approved' ? 'disetujui' : status === 'rejected' ? 'ditolak' : from === 'rejected' ? 'diajukan ulang' : 'dibatalkan approval-nya'
		const closed = closedReply(config, row.date, `retur penjualan tidak bisa ${verb}`)
		if (closed) return closed
		const allowed = (from === 'pending' && status !== 'pending') || (from !== 'pending' && status === 'pending')
		if (!allowed) return [422, { message: 'Perubahan status persetujuan tidak valid' }]
		const invoice = findSalesInvoice(row.sales_invoice_id)
		if (status === 'approved' && invoice?.approval_status !== 'approved') return [422, { message: 'Invoice sumber belum disetujui' }]
		if (from === 'approved' && db.salesReturnSettlement.some((item) => item.sales_return_id === row.id))
			return [422, { message: 'Persetujuan tidak bisa dibatalkan karena retur sudah dipakai atau dikembalikan' }]
		if (from === 'rejected') {
			// Ajukan Ulang: the quantity was released on reject — it must still fit.
			const over = row.lines.find((line) => {
				const sold = invoice?.lines.find((item) => item.variant_id === line.variant_id)?.quantity ?? 0
				return line.quantity > sold - returnedBefore(row.sales_invoice_id, line.variant_id, row.id)
			})
			if (over) return [422, { message: 'Jumlah retur melebihi sisa yang bisa diretur, ubah retur terlebih dahulu' }]
		}
		row.approval_status = status as SalesReturnApprovalStatus
		row.rejection_reason = status === 'rejected' ? 'Retur ditolak, silakan periksa kembali detailnya.' : null
		row.approved_by = status === 'approved' ? userName() : null
		row.approved_at = status === 'approved' ? new Date().toISOString() : null
		if (status === 'approved') recordHistory('sales-return', row.id, { title: 'Disetujui', kind: 'approved' })
		else if (status === 'rejected') recordHistory('sales-return', row.id, { title: 'Ditolak', kind: 'rejected', summary: row.rejection_reason })
		else recordHistory('sales-return', row.id, { title: from === 'rejected' ? 'Diajukan Ulang' : 'Approval Dibatalkan', kind: 'info' })
		return [200, { data: resolve(row, companyIdOf(config)), message: 'Status persetujuan diperbarui' }]
	})

	mock.onPost(/\/sales-return\/\d+\/settlements$/).reply((config) => {
		const row = db.salesReturn.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		if (row.approval_status !== 'approved') return [422, { message: 'Retur harus disetujui sebelum diselesaikan' }]
		const body = JSON.parse(config.data) as SalesReturnSettlementRequest
		if (!['receivable_deduction', 'cash_bank'].includes(String(body.type))) return [422, invalid('Cara penyelesaian wajib dipilih', 'type')]
		const companyId = companyIdOf(config)
		const current = resolve(row, companyId)
		const error = validateSettlement(body, row, companyId, current.remaining_total, current.invoice_outstanding)
		if (error) return [422, error]
		const amount = Math.round(Number(body.amount))
		const deduction = body.type === 'receivable_deduction'
		let invoicePaymentId: number | null = null
		if (deduction) {
			invoicePaymentId = nextId(db.salesInvoicePayment)
			db.salesInvoicePayment.push({
				id: invoicePaymentId,
				invoice_id: row.sales_invoice_id,
				date: body.date,
				payment_type_id: 0,
				payment_type: 'Retur Penjualan',
				method: 'cash_bank',
				reference: row.number,
				amount,
				kind: 'receivable',
				return_id: row.id
			})
		}
		const settlement: SalesReturnSettlementRow = {
			id: nextId(db.salesReturnSettlement),
			sales_return_id: row.id,
			date: body.date,
			type: body.type,
			bank_account_id: deduction ? null : Number(body.bank_account_id),
			description: String(body.description || '').trim() || (deduction ? INVOICE_DESCRIPTION(current.sales_invoice_number) : ''),
			amount,
			invoice_payment_id: invoicePaymentId
		}
		db.salesReturnSettlement.push(settlement)
		recordHistory('sales-return', row.id, {
			title: deduction ? 'Potong Piutang Dicatat' : 'Pengembalian Dana Dicatat',
			kind: 'info',
			summary: fmtMoney(amount)
		})
		if (deduction)
			recordHistory('sales-invoice', row.sales_invoice_id, {
				title: 'Dibayar dengan Retur Penjualan',
				kind: 'info',
				summary: `${row.number} · ${fmtMoney(amount)}`
			})
		return [201, { data: resolve(row, companyId), message: deduction ? 'Potong piutang dicatat' : 'Pengembalian dana dicatat' }]
	})

	// Edit a settlement (date, bank account, amount, description). The type is fixed. Locked once its own date is in a closed period.
	mock.onPut(/\/sales-return\/\d+\/settlements\/\d+$/).reply((config) => {
		const row = db.salesReturn.find((item) => item.id === grandParentIdOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		const settlement = db.salesReturnSettlement.find((item) => item.id === idOf(config.url) && item.sales_return_id === row.id)
		if (!settlement) return [404, { message: 'Penyelesaian retur tidak ditemukan' }]
		const companyId = companyIdOf(config)
		const label = settlement.type === 'cash_bank' ? 'pengembalian dana' : 'potong piutang'
		if (isPeriodClosed(companyId, settlement.date)) return [422, { message: `${closedMessage(settlement.date)}, ${label} tidak bisa diubah` }]
		const body = { ...(JSON.parse(config.data) as SalesReturnSettlementRequest), type: settlement.type }
		const payment = db.salesInvoicePayment.find((item) => item.id === settlement.invoice_payment_id)
		const current = resolve(row, companyId)
		const error = validateSettlement(
			body,
			row,
			companyId,
			current.remaining_total + settlement.amount,
			current.invoice_outstanding + (payment?.amount ?? 0)
		)
		if (error) return [422, error]
		const amount = Math.round(Number(body.amount))
		Object.assign(settlement, {
			date: body.date,
			bank_account_id: settlement.type === 'cash_bank' ? Number(body.bank_account_id) : null,
			description: String(body.description || '').trim(),
			amount
		})
		if (payment) Object.assign(payment, { date: body.date, amount }) // keep the invoice's payment row in sync
		recordHistory('sales-return', row.id, {
			title: settlement.type === 'cash_bank' ? 'Pengembalian Dana Diubah' : 'Potong Piutang Diubah',
			kind: 'updated',
			summary: fmtMoney(amount)
		})
		return [
			200,
			{ data: resolve(row, companyId), message: settlement.type === 'cash_bank' ? 'Pengembalian dana diperbarui' : 'Potong piutang diperbarui' }
		]
	})

	mock.onDelete(/\/sales-return\/\d+\/settlements\/\d+$/).reply((config) => {
		const row = db.salesReturn.find((item) => item.id === grandParentIdOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		const index = db.salesReturnSettlement.findIndex((item) => item.id === idOf(config.url) && item.sales_return_id === row.id)
		if (index < 0) return [404, { message: 'Penyelesaian retur tidak ditemukan' }]
		const settlement = db.salesReturnSettlement[index]
		const companyId = companyIdOf(config)
		const label = settlement.type === 'cash_bank' ? 'pengembalian dana' : 'potong piutang'
		if (isPeriodClosed(companyId, settlement.date)) return [422, { message: `${closedMessage(settlement.date)}, ${label} tidak bisa dibatalkan` }]
		db.salesReturnSettlement.splice(index, 1)
		if (settlement.invoice_payment_id) db.salesInvoicePayment = db.salesInvoicePayment.filter((item) => item.id !== settlement.invoice_payment_id)
		recordHistory('sales-return', row.id, {
			title: settlement.type === 'cash_bank' ? 'Pengembalian Dana Dibatalkan' : 'Potong Piutang Dibatalkan',
			kind: 'info',
			summary: fmtMoney(settlement.amount)
		})
		if (settlement.type === 'receivable_deduction')
			recordHistory('sales-invoice', row.sales_invoice_id, {
				title: 'Pembayaran Retur Penjualan Dibatalkan',
				kind: 'info',
				summary: `${row.number} · ${fmtMoney(settlement.amount)}`
			})
		return [
			200,
			{ data: resolve(row, companyId), message: settlement.type === 'cash_bank' ? 'Pengembalian dana dibatalkan' : 'Potong piutang dibatalkan' }
		]
	})

	// Faktur pajak: not locked by the closing period (no stok / jurnal effect); PKP + approved only.
	mock.onGet(/\/sales-return\/\d+\/tax-invoice$/).reply((config) => {
		const row = db.salesReturn.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		if (!row.pkp_active) return [422, { message: 'Retur non-PKP tidak memiliki faktur pajak' }]
		return [200, { data: row.tax_invoice }]
	})

	mock.onPut(/\/sales-return\/\d+\/tax-invoice$/).reply((config) => {
		const row = db.salesReturn.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
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
			db.salesReturn.some((item) => item.id !== row.id && item.tax_invoice?.number.toLowerCase() === lower) ||
			db.salesInvoice.some((item) => item.tax_invoice?.number.toLowerCase() === lower)
		if (duplicate) return [422, invalid('Nomor faktur pajak sudah dipakai dokumen lain', 'number')]
		const previous = row.tax_invoice
		row.tax_invoice = { number, date: String(body.date), file }
		recordHistory('sales-return', row.id, {
			title: previous ? 'Faktur Pajak Diubah' : 'Faktur Pajak Disimpan',
			kind: 'info',
			summary: number,
			changes: previous ? diffFields(previous, row.tax_invoice, TAX_FIELDS) : []
		})
		return [200, { data: resolve(row, companyIdOf(config)), message: 'Faktur pajak disimpan' }]
	})
}
