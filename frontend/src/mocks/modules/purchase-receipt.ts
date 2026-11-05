import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, summarize, type ListParams } from '../lib'
import { diffFields, diffLines, fmtDate, purgeHistory, recordHistory, recordUpdate, registerHistoryRoute, type FieldSpec } from '../history'
import { closedReply, withLock, closedDateReply } from './posting'
import type { PurchaseOrder, PurchaseReceipt, PurchaseReceiptLine, PurchaseReceiptLineRequest, PurchaseReceiptRequest } from '@/utils/types'

const idOf = (url?: string) => Number(url?.split('/').at(-1))
const poIdOfLookup = (url?: string) => Number(url?.split('/').at(-2))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))
const today = () => new Date().toISOString().slice(0, 10)
const userName = () => {
	try {
		return JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin'
	} catch {
		return 'Admin'
	}
}

// Per-PO-line ordered/received/remaining, always excluding `excludeId` (the receipt being
// read/edited) so both the lookup and get-purchase-receipt read as "before this transaction".
function lineStats(poId: number, excludeId?: number) {
	const po = db.purchaseOrder.find((item) => item.id === poId)
	if (!po) return []
	const others = db.purchaseReceipt.filter((item) => item.purchase_order_id === poId && item.id !== excludeId)
	return po.lines.map((poLine) => {
		const receivedOther = others.reduce((sum, receipt) => {
			const line = receipt.lines.find((item) => item.product_id === poLine.product_id)
			return sum + (line?.quantity || 0)
		}, 0)
		const ordered = Number(poLine.quantity)
		return { product_id: poLine.product_id, ordered, receivedOther, remaining: Math.max(ordered - receivedOther, 0) }
	})
}

function resolveLine(rawLine: PurchaseReceiptLineRequest, stat: ReturnType<typeof lineStats>[number] | undefined): PurchaseReceiptLine {
	const product = db.product.find((item) => item.id === rawLine.product_id && !item.deleted_at)
	const warehouse = rawLine.warehouse_id ? db.warehouse.find((item) => item.id === rawLine.warehouse_id && !item.deleted_at) : undefined
	return {
		product_id: rawLine.product_id,
		product_code: product?.code,
		product_name: product?.name,
		brand_code: product?.brand_code,
		brand_name: product?.brand_name,
		unit_name: product?.unit_name,
		ordered_quantity: stat?.ordered ?? 0,
		received_quantity: stat?.receivedOther ?? 0,
		remaining_quantity: stat?.remaining ?? 0,
		quantity: rawLine.quantity,
		warehouse_id: rawLine.warehouse_id,
		warehouse_code: warehouse?.code,
		warehouse_name: warehouse?.name
	}
}

function resolve(row: PurchaseReceipt): PurchaseReceipt {
	const po = db.purchaseOrder.find((item) => item.id === row.purchase_order_id)
	const supplier = po && db.supplier.find((item) => item.id === po.supplier_id && !item.deleted_at)
	const department = db.department.find((item) => item.id === row.department_id && !item.deleted_at)
	const stats = lineStats(row.purchase_order_id, row.id)
	const lines = row.lines.map((rawLine) =>
		resolveLine(
			rawLine,
			stats.find((stat) => stat.product_id === rawLine.product_id)
		)
	)
	const warehouseNames = [...new Set(lines.filter((line) => line.quantity > 0 && line.warehouse_name).map((line) => line.warehouse_name as string))]
	return {
		...row,
		purchase_order_number: po?.number,
		purchase_order_date: po?.date,
		purchase_order_description: po?.description,
		supplier_id: po?.supplier_id,
		supplier_code: supplier?.code,
		supplier_name: supplier?.name,
		department_code: department?.code,
		department_name: department?.name,
		warehouse_label: warehouseNames.length ? warehouseNames.join(', ') : '–',
		lines
	}
}

function invalid(message: string, field?: string) {
	return { message: field ? 'Validasi gagal' : message, ...(field ? { errors: { [field]: [message] } } : {}) }
}

function validate(body: PurchaseReceiptRequest, excludeId?: number): ReturnType<typeof invalid> | null {
	const po = db.purchaseOrder.find((item) => item.id === Number(body.purchase_order_id))
	if (!po) return invalid('Order pembelian tidak valid', 'purchase_order_id')
	if (po.approval_status !== 'approved') return invalid('Order pembelian belum disetujui')
	if (!String(body.delivery_note_number || '').trim()) return invalid('Surat jalan supplier wajib diisi', 'delivery_note_number')
	if (String(body.delivery_note_number).trim().length > 30) return invalid('Surat jalan supplier maksimal 30 karakter', 'delivery_note_number')
	if (!String(body.description || '').trim()) return invalid('Keterangan wajib diisi', 'description')
	if (String(body.description).trim().length > 250) return invalid('Keterangan maksimal 250 karakter', 'description')
	if (!db.department.find((item) => item.id === Number(body.department_id) && !item.deleted_at))
		return invalid('Departemen tidak valid', 'department_id')
	if (!isDate(body.date)) return invalid('Tanggal penerimaan wajib diisi', 'date')
	if (body.date > today()) return invalid('Tanggal penerimaan tidak boleh melebihi hari ini', 'date')

	if (!Array.isArray(body.lines) || body.lines.length === 0) return invalid('Minimal satu produk harus diterima', 'lines')
	const stats = lineStats(po.id, excludeId)
	const seenProducts = new Set<number>()
	const positiveLines = body.lines.filter((line) => Number(line.quantity) > 0)
	for (const line of body.lines) {
		const productId = Number(line.product_id)
		const quantity = Number(line.quantity)
		if (!Number.isFinite(quantity) || quantity < 0) return invalid('Jumlah tidak boleh negatif', 'lines')
		if (seenProducts.has(productId)) return invalid('Produk tidak boleh muncul lebih dari satu kali', 'lines')
		seenProducts.add(productId)
	}
	if (!positiveLines.length) return invalid('Minimal satu produk harus diterima', 'lines')
	for (const line of positiveLines) {
		const stat = stats.find((item) => item.product_id === Number(line.product_id))
		if (!stat) return invalid('Produk tidak valid', 'lines')
		if (Number(line.quantity) > stat.remaining) return invalid('Jumlah melebihi sisa yang belum diterima', 'lines')
		if (!line.warehouse_id || !db.warehouse.find((item) => item.id === Number(line.warehouse_id) && !item.deleted_at))
			return invalid('Gudang wajib dipilih', 'lines')
	}
	return null
}

// Stores one line per PO line (0 or positive) so a detail/edit view always shows the PO's
// full product set, same as Legacy's product tab — not only the products this receipt touched.
function buildRow(body: PurchaseReceiptRequest, id: number, number: string, po: PurchaseOrder, createdBy = userName()): PurchaseReceipt {
	return {
		id,
		number,
		purchase_order_id: po.id,
		delivery_note_number: String(body.delivery_note_number).trim(),
		description: String(body.description).trim(),
		department_id: Number(body.department_id),
		invoice_status: 'not_invoiced',
		date: body.date,
		created_by: createdBy,
		lines: po.lines.map((poLine) => {
			const submitted = body.lines.find((line) => Number(line.product_id) === poLine.product_id && Number(line.quantity) > 0)
			return {
				product_id: poLine.product_id,
				ordered_quantity: 0,
				received_quantity: 0,
				remaining_quantity: 0,
				quantity: submitted ? Math.round(Number(submitted.quantity) * 1000) / 1000 : 0,
				warehouse_id: submitted?.warehouse_id ? Number(submitted.warehouse_id) : null
			}
		})
	}
}

function writeGuard(row: PurchaseReceipt): string | null {
	if (row.invoice_status === 'invoiced') return 'Penerimaan yang sudah dibuat invoice tidak boleh diubah'
	return null
}

const FIELDS: FieldSpec<PurchaseReceipt>[] = [
	{ key: 'date', label: 'Tanggal Penerimaan', format: fmtDate },
	{ key: 'delivery_note_number', label: 'Surat Jalan Supplier' },
	{ key: 'department_name', label: 'Departemen' },
	{ key: 'description', label: 'Keterangan' }
]
const LINE_FIELDS: FieldSpec<PurchaseReceiptLine>[] = [
	{ key: 'quantity', label: 'Jumlah Diterima' },
	{ key: 'warehouse_name', label: 'Gudang' }
]

export function registerPurchaseReceipt(mock: MockAdapter) {
	registerHistoryRoute(mock, 'purchase-receipt', (id) => db.purchaseReceipt.some((item) => item.id === id), 'Penerimaan pembelian tidak ditemukan')

	mock.onGet(/\/purchase-order\/\d+\/receivable-lines$/).reply((config) => {
		const poId = poIdOfLookup(config.url)
		const po = db.purchaseOrder.find((item) => item.id === poId)
		if (!po) return [404, { message: 'Purchase order tidak ditemukan' }]
		if (po.approval_status !== 'approved') return [422, { message: 'Order pembelian belum disetujui' }]
		const supplier = db.supplier.find((item) => item.id === po.supplier_id && !item.deleted_at)
		const stats = lineStats(poId)
		const lines = po.lines.map((poLine) =>
			resolveLine(
				{ product_id: poLine.product_id, quantity: 0, warehouse_id: po.warehouse_id },
				stats.find((stat) => stat.product_id === poLine.product_id)
			)
		)
		return [
			200,
			{
				data: {
					purchase_order: {
						id: po.id,
						number: po.number,
						date: po.date,
						description: po.description,
						supplier_code: supplier?.code,
						supplier_name: supplier?.name,
						department_id: po.department_id,
						warehouse_id: po.warehouse_id
					},
					lines
				}
			}
		]
	})

	mock.onGet('/purchase-receipt').reply((config) => {
		const p = (config.params ?? {}) as ListParams & { invoice_status?: string; date_from?: string; date_to?: string }
		let rows = db.purchaseReceipt.map((item) => withLock(config, resolve(item)))
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((row) =>
				[row.number, row.date, row.warehouse_label, row.description, row.supplier_code, row.supplier_name, row.delivery_note_number]
					.join(' ')
					.toLowerCase()
					.includes(q)
			)
		}
		if (p.date_from) rows = rows.filter((row) => row.date >= String(p.date_from))
		if (p.date_to) rows = rows.filter((row) => row.date <= String(p.date_to))
		// KPI tiles: honour search + dates, ignore the invoice-status filter below (docs/conventions.md).
		const summary = summarize(rows, {
			not_invoiced: (row) => row.invoice_status === 'not_invoiced',
			invoiced: (row) => row.invoice_status === 'invoiced'
		})
		if (p.invoice_status) rows = rows.filter((row) => row.invoice_status === p.invoice_status)
		const page = paginate(sortBy(rows, p.sort_by, p.sort_order), p)
		return [200, { data: page.data, meta: { ...page.meta, summary } }]
	})

	mock.onGet(/\/purchase-receipt\/\d+$/).reply((config) => {
		const row = db.purchaseReceipt.find((item) => item.id === idOf(config.url))
		return row ? [200, { data: withLock(config, resolve(row)) }] : [404, { message: 'Penerimaan pembelian tidak ditemukan' }]
	})

	mock.onPost('/purchase-receipt').reply((config) => {
		const body = JSON.parse(config.data) as PurchaseReceiptRequest
		const closedDate = closedDateReply(config, body.date)
		if (closedDate) return closedDate
		const error = validate(body)
		if (error) return [422, error]
		const po = db.purchaseOrder.find((item) => item.id === Number(body.purchase_order_id)) as PurchaseOrder
		const id = nextId(db.purchaseReceipt)
		const seq = String(id).padStart(4, '0')
		const row = buildRow(body, id, `BM-RICH/${seq}/${body.date.slice(5, 7)}/${body.date.slice(0, 4)}`, po)
		db.purchaseReceipt.unshift(row)
		recordHistory('purchase-receipt', id, { title: 'Dibuat', kind: 'created' })
		return [201, { data: resolve(row), message: 'Penerimaan pembelian ditambahkan' }]
	})

	mock.onPut(/\/purchase-receipt\/\d+$/).reply((config) => {
		const row = db.purchaseReceipt.find((item) => item.id === idOf(config.url))
		if (!row) return [404, { message: 'Penerimaan pembelian tidak ditemukan' }]
		const closed = closedReply(config, row.date, 'penerimaan pembelian tidak bisa diubah')
		if (closed) return closed
		const guard = writeGuard(row)
		if (guard) return [422, { message: guard }]
		const body = JSON.parse(config.data) as PurchaseReceiptRequest
		const closedDate = closedDateReply(config, body.date)
		if (closedDate) return closedDate
		body.purchase_order_id = row.purchase_order_id // locked — see docs/purchase-receipt/update-purchase-receipt.md
		const error = validate(body, row.id)
		if (error) return [422, error]
		const po = db.purchaseOrder.find((item) => item.id === row.purchase_order_id) as PurchaseOrder
		const before = resolve(row)
		Object.assign(row, buildRow(body, row.id, row.number, po, row.created_by))
		const after = resolve(row)
		recordUpdate('purchase-receipt', row.id, [
			...diffFields(before, after, FIELDS),
			...diffLines(before.lines, after.lines, {
				id: (line) => line.product_id,
				name: (line) => line.product_name ?? `Produk #${line.product_id}`,
				specs: LINE_FIELDS
			})
		])
		return [200, { data: resolve(row), message: 'Penerimaan pembelian diperbarui' }]
	})

	mock.onDelete(/\/purchase-receipt\/\d+$/).reply((config) => {
		const index = db.purchaseReceipt.findIndex((item) => item.id === idOf(config.url))
		if (index < 0) return [404, { message: 'Penerimaan pembelian tidak ditemukan' }]
		const closed = closedReply(config, db.purchaseReceipt[index].date, 'penerimaan pembelian tidak bisa dihapus')
		if (closed) return closed
		const guard = writeGuard(db.purchaseReceipt[index])
		if (guard) return [422, { message: guard.replace('diubah', 'dihapus') }]
		const [removed] = db.purchaseReceipt.splice(index, 1)
		purgeHistory('purchase-receipt', removed.id)
		return [200, { message: 'Penerimaan pembelian dihapus' }]
	})
}
