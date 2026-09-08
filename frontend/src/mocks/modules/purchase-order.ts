import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, type ListParams } from '../lib'
import type { PurchaseOrder, PurchaseOrderApprovalStatus, PurchaseOrderLine, PurchaseOrderLineRequest, PurchaseOrderRequest } from '@/utils/types'

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

function lineOf(line: PurchaseOrderLineRequest, isPkp: boolean): PurchaseOrderLine {
	const product = db.product.find((item) => item.id === Number(line.product_id) && !item.deleted_at)
	const quantity = Math.round(Number(line.quantity) * 1000) / 1000
	const price = Math.round(Number(line.price))
	const discount = Math.round(Number(line.discount))
	const gross = Math.round(quantity * price)
	const dpp = Math.max(gross - discount, 0)
	const ppn = isPkp ? Math.round((dpp * 11) / 100) : 0
	return {
		product_id: Number(line.product_id),
		product_code: product?.code,
		product_name: product?.name,
		brand_name: product?.brand_name,
		unit_name: product?.unit_name,

		quantity,
		price,
		discount,
		dpp,
		ppn,
		total: dpp + ppn
	}
}

function resolve(row: PurchaseOrder): PurchaseOrder {
	const supplier = db.supplier.find((item) => item.id === row.supplier_id && !item.deleted_at)
	const department = db.department.find((item) => item.id === row.department_id && !item.deleted_at)
	const warehouse = db.warehouse.find((item) => item.id === row.warehouse_id && !item.deleted_at)
	const lines = row.lines.map((line) => lineOf(line, row.pkp_active))
	const dpp = lines.reduce((sum, line) => sum + line.dpp, 0)
	const ppn = lines.reduce((sum, line) => sum + line.ppn, 0)
	return {
		...row,
		supplier_code: supplier?.code,
		supplier_name: supplier?.name,

		department_code: department?.code,
		department_name: department?.name,
		warehouse_code: warehouse?.code,
		warehouse_name: warehouse?.name,
		lines,
		dpp,
		ppn,
		nett: dpp,
		total: dpp + ppn
	}
}

function invalid(message: string, field?: string) {
	return { message: 'Validasi gagal', ...(field ? { errors: { [field]: [message] } } : {}) }
}

function validate(body: PurchaseOrderRequest): ReturnType<typeof invalid> | null {
	if (!isDate(body.date)) return invalid('Tanggal wajib diisi', 'date')
	const supplier = db.supplier.find((item) => item.id === Number(body.supplier_id) && !item.deleted_at)
	if (!supplier) return invalid('Supplier tidak valid', 'supplier_id')
	if (typeof body.pkp_active !== 'boolean') return invalid('Status PKP wajib dipilih', 'pkp_active')
	if (!db.department.find((item) => item.id === Number(body.department_id) && !item.deleted_at))
		return invalid('Departemen tidak valid', 'department_id')
	if (!db.warehouse.find((item) => item.id === Number(body.warehouse_id) && !item.deleted_at)) return invalid('Gudang tidak valid', 'warehouse_id')
	if (!String(body.address || '').trim()) return invalid('Alamat wajib diisi', 'address')
	if (!String(body.description || '').trim()) return invalid('Keterangan wajib diisi', 'description')
	if (!Array.isArray(body.lines) || body.lines.length === 0) return invalid('Minimal satu produk harus ditambahkan', 'lines')
	for (const line of body.lines) {
		if (!db.product.find((item) => item.id === Number(line.product_id) && !item.deleted_at)) return invalid('Produk tidak valid', 'lines')
		if (!(Number(line.quantity) > 0)) return invalid('Jumlah harus lebih dari nol', 'lines')
		if (!(Number(line.price) > 0)) return invalid('Harga satuan harus lebih dari nol', 'lines')
		if (Number(line.discount) < 0) return invalid('Diskon tidak boleh negatif', 'lines')
		if (Math.round(Number(line.discount)) > Math.round(Number(line.quantity) * Number(line.price)))
			return invalid('Diskon tidak boleh melebihi nilai bruto', 'lines')
	}
	return null
}

function buildRow(body: PurchaseOrderRequest, id: number, number: string, status: PurchaseOrderApprovalStatus = 'pending'): PurchaseOrder {
	return {
		id,
		number,
		date: body.date,
		supplier_id: Number(body.supplier_id),
		pkp_active: body.pkp_active,
		department_id: Number(body.department_id),
		warehouse_id: Number(body.warehouse_id),
		purchase_type: body.purchase_type || null,
		address: String(body.address).trim(),
		description: String(body.description).trim(),
		approval_status: status,
		delivery_status: 'not_received',
		is_locked: false,
		lock_reason: null,
		rejection_reason: null,
		approved_by: null,
		approved_at: null,
		created_by: userName(),
		lines: body.lines.map((line) => ({ ...line, dpp: 0, ppn: 0, total: 0 })),
		dpp: 0,
		ppn: 0,
		nett: 0,
		total: 0
	}
}

function writeGuard(row: PurchaseOrder): string | null {
	if (row.approval_status === 'approved') return 'PO yang sudah disetujui tidak boleh diubah'
	if (row.is_locked) return row.lock_reason || 'PO sudah dikunci dan tidak boleh diubah'
	if (row.delivery_status !== 'not_received') return 'PO yang sudah memiliki penerimaan barang tidak boleh diubah'
	return null
}

export function registerPurchaseOrder(mock: MockAdapter) {
	mock.onGet('/purchase-order').reply((config) => {
		const p = (config.params ?? {}) as ListParams & { approval_status?: string; delivery_status?: string; is_locked?: string; product_q?: string }
		let rows = db.purchaseOrder.map(resolve)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			const field = String(p.field || '')
			rows = rows.filter((row) => {
				const values: Record<string, string> = {
					number: row.number,
					date: row.date,
					created_by: row.created_by,
					supplier_code: row.supplier_code || '',
					supplier_name: row.supplier_name || '',
					warehouse_name: row.warehouse_name || '',
					address: row.address,
					description: row.description
				}
				return (field ? values[field] : Object.values(values).join(' '))?.toLowerCase().includes(q)
			})
		}
		if (p.approval_status) rows = rows.filter((row) => row.approval_status === p.approval_status)
		if (p.delivery_status) rows = rows.filter((row) => row.delivery_status === p.delivery_status)
		if (p.is_locked !== undefined && p.is_locked !== '') rows = rows.filter((row) => String(row.is_locked) === String(p.is_locked))
		if (p.product_q) {
			const q = String(p.product_q).toLowerCase()
			rows = rows.filter((row) => row.lines.some((line) => `${line.product_code} ${line.product_name} ${line.brand_name}`.toLowerCase().includes(q)))
		}
		return [200, paginate(sortBy(rows, p.sort_by, p.sort_order), p)]
	})

	mock.onGet(/\/purchase-order\/\d+$/).reply((config) => {
		const row = db.purchaseOrder.find((item) => item.id === idOf(config.url))
		return row ? [200, { data: resolve(row) }] : [404, { message: 'Purchase order tidak ditemukan' }]
	})

	mock.onPost('/purchase-order').reply((config) => {
		const body = JSON.parse(config.data) as PurchaseOrderRequest
		const error = validate(body)
		if (error) return [422, error]
		const id = nextId(db.purchaseOrder)
		const seq = String(id).padStart(4, '0')
		const row = buildRow(body, id, `PO-RICH/${seq}/${body.date.slice(5, 7)}/${body.date.slice(0, 4)}`)
		db.purchaseOrder.unshift(row)
		return [201, { data: resolve(row), message: 'Order pembelian ditambahkan' }]
	})

	mock.onPut(/\/purchase-order\/\d+$/).reply((config) => {
		const row = db.purchaseOrder.find((item) => item.id === idOf(config.url))
		if (!row) return [404, { message: 'Purchase order tidak ditemukan' }]
		const guard = writeGuard(row)
		if (guard) return [422, { message: guard }]
		const body = JSON.parse(config.data) as PurchaseOrderRequest
		const error = validate(body)
		if (error) return [422, error]
		Object.assign(row, buildRow(body, row.id, row.number, row.approval_status))
		return [200, { data: resolve(row), message: 'Order pembelian diperbarui' }]
	})

	mock.onDelete(/\/purchase-order\/\d+$/).reply((config) => {
		const index = db.purchaseOrder.findIndex((item) => item.id === idOf(config.url))
		if (index < 0) return [404, { message: 'Purchase order tidak ditemukan' }]
		const guard = writeGuard(db.purchaseOrder[index])
		if (guard) return [422, { message: guard.replace('diubah', 'dihapus') }]
		db.purchaseOrder.splice(index, 1)
		return [200, { message: 'Order pembelian dihapus' }]
	})

	mock.onPatch(/\/purchase-order\/\d+\/approval$/).reply((config) => {
		const row = db.purchaseOrder.find((item) => item.id === parentIdOf(config.url))
		const body = JSON.parse(config.data) as { status?: PurchaseOrderApprovalStatus }
		if (!row) return [404, { message: 'Purchase order tidak ditemukan' }]
		if (!['pending', 'approved', 'rejected'].includes(String(body.status))) return [422, { message: 'Status persetujuan tidak valid' }]
		if (row.is_locked) return [422, { message: row.lock_reason || 'PO sudah dikunci' }]
		if (row.approval_status === 'approved' && body.status !== 'approved')
			return [422, { message: 'Persetujuan PO yang sudah disetujui tidak dapat dibatalkan' }]
		row.approval_status = body.status as PurchaseOrderApprovalStatus
		row.rejection_reason = body.status === 'rejected' ? 'PO ditolak, silakan periksa kembali detailnya.' : null
		row.approved_by = body.status === 'approved' ? userName() : null
		row.approved_at = body.status === 'approved' ? new Date().toISOString() : null
		return [200, { data: resolve(row), message: 'Status persetujuan diperbarui' }]
	})

	mock.onPatch(/\/purchase-order\/\d+\/lock$/).reply((config) => {
		const row = db.purchaseOrder.find((item) => item.id === parentIdOf(config.url))
		const body = JSON.parse(config.data) as { locked?: boolean }
		if (!row) return [404, { message: 'Purchase order tidak ditemukan' }]
		if (body.locked && row.approval_status !== 'approved') return [422, { message: 'PO harus disetujui sebelum dikunci' }]
		row.is_locked = Boolean(body.locked)
		row.lock_reason = row.is_locked ? 'PO dikunci secara eksplisit oleh pengguna.' : null
		return [200, { data: resolve(row), message: row.is_locked ? 'PO dikunci' : 'Kunci PO dibuka' }]
	})
}
