import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { companyCode, salesInvoiceNumber } from '../numbering'
import { nextId, paginate, sortBy, summarize, type ListParams } from '../lib'
import { closedDateReply, closedReply, withLock } from './posting'
import { applyInvoicedQuantity, lineTotal, totalsOf } from './sales-order'
import { resolve as resolveDeposit } from './customer-deposit'
import { BIAYA_PAYMENT_TYPE as BIAYA } from '@/constant/payment'
import {
	diffFields,
	diffLines,
	fmtDate,
	fmtMoney,
	fmtPkp,
	purgeHistory,
	recordHistory,
	recordUpdate,
	registerHistoryRoute,
	type FieldSpec
} from '../history'
import type { SalesInvoiceRow } from '../fixtures/sales-invoice'
import type {
	JournalAttachment,
	SalesInvoice,
	SalesInvoiceApprovalStatus,
	SalesInvoiceLine,
	SalesInvoicePayment,
	SalesInvoicePaymentStatus,
	SalesInvoiceRequest,
	SalesInvoiceTaxInvoice,
	SalesOrderExpense
} from '@/utils/types'

const TOP_DAYS = [0, 7, 14, 21, 30, 60, 90, 120]
const PAYMENT_METHODS = ['cash_bank', 'down_payment']
const TAX_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const NOT_FOUND = 'Invoice penjualan tidak ditemukan'
const idOf = (url?: string) => Number(url?.split('/').at(-1))
const parentIdOf = (url?: string) => Number(url?.split('/').at(-2))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))
const userName = () => {
	try {
		return JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin'
	} catch {
		return 'Admin'
	}
}

function dueDate(date: string, days: number) {
	const d = new Date(`${date}T00:00:00Z`)
	d.setUTCDate(d.getUTCDate() + days)
	return d.toISOString().slice(0, 10)
}

const paymentsOf = (invoiceId: number) =>
	db.salesInvoicePayment.filter((item) => item.invoice_id === invoiceId).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)

// ---- helpers for the next wave (Surat Jalan, Retur, Piutang Customer) ----

/** Σ of ALL payment rows of an invoice (`creation` + `receivable`). */
export const invoicePaidTotal = (invoiceId: number) => paymentsOf(invoiceId).reduce((sum, item) => sum + item.amount, 0)

/** Sisa = total − paid_total; 0 when the invoice does not exist. */
export function invoiceOutstanding(invoiceId: number) {
	const row = db.salesInvoice.find((item) => item.id === invoiceId)
	return row ? totalsOf(row).total - invoicePaidTotal(invoiceId) : 0
}

/** Guards for "Batalkan Approval": a downstream module (Surat Jalan, Retur) pushes `(invoiceId) => message | null`; a message blocks the unapprove. */
export const unapproveGuards: ((invoiceId: number) => string | null)[] = []

// Quantity of this invoice that counts against its sales order (a rejected invoice is released).
const countedQuantity = (row: SalesInvoiceRow, productId: number) =>
	row.approval_status === 'rejected' ? 0 : (row.lines.find((line) => line.product_id === productId)?.quantity ?? 0)

// Most this invoice may carry of one product: ordered − what OTHER invoices already took.
function orderLimit(orderId: number, productId: number, own?: SalesInvoiceRow): number | null {
	const target = db.salesOrder.find((item) => item.id === orderId)?.lines.find((line) => line.product_id === productId)
	return target ? target.quantity - (target.invoiced_quantity - (own ? countedQuantity(own, productId) : 0)) : null
}

function lineOf(line: SalesInvoiceRow['lines'][number], row: SalesInvoiceRow): SalesInvoiceLine {
	const product = db.product.find((item) => item.id === Number(line.product_id) && !item.deleted_at)
	const warehouse = db.warehouse.find((item) => item.id === Number(line.warehouse_id) && !item.deleted_at)
	return {
		product_id: Number(line.product_id),
		product_code: product?.code,
		product_name: product?.name,
		brand_name: product?.brand_name,
		unit_name: product?.unit_name,
		warehouse_id: Number(line.warehouse_id),
		warehouse_code: warehouse?.code,
		warehouse_name: warehouse?.name,
		quantity: line.quantity,
		price: line.price,
		discount: line.discount,
		notes: line.notes,
		total: lineTotal(line),
		max_quantity: row.sales_order_id ? orderLimit(row.sales_order_id, line.product_id, row) : null
	}
}

function expenseOf(expense: SalesInvoiceRow['expenses'][number]): SalesOrderExpense {
	const found = db.salesExpense.find((item) => item.id === Number(expense.sales_expense_id))
	return { ...expense, sales_expense_code: found?.code, sales_expense_name: found?.name }
}

function paymentOf(item: SalesInvoicePayment): SalesInvoicePayment {
	return item.deposit_id ? { ...item, deposit_number: db.customerDeposit.find((deposit) => deposit.id === item.deposit_id)?.number } : { ...item }
}

export function resolveSalesInvoice(row: SalesInvoiceRow): SalesInvoice {
	const customer = db.customer.find((item) => item.id === row.customer_id && !item.deleted_at)
	const sales = db.sales.find((item) => item.id === row.sales_id && !item.deleted_at)
	const department = db.department.find((item) => item.id === row.department_id && !item.deleted_at)
	const totals = totalsOf(row)
	const payments = paymentsOf(row.id).map(paymentOf)
	const paid_total = payments.reduce((sum, item) => sum + item.amount, 0)
	const outstanding = totals.total - paid_total
	const payment_status: SalesInvoicePaymentStatus = paid_total <= 0 ? 'unpaid' : outstanding <= 0 ? 'paid' : 'partial'
	return {
		...row,
		due_date: dueDate(row.date, row.top_days),
		customer_code: customer?.code,
		customer_name: customer?.name,
		customer_address: customer?.address,
		customer_phone: customer?.phone,
		sales_code: sales?.code,
		sales_name: sales?.name,
		department_code: department?.code,
		department_name: department?.name,
		sales_order_number: row.sales_order_id ? (db.salesOrder.find((item) => item.id === row.sales_order_id)?.number ?? null) : null,
		lines: row.lines.map((line) => lineOf(line, row)),
		expenses: row.expenses.map(expenseOf),
		...totals,
		payments,
		paid_total,
		outstanding,
		payment_status
	}
}

/** One resolved invoice by id (no `locked` flag — that needs the request's company). */
export function findSalesInvoice(id: number): SalesInvoice | undefined {
	const row = db.salesInvoice.find((item) => item.id === id)
	return row && resolveSalesInvoice(row)
}

function invalid(message: string, field?: string) {
	return { message: 'Validasi gagal', ...(field ? { errors: { [field]: [message] } } : {}) }
}

type Invalid = ReturnType<typeof invalid>

// Header + lines + expenses. `current` = the stored row on update (its own quantity does not count against the order).
function validate(body: SalesInvoiceRequest, orderId: number | null, current?: SalesInvoiceRow): Invalid | null {
	if (!isDate(body.date)) return invalid('Tanggal wajib diisi', 'date')
	if (!db.customer.some((item) => item.id === Number(body.customer_id) && !item.deleted_at)) return invalid('Customer tidak valid', 'customer_id')
	if (!db.sales.some((item) => item.id === Number(body.sales_id) && !item.deleted_at)) return invalid('Sales tidak valid', 'sales_id')
	if (!db.department.some((item) => item.id === Number(body.department_id) && !item.deleted_at))
		return invalid('Departemen tidak valid', 'department_id')
	if (!TOP_DAYS.includes(Number(body.top_days))) return invalid('Termin pembayaran tidak valid', 'top_days')
	if (typeof body.pkp_active !== 'boolean') return invalid('Status PKP wajib dipilih', 'pkp_active')
	if (!['nominal', 'percent'].includes(String(body.discount_type))) return invalid('Jenis diskon tidak valid', 'discount_type')
	if (!Array.isArray(body.lines) || body.lines.length === 0) return invalid('Minimal satu produk harus ditambahkan', 'lines')
	const order = orderId ? db.salesOrder.find((item) => item.id === orderId) : undefined
	if (order && order.customer_id !== Number(body.customer_id)) return invalid('Customer harus sama dengan customer sales order', 'customer_id')
	const seen = new Set<number>()
	for (const line of body.lines) {
		if (!db.product.some((item) => item.id === Number(line.product_id) && !item.deleted_at)) return invalid('Produk tidak valid', 'lines')
		if (seen.has(Number(line.product_id))) return invalid('Produk yang sama tidak boleh ditambahkan dua kali', 'lines')
		seen.add(Number(line.product_id))
		if (!db.warehouse.some((item) => item.id === Number(line.warehouse_id) && !item.deleted_at)) return invalid('Gudang tidak valid', 'lines')
		if (!(Number(line.quantity) > 0)) return invalid('Jumlah harus lebih dari nol', 'lines')
		if (!(Number(line.price) > 0)) return invalid('Harga satuan harus lebih dari nol', 'lines')
		if (Number(line.discount) < 0) return invalid('Diskon tidak boleh negatif', 'lines')
		if (Number(line.discount) > Number(line.price)) return invalid('Diskon per satuan tidak boleh melebihi harga', 'lines')
		if (orderId) {
			const limit = orderLimit(orderId, Number(line.product_id), current)
			if (limit === null) return invalid('Produk tidak ada di sales order', 'lines')
			if (Number(line.quantity) > limit) return invalid(`Jumlah melebihi sisa sales order (maksimal ${limit})`, 'lines')
		}
	}
	const value = Number(body.discount_value)
	if (!(value >= 0)) return invalid('Diskon tidak boleh negatif', 'discount_value')
	if (body.discount_type === 'percent' && value > 100) return invalid('Diskon persen maksimal 100', 'discount_value')
	if (body.discount_type === 'nominal' && value > body.lines.reduce((sum, line) => sum + lineTotal(line), 0))
		return invalid('Diskon tidak boleh melebihi subtotal produk', 'discount_value')
	for (const expense of body.expenses ?? []) {
		if (!db.salesExpense.some((item) => item.id === Number(expense.sales_expense_id) && !item.deleted_at))
			return invalid('Biaya penjualan tidak valid', 'expenses')
		if (!(Number(expense.amount) > 0)) return invalid('Nominal biaya harus lebih dari nol', 'expenses')
	}
	return null
}

// Deposit headroom for this invoice: what is left on the deposit plus what THIS invoice already took from it.
function depositHeadroom(depositId: number, invoiceId?: number) {
	const deposit = db.customerDeposit.find((item) => item.id === depositId)
	if (!deposit) return null
	const own = db.customerDepositUsage
		.filter((usage) => usage.customer_deposit_id === depositId && usage.invoice_id === invoiceId)
		.reduce((sum, usage) => sum + usage.amount, 0)
	return { deposit, available: resolveDeposit(deposit).remaining + (invoiceId ? own : 0) }
}

// Creation-time payments: type rules, titipan ownership / headroom, and total ≤ invoice total (receivable rows already on the invoice count).
function validatePayments(body: SalesInvoiceRequest, total: number, receivableTotal: number, invoiceId?: number): Invalid | null {
	const payments = body.payments ?? []
	const perDeposit = new Map<number, number>()
	for (const payment of payments) {
		const isBiaya = Number(payment.payment_type_id) === BIAYA.id
		const type = isBiaya ? undefined : db.paymentType.find((item) => item.id === Number(payment.payment_type_id) && !item.deleted_at)
		if (!isBiaya && (!type || type.transaction_type !== 'sale' || !PAYMENT_METHODS.includes(type.method)))
			return invalid('Tipe pembayaran tidak valid', 'payments')
		if (!(Number(payment.amount) > 0)) return invalid('Nominal pembayaran harus lebih dari nol', 'payments')
		if (isBiaya) {
			if (!db.salesExpense.some((item) => item.id === Number(payment.sales_expense_id) && !item.deleted_at))
				return invalid('Biaya penjualan wajib dipilih', 'payments')
			if (payment.deposit_id) return invalid('Titipan hanya untuk tipe pembayaran titipan', 'payments')
		} else if (type!.method === 'down_payment') {
			const found = payment.deposit_id ? depositHeadroom(Number(payment.deposit_id), invoiceId) : null
			if (!found) return invalid('Titipan customer wajib dipilih', 'payments')
			if (found.deposit.customer_id !== Number(body.customer_id)) return invalid('Titipan harus milik customer invoice ini', 'payments')
			const sum = (perDeposit.get(found.deposit.id) ?? 0) + Number(payment.amount)
			perDeposit.set(found.deposit.id, sum)
			if (sum > found.available) return invalid(`Pemakaian titipan ${found.deposit.number} melebihi sisa (${found.available})`, 'payments')
		} else if (payment.deposit_id) return invalid('Titipan hanya untuk tipe pembayaran titipan', 'payments')
	}
	const paid = payments.reduce((sum, payment) => sum + Math.round(Number(payment.amount)), 0) + receivableTotal
	if (paid > total) return invalid('Total pembayaran melebihi total invoice', 'payments')
	return null
}

const depositKey = (payment: Pick<SalesInvoicePayment, 'deposit_id' | 'amount'>) => `${payment.deposit_id}|${payment.amount}`

// Replaces every `creation` payment of the invoice (and its titipan usage rows) with `body.payments`; `receivable` rows are never touched.
function replaceCreationPayments(row: SalesInvoiceRow, inputs: SalesInvoiceRequest['payments']) {
	const old = db.salesInvoicePayment.filter((item) => item.invoice_id === row.id && item.kind === 'creation')
	db.salesInvoicePayment = db.salesInvoicePayment.filter((item) => !old.includes(item))
	for (const item of old.filter((payment) => payment.deposit_id)) {
		const index = db.customerDepositUsage.findIndex(
			(usage) => usage.customer_deposit_id === item.deposit_id && usage.invoice_id === row.id && usage.amount === item.amount
		)
		if (index >= 0) db.customerDepositUsage.splice(index, 1)
	}
	const added: SalesInvoicePayment[] = []
	for (const input of inputs ?? []) {
		const isBiaya = Number(input.payment_type_id) === BIAYA.id
		const type = isBiaya ? undefined : db.paymentType.find((item) => item.id === Number(input.payment_type_id))!
		const expense = isBiaya ? db.salesExpense.find((item) => item.id === Number(input.sales_expense_id)) : undefined
		const deposit = input.deposit_id ? db.customerDeposit.find((item) => item.id === Number(input.deposit_id)) : undefined
		const payment: SalesInvoicePayment = {
			id: nextId(db.salesInvoicePayment),
			invoice_id: row.id,
			date: row.date,
			payment_type_id: isBiaya ? BIAYA.id : type!.id,
			payment_type: isBiaya ? BIAYA.name : type!.name,
			method: (isBiaya ? BIAYA.method : type!.method) as SalesInvoicePayment['method'],
			reference: expense ? expense.name : deposit ? deposit.number : String(input.reference ?? '').trim(),
			amount: Math.round(Number(input.amount)),
			kind: 'creation',
			...(deposit ? { deposit_id: deposit.id } : {}),
			...(expense ? { sales_expense_id: expense.id } : {})
		}
		db.salesInvoicePayment.push(payment)
		added.push(payment)
		if (deposit)
			db.customerDepositUsage.push({
				id: nextId(db.customerDepositUsage),
				customer_deposit_id: deposit.id,
				date: row.date,
				invoice_id: row.id,
				invoice_number: row.number,
				note: 'PEMBAYARAN INVOICE',
				amount: payment.amount
			})
	}
	// Deposit timeline: only usage that is new / gone since the previous save.
	const oldKeys = old.filter((payment) => payment.deposit_id).map(depositKey)
	const newKeys = added.filter((payment) => payment.deposit_id).map(depositKey)
	for (const payment of added.filter((item) => item.deposit_id && !oldKeys.includes(depositKey(item))))
		recordHistory('customer-deposit', payment.deposit_id!, {
			title: 'Dipakai di Invoice Penjualan',
			kind: 'info',
			summary: `${row.number} · Rp ${payment.amount.toLocaleString('id-ID')}`
		})
	for (const payment of old.filter((item) => item.deposit_id && !newKeys.includes(depositKey(item))))
		recordHistory('customer-deposit', payment.deposit_id!, {
			title: 'Pemakaian Invoice Dibatalkan',
			kind: 'info',
			summary: `${row.number} · Rp ${payment.amount.toLocaleString('id-ID')}`
		})
}

function buildRow(
	body: SalesInvoiceRequest,
	base: Pick<SalesInvoiceRow, 'id' | 'number' | 'sales_order_id'> & Partial<SalesInvoiceRow>
): SalesInvoiceRow {
	return {
		id: base.id,
		number: base.number,
		date: body.date,
		top_days: Number(body.top_days),
		customer_id: Number(body.customer_id),
		sales_id: Number(body.sales_id),
		department_id: Number(body.department_id),
		sales_order_id: base.sales_order_id,
		pkp_active: body.pkp_active,
		description: String(body.description ?? '').trim(),
		discount_type: body.discount_type,
		discount_value: Number(body.discount_value) || 0,
		approval_status: base.approval_status ?? 'pending',
		rejection_reason: base.rejection_reason ?? null,
		approved_by: base.approved_by ?? null,
		approved_at: base.approved_at ?? null,
		// Faktur pajak only exists for PKP invoices.
		tax_invoice: body.pkp_active ? (base.tax_invoice ?? null) : null,
		created_by: base.created_by ?? userName(),
		lines: body.lines.map((line) => ({
			product_id: Number(line.product_id),
			warehouse_id: Number(line.warehouse_id),
			quantity: Math.round(Number(line.quantity) * 1000) / 1000,
			price: Math.round(Number(line.price)),
			discount: Math.round(Number(line.discount)),
			notes: String(line.notes ?? '').trim()
		})),
		expenses: (body.expenses ?? []).map((expense) => ({
			sales_expense_id: Number(expense.sales_expense_id),
			notes: String(expense.notes ?? '').trim(),
			amount: Math.round(Number(expense.amount))
		}))
	}
}

const FIELDS: FieldSpec<SalesInvoice>[] = [
	{ key: 'date', label: 'Tanggal', format: fmtDate },
	{ key: 'customer_name', label: 'Customer' },
	{ key: 'sales_name', label: 'Sales' },
	{ key: 'department_name', label: 'Departemen' },
	{ key: 'top_days', label: 'Termin Pembayaran', format: (value) => `${value} hari` },
	{ key: 'pkp_active', label: 'Status PKP', format: fmtPkp },
	{ key: 'description', label: 'Keterangan' },
	{ key: 'discount_global', label: 'Diskon Global', format: fmtMoney },
	{ key: 'paid_total', label: 'Total Pembayaran', format: fmtMoney }
]
const LINE_FIELDS: FieldSpec<SalesInvoiceLine>[] = [
	{ key: 'quantity', label: 'Jumlah' },
	{ key: 'price', label: 'Harga Satuan', format: fmtMoney },
	{ key: 'discount', label: 'Diskon', format: fmtMoney },
	{ key: 'warehouse_name', label: 'Gudang' },
	{ key: 'notes', label: 'Keterangan Baris' }
]
const EXPENSE_FIELDS: FieldSpec<SalesOrderExpense>[] = [
	{ key: 'amount', label: 'Nominal', format: fmtMoney },
	{ key: 'notes', label: 'Keterangan' }
]
const TAX_FIELDS: FieldSpec<SalesInvoiceTaxInvoice>[] = [
	{ key: 'number', label: 'Nomor Faktur Pajak' },
	{ key: 'date', label: 'Tanggal Faktur Pajak', format: fmtDate },
	{ key: 'file', label: 'File Faktur Pajak', format: (file) => (file as JournalAttachment | null)?.name ?? '–' }
]

const orderQuantities = (row: SalesInvoiceRow) => row.lines.map((line) => ({ product_id: line.product_id, quantity: line.quantity }))

// Contract: docs/sales-invoice/
export function registerSalesInvoice(mock: MockAdapter) {
	registerHistoryRoute(mock, 'sales-invoice', (id) => db.salesInvoice.some((item) => item.id === id), NOT_FOUND)

	mock.onGet('/sales-invoice').reply((config) => {
		const p = (config.params ?? {}) as ListParams & {
			approval_status?: string
			payment_status?: string
			tax_invoice?: string
			customer_id?: string | number
			date_from?: string
			date_to?: string
		}
		let rows = db.salesInvoice.map((item) => withLock(config, resolveSalesInvoice(item)))
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((row) =>
				[row.number, row.sales_order_number, row.customer_code, row.customer_name, row.sales_name, row.description]
					.join(' ')
					.toLowerCase()
					.includes(q)
			)
		}
		if (p.customer_id) rows = rows.filter((row) => row.customer_id === Number(p.customer_id))
		if (p.date_from) rows = rows.filter((row) => row.date >= String(p.date_from))
		if (p.date_to) rows = rows.filter((row) => row.date <= String(p.date_to))
		// KPI tiles: honour search + dates, ignore the status / faktur pajak filters below (docs/conventions.md).
		const summary = summarize(
			rows,
			{
				pending: (row) => row.approval_status === 'pending',
				outstanding: (row) => row.approval_status === 'approved' && row.outstanding > 0,
				tax_missing: (row) => row.pkp_active && !row.tax_invoice,
				rejected: (row) => row.approval_status === 'rejected'
			},
			(row) => row.total,
			['pending', 'rejected']
		)
		// "Belum Lunas" tile carries the open amount (Sisa), not the invoice totals.
		const open = rows.filter((row) => row.approval_status === 'approved' && row.outstanding > 0)
		summary.outstanding.amount = open.reduce((sum, row) => sum + row.outstanding, 0)
		if (p.approval_status) rows = rows.filter((row) => row.approval_status === p.approval_status)
		if (p.payment_status === 'open') rows = rows.filter((row) => row.outstanding > 0)
		if (p.payment_status === 'paid') rows = rows.filter((row) => row.outstanding <= 0)
		if (p.tax_invoice === 'missing') rows = rows.filter((row) => row.pkp_active && !row.tax_invoice)
		if (p.tax_invoice === 'filled') rows = rows.filter((row) => Boolean(row.tax_invoice))
		const page = paginate(sortBy(rows, p.sort_by, p.sort_order), p)
		return [200, { data: page.data, meta: { ...page.meta, summary } }]
	})

	mock.onGet(/\/sales-invoice\/\d+$/).reply((config) => {
		const row = db.salesInvoice.find((item) => item.id === idOf(config.url))
		return row ? [200, { data: withLock(config, resolveSalesInvoice(row)) }] : [404, { message: NOT_FOUND }]
	})

	mock.onPost('/sales-invoice').reply((config) => {
		const body = JSON.parse(config.data) as SalesInvoiceRequest
		const closedDate = closedDateReply(config, body.date)
		if (closedDate) return closedDate
		const orderId = body.sales_order_id ? Number(body.sales_order_id) : null
		const order = orderId ? db.salesOrder.find((item) => item.id === orderId) : undefined
		if (orderId && !order) return [422, invalid('Sales order tidak valid', 'sales_order_id')]
		if (order && order.approval_status !== 'approved') return [422, invalid('Sales order belum disetujui', 'sales_order_id')]
		const error = validate(body, orderId)
		if (error) return [422, error]
		const id = nextId(db.salesInvoice)
		const number = salesInvoiceNumber(
			companyCode(config),
			body.date,
			db.salesInvoice.map((item) => item.number)
		)
		const row = buildRow(body, { id, number, sales_order_id: orderId })
		const paymentError = validatePayments(body, totalsOf(row).total, 0)
		if (paymentError) return [422, paymentError]
		db.salesInvoice.unshift(row)
		replaceCreationPayments(row, body.payments)
		if (orderId) applyInvoicedQuantity(orderId, orderQuantities(row), 1, number)
		recordHistory('sales-invoice', id, { title: 'Dibuat', kind: 'created', summary: order ? `Dari sales order ${order.number}` : null })
		return [201, { data: resolveSalesInvoice(row), message: 'Invoice penjualan ditambahkan' }]
	})

	mock.onPut(/\/sales-invoice\/\d+$/).reply((config) => {
		const row = db.salesInvoice.find((item) => item.id === idOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		const closed = closedReply(config, row.date, 'invoice penjualan tidak bisa diubah')
		if (closed) return closed
		if (row.approval_status === 'approved') return [422, { message: 'Invoice yang sudah disetujui tidak boleh diubah' }]
		const body = JSON.parse(config.data) as SalesInvoiceRequest
		const closedDate = closedDateReply(config, body.date)
		if (closedDate) return closedDate
		const error = validate(body, row.sales_order_id, row)
		if (error) return [422, error]
		const next = buildRow(body, row)
		const receivableTotal = db.salesInvoicePayment
			.filter((item) => item.invoice_id === row.id && item.kind === 'receivable')
			.reduce((sum, item) => sum + item.amount, 0)
		const paymentError = validatePayments(body, totalsOf(next).total, receivableTotal, row.id)
		if (paymentError) return [422, paymentError]
		const before = resolveSalesInvoice(row)
		const oldLines = orderQuantities(row)
		const counted = row.approval_status !== 'rejected'
		Object.assign(row, next)
		replaceCreationPayments(row, body.payments)
		if (row.sales_order_id && counted) {
			applyInvoicedQuantity(row.sales_order_id, oldLines, -1)
			applyInvoicedQuantity(row.sales_order_id, orderQuantities(row), 1)
		}
		const after = resolveSalesInvoice(row)
		recordUpdate('sales-invoice', row.id, [
			...diffFields(before, after, FIELDS),
			...diffLines(before.lines, after.lines, {
				id: (line) => line.product_id,
				name: (line) => line.product_name ?? `Produk #${line.product_id}`,
				specs: LINE_FIELDS
			}),
			...diffLines(before.expenses, after.expenses, {
				id: (item) => item.sales_expense_id,
				name: (item) => item.sales_expense_name ?? `Biaya #${item.sales_expense_id}`,
				specs: EXPENSE_FIELDS,
				itemLabel: 'Biaya Penjualan'
			})
		])
		return [200, { data: withLock(config, after), message: 'Invoice penjualan diperbarui' }]
	})

	mock.onDelete(/\/sales-invoice\/\d+$/).reply((config) => {
		const index = db.salesInvoice.findIndex((item) => item.id === idOf(config.url))
		if (index < 0) return [404, { message: NOT_FOUND }]
		const row = db.salesInvoice[index]
		const closed = closedReply(config, row.date, 'invoice penjualan tidak bisa dihapus')
		if (closed) return closed
		if (row.approval_status === 'approved') return [422, { message: 'Invoice yang sudah disetujui tidak boleh dihapus' }]
		replaceCreationPayments(row, [])
		db.salesInvoicePayment = db.salesInvoicePayment.filter((item) => item.invoice_id !== row.id)
		db.salesInvoice.splice(index, 1)
		if (row.sales_order_id && row.approval_status !== 'rejected') applyInvoicedQuantity(row.sales_order_id, orderQuantities(row), -1, row.number)
		purgeHistory('sales-invoice', row.id)
		return [200, { message: 'Invoice penjualan dihapus' }]
	})

	mock.onPatch(/\/sales-invoice\/\d+\/approval$/).reply((config) => {
		const row = db.salesInvoice.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		const { status } = JSON.parse(config.data) as { status?: SalesInvoiceApprovalStatus }
		if (!['pending', 'approved', 'rejected'].includes(String(status))) return [422, { message: 'Status persetujuan tidak valid' }]
		const from = row.approval_status
		const verb =
			status === 'approved' ? 'disetujui' : status === 'rejected' ? 'ditolak' : from === 'rejected' ? 'diajukan ulang' : 'dibatalkan approval-nya'
		const closed = closedReply(config, row.date, `invoice penjualan tidak bisa ${verb}`)
		if (closed) return closed
		const allowed = (from === 'pending' && status !== 'pending') || (from !== 'pending' && status === 'pending')
		if (!allowed) return [422, { message: 'Perubahan status persetujuan tidak valid' }]

		if (from === 'approved') {
			// Batalkan Approval: stok / jurnal are reversed, so nothing may depend on the invoice any more.
			if (db.salesInvoicePayment.some((item) => item.invoice_id === row.id && item.kind === 'receivable'))
				return [422, { message: 'Invoice sudah memiliki pembayaran piutang, tidak bisa membatalkan approval' }]
			for (const guard of unapproveGuards) {
				const message = guard(row.id)
				if (message) return [422, { message }]
			}
		}
		if (from === 'rejected' && row.sales_order_id) {
			// Ajukan Ulang: the order quantity was released on reject — it must still fit.
			const over = row.lines.find((line) => line.quantity > (orderLimit(row.sales_order_id!, line.product_id, row) ?? 0))
			if (over) return [422, { message: 'Jumlah melebihi sisa sales order, ubah invoice terlebih dahulu' }]
			applyInvoicedQuantity(row.sales_order_id, orderQuantities(row), 1, row.number)
		}
		if (status === 'rejected' && row.sales_order_id) applyInvoicedQuantity(row.sales_order_id, orderQuantities(row), -1, row.number)

		row.approval_status = status as SalesInvoiceApprovalStatus
		row.rejection_reason = status === 'rejected' ? 'Invoice ditolak, silakan periksa kembali detailnya.' : null
		row.approved_by = status === 'approved' ? userName() : null
		row.approved_at = status === 'approved' ? new Date().toISOString() : null
		if (status === 'approved') recordHistory('sales-invoice', row.id, { title: 'Disetujui', kind: 'approved' })
		else if (status === 'rejected') recordHistory('sales-invoice', row.id, { title: 'Ditolak', kind: 'rejected', summary: row.rejection_reason })
		else recordHistory('sales-invoice', row.id, { title: from === 'rejected' ? 'Diajukan Ulang' : 'Approval Dibatalkan', kind: 'info' })
		return [200, { data: withLock(config, resolveSalesInvoice(row)), message: 'Status persetujuan diperbarui' }]
	})

	// Faktur pajak: allowed in every state, also in a closed period (no stok / jurnal effect).
	mock.onGet(/\/sales-invoice\/\d+\/tax-invoice$/).reply((config) => {
		const row = db.salesInvoice.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		if (!row.pkp_active) return [422, { message: 'Invoice non-PKP tidak memiliki faktur pajak' }]
		return [200, { data: row.tax_invoice }]
	})

	mock.onPut(/\/sales-invoice\/\d+\/tax-invoice$/).reply((config) => {
		const row = db.salesInvoice.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		if (!row.pkp_active) return [422, { message: 'Invoice non-PKP tidak memiliki faktur pajak' }]
		const body = JSON.parse(config.data) as { number?: string; date?: string; file?: JournalAttachment | null }
		const number = String(body.number || '').trim()
		if (!number) return [422, invalid('Nomor faktur pajak wajib diisi', 'number')]
		if (number.length > 25) return [422, invalid('Nomor faktur pajak maksimal 25 karakter', 'number')]
		if (!isDate(body.date)) return [422, invalid('Tanggal faktur pajak wajib diisi', 'date')]
		const file = body.file ?? null
		if (file && !TAX_FILE_TYPES.includes(file.type)) return [422, invalid('Lampiran harus berupa PDF, JPG, atau PNG', 'file')]
		if (file && file.size > 5 * 1024 * 1024) return [422, invalid('Ukuran lampiran maksimal 5 MB', 'file')]
		if (db.salesInvoice.some((item) => item.id !== row.id && item.tax_invoice?.number.toLowerCase() === number.toLowerCase()))
			return [422, invalid('Nomor faktur pajak sudah dipakai invoice lain', 'number')]
		const previous = row.tax_invoice
		row.tax_invoice = { number, date: String(body.date), file }
		recordHistory('sales-invoice', row.id, {
			title: previous ? 'Faktur Pajak Diubah' : 'Faktur Pajak Disimpan',
			kind: 'info',
			summary: number,
			changes: previous ? diffFields(previous, row.tax_invoice, TAX_FIELDS) : []
		})
		return [200, { data: withLock(config, resolveSalesInvoice(row)), message: 'Faktur pajak disimpan' }]
	})
}
