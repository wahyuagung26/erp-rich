import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import type { Customer, Product } from '@/utils/types'
import { nearestTopDays, type SalesOrderDraft, type SalesOrderLineDraft } from '../schema'

// Both lookups fetch the picked master row once and prefill defaults the user can still edit afterwards.
export function useSalesOrderLookup() {
	const toast = useToast()

	// Customer → PKP status + termin (the order's own values stay editable).
	async function applyCustomerDefaults(draft: SalesOrderDraft, customerId: number | null) {
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

	// Product → display labels + price from the product's selling price (only when the line has no price yet).
	async function applyProduct(line: SalesOrderLineDraft, productId: number | null) {
		line.product_id = productId
		line.product_code = undefined
		line.product_name = undefined
		line.brand_name = undefined
		line.unit_name = undefined
		if (!productId) return
		try {
			const product = (await api.get<{ data: Product }>(`/product/${productId}`)).data.data
			line.product_code = product.code
			line.product_name = product.name
			line.brand_name = product.brand_name
			line.unit_name = product.unit_name
			if (!line.price) line.price = product.selling_price
		} catch {
			toast.error('Produk tidak dapat dimuat')
		}
	}

	return { applyCustomerDefaults, applyProduct }
}
