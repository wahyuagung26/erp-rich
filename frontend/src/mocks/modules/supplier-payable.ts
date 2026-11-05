import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { nextId, paginate, sortBy, summarize, type ListParams } from '../lib'
import { fmtMoney, recordHistory } from '../history'
import { resolve as resolveInvoice } from './purchase-invoice'
import { resolve as resolveReturn } from './purchase-return'
import { resolve as resolveAdvance } from './supplier-advance'
import type { PurchaseInvoice, SupplierPayable, SupplierPayablePayment, SupplierPayablePaymentRequest } from '@/utils/types'

// Contract: docs/supplier-payable/. A payable is DERIVED from an approved purchase invoice (id = invoice id), so
// approving an invoice in Invoice Pembelian makes it appear here with no extra write.
const idOf = (url?: string) => Number(url?.split('/').at(-1))
const parentIdOf = (url?: string) => Number(url?.split('/').at(-2))
const grandParentIdOf = (url?: string) => Number(url?.split('/').at(-3))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))
const today = () => new Date().toISOString().slice(0, 10)
const invalid = (message: string, field?: string) => ({
	message: field ? 'Validasi gagal' : message,
	...(field ? { errors: { [field]: [message] } } : {})
})

function addDays(isoDate: string, days: number) {
	const d = new Date(`${isoDate}T00:00:00Z`)
	d.setUTCDate(d.getUTCDate() + days)
	return d.toISOString().slice(0, 10)
}

function paymentsOf(payableId: number): SupplierPayablePayment[] {
	return db.supplierPayablePayment
		.filter((item) => item.payable_id === payableId)
		.map((item) => {
			const type = db.paymentType.find((entry) => entry.id === item.payment_type_id)
			return {
				id: item.id,
				number: item.number,
				date: item.date,
				payment_type_id: item.payment_type_id,
				payment_type_name: type?.name,
				method: type?.method,
				bank_account_id: item.bank_account_id,
				bank_account_name: db.bankAccount.find((bank) => bank.id === item.bank_account_id)?.bank_name,
				purchase_return_id: item.purchase_return_id,
				purchase_return_number: db.purchaseReturn.find((entry) => entry.id === item.purchase_return_id)?.number,
				supplier_advance_id: item.supplier_advance_id,
				supplier_advance_number: db.supplierAdvance.find((entry) => entry.id === item.supplier_advance_id)?.number,
				description: item.description,
				amount: item.amount
			}
		})
}

function resolve(source: PurchaseInvoice): SupplierPayable {
	const invoice = resolveInvoice(source)
	const supplier = db.supplier.find((item) => item.id === invoice.supplier_id)
	const topDays = supplier?.top_days ?? 0
	const date = (invoice.approved_at ?? invoice.date).slice(0, 10)
	const due_date = addDays(date, topDays)
	const payments = paymentsOf(invoice.id)
	const paid_total = payments.reduce((sum, item) => sum + item.amount, 0)
	const remaining_total = Math.max(invoice.total - paid_total, 0)
	return {
		id: invoice.id,
		number: invoice.kontrabon_number ?? '',
		date,
		due_date,
		top_days: topDays,
		purchase_invoice_id: invoice.id,
		purchase_invoice_number: invoice.number,
		supplier_invoice_number: invoice.supplier_invoice_number,
		supplier_id: invoice.supplier_id,
		supplier_code: invoice.supplier_code,
		supplier_name: invoice.supplier_name,
		department_id: invoice.department_id,
		department_code: invoice.department_code,
		department_name: invoice.department_name,
		description: invoice.description,
		total: invoice.total,
		paid_total,
		remaining_total,
		status: remaining_total === 0 ? 'paid' : paid_total > 0 ? 'partial' : 'unpaid',
		overdue: remaining_total > 0 && due_date < today(),
		payments
	}
}

const payables = () => db.purchaseInvoice.filter((item) => item.approval_status === 'approved' && item.kontrabon_number)
const find = (id: number) => payables().find((item) => item.id === id)

export function registerSupplierPayable(mock: MockAdapter) {
	mock.onGet('/supplier-payable').reply((config) => {
		const p = (config.params ?? {}) as ListParams & {
			status?: string
			due?: string
			supplier_id?: string | number
			date_field?: string
			date_from?: string
			date_to?: string
		}
		let rows = payables().map(resolve)
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((row) =>
				[row.number, row.purchase_invoice_number, row.supplier_invoice_number, row.supplier_code, row.supplier_name, row.description]
					.join(' ')
					.toLowerCase()
					.includes(q)
			)
		}
		if (p.supplier_id) rows = rows.filter((row) => row.supplier_id === Number(p.supplier_id))
		// The range applies to Tanggal Hutang by default, or to Jatuh Tempo when date_field=due_date.
		const field = p.date_field === 'due_date' ? 'due_date' : 'date'
		if (p.date_from) rows = rows.filter((row) => row[field] >= String(p.date_from))
		if (p.date_to) rows = rows.filter((row) => row[field] <= String(p.date_to))
		// KPI tiles: honour search + dates, ignore the status / due filters below (docs/conventions.md).
		const summary = summarize(
			rows,
			{
				open: (row) => row.status !== 'paid',
				overdue: (row) => row.overdue,
				paid: (row) => row.status === 'paid'
			},
			(row) => row.remaining_total,
			['open', 'overdue']
		)
		if (p.status === 'open') rows = rows.filter((row) => row.status !== 'paid')
		else if (p.status) rows = rows.filter((row) => row.status === p.status)
		if (p.due === 'overdue') rows = rows.filter((row) => row.overdue)
		const page = paginate(sortBy(rows, p.sort_by, p.sort_order), p)
		return [200, { data: page.data, meta: { ...page.meta, summary } }]
	})

	mock.onGet(/\/supplier-payable\/\d+$/).reply((config) => {
		const source = find(idOf(config.url))
		return source ? [200, { data: resolve(source) }] : [404, { message: 'Hutang supplier tidak ditemukan' }]
	})

	mock.onPost(/\/supplier-payable\/\d+\/payments$/).reply((config) => {
		const source = find(parentIdOf(config.url))
		if (!source) return [404, { message: 'Hutang supplier tidak ditemukan' }]
		const payable = resolve(source)
		const body = JSON.parse(config.data) as SupplierPayablePaymentRequest
		if (!isDate(body.date)) return [422, invalid('Tanggal wajib diisi', 'date')]
		if (body.date > today()) return [422, invalid('Tanggal tidak boleh melebihi hari ini', 'date')]
		if (body.date < payable.date) return [422, invalid('Tanggal tidak boleh sebelum tanggal hutang', 'date')]
		const type = db.paymentType.find((item) => item.id === Number(body.payment_type_id) && !item.deleted_at && item.transaction_type === 'purchase')
		if (!type) return [422, invalid('Tipe pembayaran wajib dipilih', 'payment_type_id')]
		if (type.method === 'expense') return [422, invalid('Tipe pembayaran ini belum didukung untuk hutang supplier', 'payment_type_id')]
		const amount = Math.round(Number(body.amount))
		if (!(amount > 0)) return [422, invalid('Nominal harus lebih dari nol', 'amount')]
		if (amount > payable.remaining_total) return [422, invalid(`Nominal melebihi sisa hutang (${payable.remaining_total})`, 'amount')]

		let bankAccountId: number | null = null
		let returnId: number | null = null
		let advanceId: number | null = null
		if (type.method === 'cash_bank') {
			if (!db.bankAccount.some((item) => item.id === Number(body.bank_account_id) && !item.deleted_at))
				return [422, invalid('Rekening cash / bank wajib dipilih', 'bank_account_id')]
			bankAccountId = Number(body.bank_account_id)
		} else if (type.method === 'down_payment') {
			const stored = db.supplierAdvance.find((item) => item.id === Number(body.supplier_advance_id))
			const advance = stored && resolveAdvance(stored)
			if (!advance || advance.supplier_id !== payable.supplier_id)
				return [422, invalid('Pilih uang muka dari supplier yang sama', 'supplier_advance_id')]
			if (amount > advance.remaining) return [422, invalid(`Nominal melebihi sisa uang muka (${advance.remaining})`, 'amount')]
			advanceId = advance.id
		} else {
			const stored = db.purchaseReturn.find((item) => item.id === Number(body.purchase_return_id))
			const purchaseReturn = stored && resolveReturn(stored)
			if (!purchaseReturn || purchaseReturn.approval_status !== 'approved' || purchaseReturn.supplier_id !== payable.supplier_id)
				return [422, invalid('Pilih retur pembelian yang sudah disetujui dari supplier yang sama', 'purchase_return_id')]
			if (amount > purchaseReturn.remaining_total) return [422, invalid(`Nominal melebihi sisa retur (${purchaseReturn.remaining_total})`, 'amount')]
			returnId = purchaseReturn.id
		}

		const id = nextId(db.supplierPayablePayment)
		const number = `BYR-RICH/${String(id).padStart(4, '0')}/${body.date.slice(5, 7)}/${body.date.slice(0, 4)}`
		db.supplierPayablePayment.push({
			id,
			payable_id: payable.id,
			number,
			date: body.date,
			payment_type_id: type.id,
			bank_account_id: bankAccountId,
			purchase_return_id: returnId,
			supplier_advance_id: advanceId,
			description: String(body.description || '').trim(),
			amount
		})
		if (advanceId) {
			db.supplierAdvanceUsage.push({
				id: nextId(db.supplierAdvanceUsage),
				supplier_advance_id: advanceId,
				date: body.date,
				payable_number: payable.number,
				payment_number: number,
				note: String(body.description || '').trim() || 'Pembayaran hutang',
				amount
			})
			recordHistory('supplier-advance', advanceId, {
				title: 'Dipakai untuk Hutang',
				kind: 'info',
				summary: `${payable.number} · ${fmtMoney(amount)}`
			})
		}
		if (returnId) {
			db.purchaseReturnSettlement.push({
				id: nextId(db.purchaseReturnSettlement),
				purchase_return_id: returnId,
				date: body.date,
				type: 'payable_deduction',
				payable_number: payable.number,
				payment_number: number,
				bank_account_id: null,
				description: `Potong hutang invoice ${payable.purchase_invoice_number}`,
				amount
			})
			recordHistory('purchase-return', returnId, { title: 'Dipakai Potong Hutang', kind: 'info', summary: `${payable.number} · ${fmtMoney(amount)}` })
		}
		recordHistory('purchase-invoice', payable.purchase_invoice_id, {
			title: 'Pembayaran Hutang Dicatat',
			kind: 'info',
			summary: `${number} · ${fmtMoney(amount)}`
		})
		return [201, { data: resolve(source), message: 'Pembayaran hutang dicatat' }]
	})

	mock.onDelete(/\/supplier-payable\/\d+\/payments\/\d+$/).reply((config) => {
		const source = find(grandParentIdOf(config.url))
		if (!source) return [404, { message: 'Hutang supplier tidak ditemukan' }]
		const index = db.supplierPayablePayment.findIndex((item) => item.id === idOf(config.url) && item.payable_id === source.id)
		if (index < 0) return [404, { message: 'Pembayaran tidak ditemukan' }]
		const payment = db.supplierPayablePayment[index]
		db.supplierPayablePayment.splice(index, 1)
		const settlementIndex = db.purchaseReturnSettlement.findIndex((item) => item.payment_number === payment.number)
		if (settlementIndex >= 0) db.purchaseReturnSettlement.splice(settlementIndex, 1)
		const usageIndex = db.supplierAdvanceUsage.findIndex((item) => item.payment_number === payment.number)
		if (usageIndex >= 0) db.supplierAdvanceUsage.splice(usageIndex, 1)
		recordHistory('purchase-invoice', source.id, {
			title: 'Pembayaran Hutang Dibatalkan',
			kind: 'info',
			summary: `${payment.number} · ${fmtMoney(payment.amount)}`
		})
		return [200, { data: resolve(source), message: 'Pembayaran dibatalkan' }]
	})
}
