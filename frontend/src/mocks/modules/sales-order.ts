import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { companyCode, salesOrderNumber } from '../numbering'
import { nextId, paginate, sortBy, summarize, type ListParams } from '../lib'
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
import type { SalesOrderRow } from '../fixtures/sales-order'
import type {
	SalesOrder,
	SalesOrderApprovalStatus,
	SalesOrderExpense,
	SalesOrderInvoiceableLines,
	SalesOrderInvoiceStatus,
	SalesOrderLine,
	SalesOrderRequest
} from '@/utils/types'

const TOP_DAYS = [0, 7, 14, 21, 30, 60, 90, 120]
const NOT_FOUND = 'Sales order tidak ditemukan'
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

export const lineTotal = (line: { quantity: number; price: number; discount: number }) =>
	Math.round((Number(line.price) - Number(line.discount)) * Number(line.quantity))

// Server-authoritative totals (docs/sales-order/index.md#rumus): the client preview mirrors this, but only this result is stored/returned.
export function totalsOf(row: {
	lines: { quantity: number; price: number; discount: number }[]
	expenses: { amount: number }[]
	pkp_active: boolean
	discount_type: SalesOrderRow['discount_type']
	discount_value: number
}) {
	const subtotal = row.lines.reduce((sum, line) => sum + lineTotal(line), 0)
	const value = Number(row.discount_value) || 0
	const discount_global = row.discount_type === 'percent' ? Math.round((subtotal * value) / 100) : Math.min(Math.round(value), subtotal)
	const base = Math.max(subtotal - discount_global, 0)
	const dpp = row.pkp_active ? base : 0
	const ppn = row.pkp_active ? Math.round((dpp * 11) / 100) : 0
	const expense_total = row.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
	return { subtotal, discount_global, dpp, ppn, expense_total, total: base + ppn + expense_total }
}

function invoiceStatusOf(lines: SalesOrderRow['lines']): SalesOrderInvoiceStatus {
	if (lines.every((line) => !line.invoiced_quantity)) return 'not_invoiced'
	return lines.every((line) => line.invoiced_quantity >= line.quantity) ? 'invoiced' : 'partial'
}

function lineOf(line: SalesOrderRow['lines'][number]): SalesOrderLine {
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
		invoiced_quantity: line.invoiced_quantity,
		remaining_quantity: Math.max(line.quantity - line.invoiced_quantity, 0)
	}
}

function expenseOf(expense: SalesOrderRow['expenses'][number]): SalesOrderExpense {
	const found = db.salesExpense.find((item) => item.id === Number(expense.sales_expense_id))
	return { ...expense, sales_expense_code: found?.code, sales_expense_name: found?.name }
}

function resolve(row: SalesOrderRow): SalesOrder {
	const customer = db.customer.find((item) => item.id === row.customer_id && !item.deleted_at)
	const sales = db.sales.find((item) => item.id === row.sales_id && !item.deleted_at)
	const department = db.department.find((item) => item.id === row.department_id && !item.deleted_at)
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
		invoice_status: invoiceStatusOf(row.lines),
		lines: row.lines.map(lineOf),
		expenses: row.expenses.map(expenseOf),
		...totalsOf(row)
	}
}

function invalid(message: string, field?: string) {
	return { message: 'Validasi gagal', ...(field ? { errors: { [field]: [message] } } : {}) }
}

function validate(body: SalesOrderRequest): ReturnType<typeof invalid> | null {
	if (!isDate(body.date)) return invalid('Tanggal wajib diisi', 'date')
	if (!db.customer.some((item) => item.id === Number(body.customer_id) && !item.deleted_at)) return invalid('Customer tidak valid', 'customer_id')
	if (!db.sales.some((item) => item.id === Number(body.sales_id) && !item.deleted_at)) return invalid('Sales tidak valid', 'sales_id')
	if (!db.department.some((item) => item.id === Number(body.department_id) && !item.deleted_at))
		return invalid('Departemen tidak valid', 'department_id')
	if (!TOP_DAYS.includes(Number(body.top_days))) return invalid('Termin pembayaran tidak valid', 'top_days')
	if (typeof body.pkp_active !== 'boolean') return invalid('Status PKP wajib dipilih', 'pkp_active')
	if (!['nominal', 'percent'].includes(String(body.discount_type))) return invalid('Jenis diskon tidak valid', 'discount_type')
	if (!Array.isArray(body.lines) || body.lines.length === 0) return invalid('Minimal satu produk harus ditambahkan', 'lines')
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

// Keeps the invoiced quantity of lines that survive an edit (matched by product).
function buildRow(body: SalesOrderRequest, base: Pick<SalesOrderRow, 'id' | 'number'> & Partial<SalesOrderRow>): SalesOrderRow {
	return {
		id: base.id,
		number: base.number,
		date: body.date,
		top_days: Number(body.top_days),
		customer_id: Number(body.customer_id),
		sales_id: Number(body.sales_id),
		department_id: Number(body.department_id),
		pkp_active: body.pkp_active,
		description: String(body.description ?? '').trim(),
		discount_type: body.discount_type,
		discount_value: Number(body.discount_value) || 0,
		approval_status: base.approval_status ?? 'pending',
		rejection_reason: base.rejection_reason ?? null,
		approved_by: base.approved_by ?? null,
		approved_at: base.approved_at ?? null,
		created_by: base.created_by ?? userName(),
		lines: body.lines.map((line) => ({
			product_id: Number(line.product_id),
			warehouse_id: Number(line.warehouse_id),
			quantity: Math.round(Number(line.quantity) * 1000) / 1000,
			price: Math.round(Number(line.price)),
			discount: Math.round(Number(line.discount)),
			notes: String(line.notes ?? '').trim(),
			invoiced_quantity: base.lines?.find((old) => old.product_id === Number(line.product_id))?.invoiced_quantity ?? 0
		})),
		expenses: (body.expenses ?? []).map((expense) => ({
			sales_expense_id: Number(expense.sales_expense_id),
			notes: String(expense.notes ?? '').trim(),
			amount: Math.round(Number(expense.amount))
		}))
	}
}

function writeGuard(row: SalesOrderRow): string | null {
	if (row.approval_status === 'approved') return 'Sales order yang sudah disetujui tidak boleh diubah'
	if (row.lines.some((line) => line.invoiced_quantity > 0)) return 'Sales order yang sudah memiliki invoice tidak boleh diubah'
	return null
}

const FIELDS: FieldSpec<SalesOrder>[] = [
	{ key: 'date', label: 'Tanggal', format: fmtDate },
	{ key: 'customer_name', label: 'Customer' },
	{ key: 'sales_name', label: 'Sales' },
	{ key: 'department_name', label: 'Departemen' },
	{ key: 'top_days', label: 'Termin Pembayaran', format: (value) => `${value} hari` },
	{ key: 'pkp_active', label: 'Status PKP', format: fmtPkp },
	{ key: 'description', label: 'Keterangan' },
	{ key: 'discount_global', label: 'Diskon Global', format: fmtMoney }
]
const LINE_FIELDS: FieldSpec<SalesOrderLine>[] = [
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

// Cross-module hook for Invoice Penjualan (docs/sales-order/index.md): bump (`1`) or release (`-1`) the invoiced quantity per product,
// clamped to [0, ordered]. `reference` (the invoice number) adds a history event. Returns false when the order does not exist.
export function applyInvoicedQuantity(
	orderId: number,
	lines: { product_id: number; quantity: number }[],
	direction: 1 | -1,
	reference?: string
): boolean {
	const row = db.salesOrder.find((item) => item.id === orderId)
	if (!row) return false
	for (const { product_id, quantity } of lines) {
		const target = row.lines.find((line) => line.product_id === product_id)
		if (target) target.invoiced_quantity = Math.min(Math.max(target.invoiced_quantity + direction * quantity, 0), target.quantity)
	}
	if (reference)
		recordHistory('sales-order', orderId, { title: direction === 1 ? 'Invoice Dibuat' : 'Invoice Dibatalkan', kind: 'info', summary: reference })
	return true
}

export function registerSalesOrder(mock: MockAdapter) {
	registerHistoryRoute(mock, 'sales-order', (id) => db.salesOrder.some((item) => item.id === id), NOT_FOUND)

	mock.onGet('/sales-order').reply((config) => {
		const p = (config.params ?? {}) as ListParams & { approval_status?: string; invoice_status?: string; date_from?: string; date_to?: string }
		let rows = db.salesOrder.map(resolve)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((row) =>
				[row.number, row.date, row.created_by, row.customer_code, row.customer_name, row.sales_name, row.description]
					.join(' ')
					.toLowerCase()
					.includes(q)
			)
		}
		if (p.date_from) rows = rows.filter((row) => row.date >= String(p.date_from))
		if (p.date_to) rows = rows.filter((row) => row.date <= String(p.date_to))
		// KPI tiles: honour search + dates, ignore the status filters below (docs/conventions.md).
		const summary = summarize(
			rows,
			{
				pending: (row) => row.approval_status === 'pending',
				awaiting_invoice: (row) => row.approval_status === 'approved' && row.invoice_status === 'not_invoiced',
				partial: (row) => row.approval_status === 'approved' && row.invoice_status === 'partial',
				rejected: (row) => row.approval_status === 'rejected'
			},
			(row) => row.total
		)
		if (p.approval_status) rows = rows.filter((row) => row.approval_status === p.approval_status)
		if (p.invoice_status) rows = rows.filter((row) => row.invoice_status === p.invoice_status)
		const page = paginate(sortBy(rows, p.sort_by, p.sort_order), p)
		return [200, { data: page.data, meta: { ...page.meta, summary } }]
	})

	mock.onGet(/\/sales-order\/\d+$/).reply((config) => {
		const row = db.salesOrder.find((item) => item.id === idOf(config.url))
		return row ? [200, { data: resolve(row) }] : [404, { message: NOT_FOUND }]
	})

	mock.onGet(/\/sales-order\/\d+\/invoiceable-lines$/).reply((config) => {
		const row = db.salesOrder.find((item) => item.id === parentIdOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		if (row.approval_status !== 'approved') return [422, { message: 'Sales order belum disetujui' }]
		const order = resolve(row)
		const data: SalesOrderInvoiceableLines = {
			sales_order: {
				id: order.id,
				number: order.number,
				date: order.date,
				description: order.description,
				customer_id: order.customer_id,
				customer_code: order.customer_code,
				customer_name: order.customer_name,
				sales_id: order.sales_id,
				sales_code: order.sales_code,
				sales_name: order.sales_name,
				department_id: order.department_id,
				department_code: order.department_code,
				department_name: order.department_name,
				pkp_active: order.pkp_active,
				top_days: order.top_days,
				discount_type: order.discount_type,
				discount_value: order.discount_value,
				expenses: order.expenses
			},
			lines: order.lines.map((line) => ({
				product_id: line.product_id,
				product_code: line.product_code,
				product_name: line.product_name,
				brand_name: line.brand_name,
				unit_name: line.unit_name,
				ordered_quantity: line.quantity,
				invoiced_quantity: line.invoiced_quantity,
				remaining_quantity: line.remaining_quantity,
				quantity: 0,
				price: line.price,
				discount: line.discount,
				warehouse_id: line.warehouse_id,
				warehouse_code: line.warehouse_code,
				warehouse_name: line.warehouse_name,
				notes: line.notes
			}))
		}
		return [200, { data }]
	})

	mock.onPost('/sales-order').reply((config) => {
		const body = JSON.parse(config.data) as SalesOrderRequest
		const error = validate(body)
		if (error) return [422, error]
		const id = nextId(db.salesOrder)
		const number = salesOrderNumber(
			companyCode(config),
			body.date,
			db.salesOrder.map((item) => item.number)
		)
		const row = buildRow(body, { id, number })
		db.salesOrder.unshift(row)
		recordHistory('sales-order', id, { title: 'Dibuat', kind: 'created' })
		return [201, { data: resolve(row), message: 'Sales order ditambahkan' }]
	})

	mock.onPut(/\/sales-order\/\d+$/).reply((config) => {
		const row = db.salesOrder.find((item) => item.id === idOf(config.url))
		if (!row) return [404, { message: NOT_FOUND }]
		const guard = writeGuard(row)
		if (guard) return [422, { message: guard }]
		const body = JSON.parse(config.data) as SalesOrderRequest
		const error = validate(body)
		if (error) return [422, error]
		const before = resolve(row)
		Object.assign(row, buildRow(body, row))
		const after = resolve(row)
		recordUpdate('sales-order', row.id, [
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
		return [200, { data: resolve(row), message: 'Sales order diperbarui' }]
	})

	mock.onDelete(/\/sales-order\/\d+$/).reply((config) => {
		const index = db.salesOrder.findIndex((item) => item.id === idOf(config.url))
		if (index < 0) return [404, { message: NOT_FOUND }]
		const guard = writeGuard(db.salesOrder[index])
		if (guard) return [422, { message: guard.replace('diubah', 'dihapus') }]
		const [removed] = db.salesOrder.splice(index, 1)
		purgeHistory('sales-order', removed.id)
		return [200, { message: 'Sales order dihapus' }]
	})

	mock.onPatch(/\/sales-order\/\d+\/approval$/).reply((config) => {
		const row = db.salesOrder.find((item) => item.id === parentIdOf(config.url))
		const body = JSON.parse(config.data) as { status?: SalesOrderApprovalStatus }
		if (!row) return [404, { message: NOT_FOUND }]
		if (!['pending', 'approved', 'rejected'].includes(String(body.status))) return [422, { message: 'Status persetujuan tidak valid' }]
		if (row.approval_status === 'approved' && body.status !== 'approved')
			return [422, { message: 'Persetujuan sales order yang sudah disetujui tidak dapat dibatalkan' }]
		const previous = row.approval_status
		row.approval_status = body.status as SalesOrderApprovalStatus
		row.rejection_reason = body.status === 'rejected' ? 'SO ditolak, silakan periksa kembali detailnya.' : null
		row.approved_by = body.status === 'approved' ? userName() : null
		row.approved_at = body.status === 'approved' ? new Date().toISOString() : null
		if (body.status !== previous) {
			if (body.status === 'approved') recordHistory('sales-order', row.id, { title: 'Disetujui', kind: 'approved' })
			else if (body.status === 'rejected') recordHistory('sales-order', row.id, { title: 'Ditolak', kind: 'rejected', summary: row.rejection_reason })
			else recordHistory('sales-order', row.id, { title: 'Diajukan Ulang', kind: 'info' })
		}
		return [200, { data: resolve(row), message: 'Status persetujuan diperbarui' }]
	})
}
