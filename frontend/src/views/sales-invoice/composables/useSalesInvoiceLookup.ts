import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { useSalesOrderLookup } from '@/views/sales-order/composables/useSalesOrderLookup'
import type { Customer, SalesOrderInvoiceableLines } from '@/utils/types'
import { fromInvoiceableLines } from '../mappers'
import { nearestTopDays, type SalesInvoiceDraft } from '../schema'

// Lookups that prefill the invoice form; every prefilled value stays editable afterwards.
export function useSalesInvoiceLookup() {
	const toast = useToast()
	const { applyVariant } = useSalesOrderLookup()

	// Customer → PKP status + termin (the invoice's own values stay editable).
	async function applyCustomerDefaults(draft: SalesInvoiceDraft, customerId: number | null) {
		draft.customer_id = customerId
		if (!customerId) return
		try {
			const customer = (await api.get<{ data: Customer }>(`/customer/${customerId}`)).data.data
			draft.pkp_active = Boolean(customer.pkp)
			draft.top_days = nearestTopDays(customer.top_days)
		} catch {
			toast.error('Customer tidak dapat dimuat')
		}
	}

	// Sales Order → header defaults, biaya, diskon global and all its lines. Returns the order header (labels), or the
	// 422/404 message when the order cannot be invoiced (not approved, or already invoiced).
	async function applySalesOrder(
		draft: SalesInvoiceDraft,
		orderId: number
	): Promise<{ data?: SalesOrderInvoiceableLines['sales_order']; error?: string }> {
		try {
			const { sales_order: order, lines } = (await api.get<{ data: SalesOrderInvoiceableLines }>(`/sales-order/${orderId}/invoiceable-lines`)).data
				.data
			const open = fromInvoiceableLines({ sales_order: order, lines })
			Object.assign(draft, {
				sales_order_id: order.id,
				customer_id: order.customer_id,
				sales_id: order.sales_id,
				department_id: order.department_id,
				pkp_active: order.pkp_active,
				top_days: order.top_days,
				description: order.description,
				discount_type: order.discount_type,
				discount_value: order.discount_value,
				lines: open,
				expenses: order.expenses.map((expense) => ({
					sales_expense_id: expense.sales_expense_id,
					sales_expense_label: `${expense.sales_expense_code} — ${expense.sales_expense_name}`,
					notes: expense.notes,
					amount: expense.amount
				}))
			})
			return { data: order }
		} catch (error) {
			return {
				error: axios.isAxiosError(error) ? (error.response?.data?.message ?? 'Sales order tidak dapat dimuat') : 'Sales order tidak dapat dimuat'
			}
		}
	}

	return { applyCustomerDefaults, applySalesOrder, applyVariant }
}
