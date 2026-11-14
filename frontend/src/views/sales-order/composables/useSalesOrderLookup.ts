import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import type { Customer, ProductVariantOption } from '@/utils/types'
import { nearestTopDays, type SalesOrderDraft, type SalesOrderLineDraft } from '../schema'

// Lookups prefill defaults from the picked master row; the user can still edit them afterwards.
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

	// Picked SKU row (GET /product-variant) → display labels + price from the selling price (only when the line has no price yet).
	function applyVariant(line: SalesOrderLineDraft, variant: ProductVariantOption | null) {
		line.variant_id = variant?.id ?? null
		line.product_code = variant?.product_code
		line.product_name = variant?.product_name
		line.sku = variant?.sku
		line.variant_label = variant?.label
		line.brand_name = variant?.brand_name
		line.unit_name = variant?.unit_name
		if (variant && !line.price) line.price = variant.selling_price
	}

	return { applyCustomerDefaults, applyVariant }
}
