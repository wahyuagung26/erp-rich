import type { ProductVariantOption } from '@/utils/types'
import type { PurchaseOrderLineDraft } from '../schema'

// Picked SKU row (GET /product-variant) → display labels + the product's purchase price
// (only when the line has no price yet — editing an existing line keeps it).
export function usePurchaseOrderProduct() {
	function applyVariant(line: PurchaseOrderLineDraft, variant: ProductVariantOption | null) {
		line.variant_id = variant?.id ?? null
		line.product_code = variant?.product_code
		line.product_name = variant?.product_name
		line.sku = variant?.sku
		line.variant_label = variant?.label
		line.brand_name = variant?.brand_name
		line.unit_name = variant?.unit_name
		if (variant && !line.price) line.price = variant.last_purchase_price
	}

	return { applyVariant }
}
