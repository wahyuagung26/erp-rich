import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { invoicePaymentNumber } from '../numbering'
import { companyIdOf, nextId, paginate, sortBy, summarize, type ListParams } from '../lib'
import { fmtMoney, recordHistory } from '../history'
import { closedDateReply, closedReply, isPeriodClosed } from './posting'
import { findSalesInvoice } from './sales-invoice'
import { resolve as resolveDeposit } from './customer-deposit'
import { BIAYA_PAYMENT_TYPE } from '@/constant/payment'
import type {
	CustomerReceivable,
	CustomerReceivablePayment,
	CustomerReceivablePaymentRequest,
	CustomerReceivablePaymentSource,
	SalesInvoice,
	SalesInvoicePayment
} from '@/utils/types'

// Contract: docs/customer-receivable/. A receivable is DERIVED from an approved sales invoice (id = invoice id); its payments are the
// rows of db.salesInvoicePayment (creation + return rows are shown read-only, only the ones recorded here are writable).
const NOT_FOUND = 'Piutang customer tidak ditemukan'
const BIAYA = BIAYA_PAYMENT_TYPE // hard-coded payment type "Biaya" (decision 2026-10-14)
const idOf = (url?: string) => Number(url?.split('/').at(-1))
const parentIdOf = (url?: string) => Number(url?.split('/').at(-2))
const grandParentIdOf = (url?: string) => Number(url?.split('/').at(-3))
const isDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))
const today = () => new Date().toISOString().slice(0, 10)
const invalid = (message: string, field?: string) => ({
	message: field ? 'Validasi gagal' : message,
	...(field ? { errors: { [field]: [message] } } : {})
})

const sourceOf = (item: SalesInvoicePayment): CustomerReceivablePaymentSource =>
	item.return_id ? 'return' : item.kind === 'creation' ? 'creation' : 'receivable'
const returnNumber = (id?: number) => (id ? db.salesReturn.find((item) => item.id === id)?.number : undefined)
// Legacy `AR-<invoice number>-BY<nn>`: rows recorded here get their number at create; older (seed) rows get it from their position among the invoice's payments.
const paymentsOfInvoice = (invoiceId: number) => db.salesInvoicePayment.filter((row) => row.invoice_id === invoiceId).sort((a, b) => a.id - b.id)
const numberOf = (item: SalesInvoicePayment) =>
	item.number ??
	invoicePaymentNumber(
		db.salesInvoice.find((row) => row.id === item.invoice_id)?.number ?? '',
		paymentsOfInvoice(item.invoice_id).findIndex((row) => row.id === item.id) + 1
	)

function paymentOf(item: SalesInvoicePayment, companyId: number | null): CustomerReceivablePayment {
	const source = sourceOf(item)
	return {
		id: item.id,
		number: source === 'receivable' ? numberOf(item) : null,
		date: item.date,
		source,
		payment_type_id: item.payment_type_id,
		payment_type_name: item.payment_type,
		method: item.method,
		bank_account_id: item.bank_account_id ?? null,
		bank_account_name: db.bankAccount.find((bank) => bank.id === item.bank_account_id)?.bank_name,
		deposit_id: item.deposit_id ?? null,
		deposit_number: item.deposit_number,
		sales_expense_id: item.sales_expense_id ?? null,
		sales_expense_name: db.salesExpense.find((expense) => expense.id === item.sales_expense_id)?.name,
		return_id: item.return_id ?? null,
		return_number: returnNumber(item.return_id),
		reference: item.reference,
		description: item.description ?? '',
		amount: item.amount,
		locked: source === 'receivable' && isPeriodClosed(companyId, item.date)
	}
}

function resolve(invoice: SalesInvoice, companyId: number | null): CustomerReceivable {
	return {
		id: invoice.id,
		number: invoice.number,
		date: invoice.date,
		due_date: invoice.due_date,
		top_days: invoice.top_days,
		customer_id: invoice.customer_id,
		customer_code: invoice.customer_code,
		customer_name: invoice.customer_name,
		department_id: invoice.department_id,
		department_code: invoice.department_code,
		department_name: invoice.department_name,
		sales_name: invoice.sales_name,
		description: invoice.description,
		total: invoice.total,
		paid_total: invoice.paid_total,
		outstanding: invoice.outstanding,
		status: invoice.payment_status,
		overdue: invoice.outstanding > 0 && invoice.due_date < today(),
		payments: invoice.payments.map((item) => paymentOf(item, companyId))
	}
}

const approvedInvoices = () => db.salesInvoice.filter((item) => item.approval_status === 'approved').map((item) => findSalesInvoice(item.id)!)
const findApproved = (id: number) => approvedInvoices().find((item) => item.id === id)

// Titipan usage rows are matched by this note (unique per payment number).
const usageNote = (number: string) => `PEMBAYARAN PIUTANG ${number}`
const money = (value: number) => `Rp ${fmtMoney(value)}`

// Shared date + amount checks. `capacity` = what the amount may reach (Sisa, plus the payment's own amount on edit).
function validateCommon(invoice: SalesInvoice, date: unknown, amount: number, capacity: number) {
	if (!isDate(date)) return invalid('Tanggal wajib diisi', 'date')
	if (String(date) > today()) return invalid('Tanggal tidak boleh melebihi hari ini', 'date')
	if (String(date) < invoice.date) return invalid('Tanggal tidak boleh sebelum tanggal invoice', 'date')
	if (!(amount > 0)) return invalid('Nominal harus lebih dari nol', 'amount')
	if (amount > capacity) return invalid(`Nominal melebihi sisa piutang (${capacity})`, 'amount')
	return null
}

const activeExpense = (id: unknown) => db.salesExpense.find((item) => item.id === Number(id) && !item.deleted_at)

// A read-only payment (paid with the invoice, or a Retur settlement) cannot be touched from this module.
function managedElsewhere(item: SalesInvoicePayment) {
	const source = sourceOf(item)
	if (source === 'return') return `Pembayaran ini dikelola dari Retur Penjualan ${returnNumber(item.return_id) ?? item.reference}`
	if (source === 'creation') return 'Pembayaran ini dikelola dari Invoice Penjualan'
	return null
}

export function registerCustomerReceivable(mock: MockAdapter) {
	mock.onGet('/customer-receivable').reply((config) => {
		const p = (config.params ?? {}) as ListParams & {
			status?: string
			due?: string
			customer_id?: string | number
			date_field?: string
			date_from?: string
			date_to?: string
		}
		const companyId = companyIdOf(config)
		let rows = approvedInvoices().map((item) => resolve(item, companyId))
		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((row) =>
				[row.number, row.customer_code, row.customer_name, row.sales_name, row.description].join(' ').toLowerCase().includes(q)
			)
		}
		if (p.customer_id) rows = rows.filter((row) => row.customer_id === Number(p.customer_id))
		// The range applies to Tanggal Invoice by default, or to Jatuh Tempo when date_field=due_date.
		const field = p.date_field === 'due_date' ? 'due_date' : 'date'
		if (p.date_from) rows = rows.filter((row) => row[field] >= String(p.date_from))
		if (p.date_to) rows = rows.filter((row) => row[field] <= String(p.date_to))
		// KPI tiles: honour search + dates, ignore the status / due filters below (docs/conventions.md).
		const summary = summarize(
			rows,
			{ open: (row) => row.status !== 'paid', overdue: (row) => row.overdue, paid: (row) => row.status === 'paid' },
			(row) => row.outstanding,
			['open', 'overdue']
		)
		if (p.status === 'open') rows = rows.filter((row) => row.status !== 'paid')
		else if (p.status) rows = rows.filter((row) => row.status === p.status)
		if (p.due === 'overdue') rows = rows.filter((row) => row.overdue)
		const page = paginate(sortBy(rows, p.sort_by, p.sort_order), p)
		return [200, { data: page.data, meta: { ...page.meta, summary } }]
	})

	// Master sale types usable for a receivable payment, plus the hard-coded Biaya (always last).
	mock.onGet('/customer-receivable/payment-types').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		const master = db.paymentType
			.filter(
				(item) =>
					!item.deleted_at && item.company_id === companyId && item.transaction_type === 'sale' && ['cash_bank', 'down_payment'].includes(item.method)
			)
			.map((item) => ({ id: item.id, code: item.code, name: item.name, method: item.method }))
		let rows: { id: number; code: string; name: string; method: string }[] = [...master, BIAYA]
		if (p.q) rows = rows.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(String(p.q).toLowerCase()))
		return [200, paginate(rows, p)]
	})

	mock.onGet(/\/customer-receivable\/\d+$/).reply((config) => {
		const invoice = findApproved(idOf(config.url))
		return invoice ? [200, { data: resolve(invoice, companyIdOf(config)) }] : [404, { message: NOT_FOUND }]
	})

	mock.onPost(/\/customer-receivable\/\d+\/payments$/).reply((config) => {
		const invoice = findSalesInvoice(parentIdOf(config.url))
		if (!invoice) return [404, { message: NOT_FOUND }]
		if (invoice.approval_status !== 'approved') return [422, { message: 'Invoice belum disetujui, pembayaran piutang tidak bisa dicatat' }]
		const companyId = companyIdOf(config)
		const body = JSON.parse(config.data) as CustomerReceivablePaymentRequest
		const amount = Math.round(Number(body.amount))
		const error = validateCommon(invoice, body.date, amount, invoice.outstanding)
		if (error) return [422, error]
		const closed = closedDateReply(config, body.date)
		if (closed) return closed

		const isBiaya = Number(body.payment_type_id) === BIAYA.id
		const type = isBiaya
			? undefined
			: db.paymentType.find((item) => item.id === Number(body.payment_type_id) && !item.deleted_at && item.company_id === companyId)
		if (!isBiaya && (!type || type.transaction_type !== 'sale' || !['cash_bank', 'down_payment'].includes(type.method)))
			return [422, invalid('Tipe pembayaran wajib dipilih', 'payment_type_id')]
		const method = (isBiaya ? BIAYA.method : type!.method) as SalesInvoicePayment['method']

		let reference = ''
		const extra: Partial<SalesInvoicePayment> = {}
		if (method === 'cash_bank') {
			const bank = db.bankAccount.find((item) => item.id === Number(body.bank_account_id) && !item.deleted_at)
			if (!bank) return [422, invalid('Rekening cash / bank wajib dipilih', 'bank_account_id')]
			extra.bank_account_id = bank.id
			reference = bank.bank_name
		} else if (method === 'down_payment') {
			const stored = db.customerDeposit.find((item) => item.id === Number(body.deposit_id))
			const deposit = stored && resolveDeposit(stored)
			if (!deposit || deposit.customer_id !== invoice.customer_id) return [422, invalid('Pilih titipan dari customer yang sama', 'deposit_id')]
			if (amount > deposit.remaining) return [422, invalid(`Nominal melebihi sisa titipan (${deposit.remaining})`, 'amount')]
			extra.deposit_id = deposit.id
			reference = deposit.number
		} else {
			const expense = activeExpense(body.sales_expense_id)
			if (!expense) return [422, invalid('Biaya penjualan wajib dipilih', 'sales_expense_id')]
			extra.sales_expense_id = expense.id
			reference = expense.name
		}

		const id = nextId(db.salesInvoicePayment)
		const number = invoicePaymentNumber(
			invoice.number,
			Math.max(0, ...paymentsOfInvoice(invoice.id).map((row) => Number(numberOf(row).slice(-2)) || 0)) + 1
		)
		const description = String(body.description || '').trim()
		db.salesInvoicePayment.push({
			id,
			invoice_id: invoice.id,
			date: body.date,
			payment_type_id: isBiaya ? BIAYA.id : type!.id,
			payment_type: isBiaya ? BIAYA.name : type!.name,
			method,
			reference,
			amount,
			kind: 'receivable',
			number,
			description,
			...extra
		})
		if (extra.deposit_id) {
			db.customerDepositUsage.push({
				id: nextId(db.customerDepositUsage),
				customer_deposit_id: extra.deposit_id,
				date: body.date,
				invoice_id: invoice.id,
				invoice_number: invoice.number,
				note: usageNote(number),
				amount
			})
			recordHistory('customer-deposit', extra.deposit_id, {
				title: 'Dipakai di Invoice Penjualan',
				kind: 'info',
				summary: `${invoice.number} · ${money(amount)}`
			})
		}
		recordHistory('sales-invoice', invoice.id, { title: 'Pembayaran Piutang Dicatat', kind: 'info', summary: `${number} · ${fmtMoney(amount)}` })
		return [201, { data: resolve(findSalesInvoice(invoice.id)!, companyId), message: 'Pembayaran piutang dicatat' }]
	})

	// Edit a payment recorded here: date, amount, description (and the bank / expense item). Type and titipan are fixed — cancel and re-record
	// to change those. Locked once its own period is closed.
	mock.onPut(/\/customer-receivable\/\d+\/payments\/\d+$/).reply((config) => {
		const invoice = findSalesInvoice(grandParentIdOf(config.url))
		if (!invoice) return [404, { message: NOT_FOUND }]
		const payment = db.salesInvoicePayment.find((item) => item.id === idOf(config.url) && item.invoice_id === invoice.id)
		if (!payment) return [404, { message: 'Pembayaran tidak ditemukan' }]
		const managed = managedElsewhere(payment)
		if (managed) return [422, { message: managed }]
		const companyId = companyIdOf(config)
		const closed = closedReply(config, payment.date, 'pembayaran tidak bisa diubah')
		if (closed) return closed
		const body = JSON.parse(config.data) as Partial<CustomerReceivablePaymentRequest>
		const amount = Math.round(Number(body.amount))
		const error = validateCommon(invoice, body.date, amount, invoice.outstanding + payment.amount)
		if (error) return [422, error]
		const closedDate = closedDateReply(config, body.date)
		if (closedDate) return closedDate

		const date = String(body.date)
		const patch: Partial<SalesInvoicePayment> = {}
		if (payment.method === 'cash_bank') {
			const bank = db.bankAccount.find((item) => item.id === Number(body.bank_account_id) && !item.deleted_at)
			if (!bank) return [422, invalid('Rekening cash / bank wajib dipilih', 'bank_account_id')]
			Object.assign(patch, { bank_account_id: bank.id, reference: bank.bank_name })
		} else if (payment.method === 'down_payment') {
			const stored = db.customerDeposit.find((item) => item.id === payment.deposit_id)
			const capacity = (stored ? resolveDeposit(stored).remaining : 0) + payment.amount
			if (amount > capacity) return [422, invalid(`Nominal melebihi sisa titipan (${capacity})`, 'amount')]
		} else {
			const expense = activeExpense(body.sales_expense_id)
			if (!expense) return [422, invalid('Biaya penjualan wajib dipilih', 'sales_expense_id')]
			Object.assign(patch, { sales_expense_id: expense.id, reference: expense.name })
		}

		Object.assign(payment, patch, { date, amount, description: String(body.description || '').trim() })
		// Keep the mirrored usage row on the titipan in step.
		const usage = db.customerDepositUsage.find(
			(item) => item.customer_deposit_id === payment.deposit_id && item.invoice_id === invoice.id && item.note === usageNote(numberOf(payment))
		)
		if (usage) Object.assign(usage, { date, amount })
		recordHistory('sales-invoice', invoice.id, {
			title: 'Pembayaran Piutang Diubah',
			kind: 'updated',
			summary: `${numberOf(payment)} · ${fmtMoney(amount)}`
		})
		return [200, { data: resolve(findSalesInvoice(invoice.id)!, companyId), message: 'Pembayaran diperbarui' }]
	})

	mock.onDelete(/\/customer-receivable\/\d+\/payments\/\d+$/).reply((config) => {
		const invoice = findSalesInvoice(grandParentIdOf(config.url))
		if (!invoice) return [404, { message: NOT_FOUND }]
		const index = db.salesInvoicePayment.findIndex((item) => item.id === idOf(config.url) && item.invoice_id === invoice.id)
		if (index < 0) return [404, { message: 'Pembayaran tidak ditemukan' }]
		const payment = db.salesInvoicePayment[index]
		const managed = managedElsewhere(payment)
		if (managed) return [422, { message: managed }]
		const closed = closedReply(config, payment.date, 'pembayaran tidak bisa dibatalkan')
		if (closed) return closed
		db.salesInvoicePayment.splice(index, 1)
		if (payment.deposit_id) {
			const usageIndex = db.customerDepositUsage.findIndex(
				(item) => item.customer_deposit_id === payment.deposit_id && item.invoice_id === invoice.id && item.note === usageNote(numberOf(payment))
			)
			if (usageIndex >= 0) db.customerDepositUsage.splice(usageIndex, 1)
			recordHistory('customer-deposit', payment.deposit_id, {
				title: 'Pemakaian Invoice Dibatalkan',
				kind: 'info',
				summary: `${invoice.number} · ${money(payment.amount)}`
			})
		}
		recordHistory('sales-invoice', invoice.id, {
			title: 'Pembayaran Piutang Dibatalkan',
			kind: 'info',
			summary: `${numberOf(payment)} · ${fmtMoney(payment.amount)}`
		})
		return [200, { data: resolve(findSalesInvoice(invoice.id)!, companyIdOf(config)), message: 'Pembayaran dibatalkan' }]
	})
}
