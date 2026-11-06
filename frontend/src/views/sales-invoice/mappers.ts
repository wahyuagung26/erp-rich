import type { SalesInvoice, SalesInvoiceRequest, SalesOrderInvoiceableLines } from '@/utils/types'
import type { SalesInvoiceDraft, SalesInvoiceForm, SalesInvoiceLineDraft } from './schema'

const DEFAULT_DEPARTMENT_ID = 9 // SLS
export const DEFAULT_DEPARTMENT_LABEL = 'SLS — Sales'

export function createEmptySalesInvoiceDraft(): SalesInvoiceDraft {
	return {
		sales_order_id: null,
		date: new Date().toISOString().slice(0, 10),
		customer_id: null,
		sales_id: null,
		department_id: DEFAULT_DEPARTMENT_ID,
		top_days: 0,
		pkp_active: false,
		description: '',
		discount_type: 'nominal',
		discount_value: 0,
		lines: [],
		expenses: [],
		payments: []
	}
}

export function toSalesInvoiceDraft(invoice: SalesInvoice): SalesInvoiceDraft {
	return {
		sales_order_id: invoice.sales_order_id,
		date: invoice.date,
		customer_id: invoice.customer_id,
		sales_id: invoice.sales_id,
		department_id: invoice.department_id,
		top_days: invoice.top_days,
		pkp_active: invoice.pkp_active,
		description: invoice.description,
		discount_type: invoice.discount_type,
		discount_value: invoice.discount_value,
		lines: invoice.lines.map((line) => ({
			product_id: line.product_id,
			product_code: line.product_code,
			product_name: line.product_name,
			brand_name: line.brand_name,
			unit_name: line.unit_name,
			warehouse_id: line.warehouse_id,
			warehouse_label: `${line.warehouse_code} — ${line.warehouse_name}`,
			quantity: line.quantity,
			price: line.price,
			discount: line.discount,
			notes: line.notes,
			max_quantity: line.max_quantity
		})),
		expenses: invoice.expenses.map((expense) => ({
			sales_expense_id: expense.sales_expense_id,
			sales_expense_label: `${expense.sales_expense_code} — ${expense.sales_expense_name}`,
			notes: expense.notes,
			amount: expense.amount
		})),
		// Only the payments made with the invoice are editable here; receivable payments belong to Piutang Customer.
		payments: invoice.payments
			.filter((payment) => payment.kind === 'creation')
			.map((payment) => ({
				payment_type_id: payment.payment_type_id,
				payment_type_label: payment.payment_type,
				method: payment.method,
				deposit_id: payment.deposit_id ?? null,
				deposit_label: payment.deposit_number,
				sales_expense_id: payment.sales_expense_id ?? null,
				sales_expense_label: payment.sales_expense_id ? payment.reference : undefined,
				reference: payment.deposit_id || payment.sales_expense_id ? '' : payment.reference,
				amount: payment.amount
			}))
	}
}

// Sales Order lookup → draft lines. Lines with nothing left to invoice are dropped; the rest default to the full remaining quantity.
export function fromInvoiceableLines(data: SalesOrderInvoiceableLines): SalesInvoiceLineDraft[] {
	return data.lines
		.filter((line) => line.remaining_quantity > 0)
		.map((line) => ({
			product_id: line.product_id,
			product_code: line.product_code,
			product_name: line.product_name,
			brand_name: line.brand_name,
			unit_name: line.unit_name,
			warehouse_id: line.warehouse_id,
			warehouse_label: `${line.warehouse_code} — ${line.warehouse_name}`,
			quantity: line.remaining_quantity,
			price: line.price,
			discount: line.discount,
			notes: line.notes,
			max_quantity: line.remaining_quantity
		}))
}

export function toSalesInvoiceRequest(form: SalesInvoiceForm): SalesInvoiceRequest {
	return {
		sales_order_id: form.sales_order_id,
		date: form.date,
		customer_id: form.customer_id,
		sales_id: form.sales_id,
		department_id: form.department_id,
		top_days: form.top_days,
		pkp_active: form.pkp_active,
		description: form.description,
		discount_type: form.discount_type,
		discount_value: form.discount_value,
		lines: form.lines.map((line) => ({
			product_id: line.product_id,
			warehouse_id: line.warehouse_id,
			quantity: line.quantity,
			price: line.price,
			discount: line.discount,
			notes: line.notes
		})),
		expenses: form.expenses.map((expense) => ({ sales_expense_id: expense.sales_expense_id, notes: expense.notes, amount: expense.amount })),
		payments: form.payments.map((payment) => ({
			payment_type_id: payment.payment_type_id,
			reference: payment.reference,
			amount: payment.amount,
			deposit_id: payment.deposit_id,
			...(payment.sales_expense_id ? { sales_expense_id: payment.sales_expense_id } : {})
		}))
	}
}
