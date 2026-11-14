import type { SalesOrder, SalesOrderRequest } from '@/utils/types'
import type { SalesOrderDraft, SalesOrderForm } from './schema'

const DEFAULT_DEPARTMENT_ID = 9 // SLS
export const DEFAULT_DEPARTMENT_LABEL = 'SLS — Sales'

export function createEmptySalesOrderDraft(): SalesOrderDraft {
	return {
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
		expenses: []
	}
}

export function toSalesOrderDraft(order: SalesOrder): SalesOrderDraft {
	return {
		date: order.date,
		customer_id: order.customer_id,
		sales_id: order.sales_id,
		department_id: order.department_id,
		top_days: order.top_days,
		pkp_active: order.pkp_active,
		description: order.description,
		discount_type: order.discount_type,
		discount_value: order.discount_value,
		lines: order.lines.map((line) => ({
			variant_id: line.variant_id,
			product_code: line.product_code,
			product_name: line.product_name,
			sku: line.sku,
			variant_label: line.variant_label,
			brand_name: line.brand_name,
			unit_name: line.unit_name,
			warehouse_id: line.warehouse_id,
			warehouse_label: `${line.warehouse_code} — ${line.warehouse_name}`,
			quantity: line.quantity,
			price: line.price,
			discount: line.discount,
			notes: line.notes
		})),
		expenses: order.expenses.map((expense) => ({
			sales_expense_id: expense.sales_expense_id,
			sales_expense_label: `${expense.sales_expense_code} — ${expense.sales_expense_name}`,
			notes: expense.notes,
			amount: expense.amount
		}))
	}
}

export function toSalesOrderRequest(form: SalesOrderForm): SalesOrderRequest {
	return {
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
			variant_id: line.variant_id,
			warehouse_id: line.warehouse_id,
			quantity: line.quantity,
			price: line.price,
			discount: line.discount,
			notes: line.notes
		})),
		expenses: form.expenses.map((expense) => ({ sales_expense_id: expense.sales_expense_id, notes: expense.notes, amount: expense.amount }))
	}
}
