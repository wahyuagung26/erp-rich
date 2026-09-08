import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import type { Product } from '@/utils/types'
import type { PurchaseOrderLineDraft } from '../schema'

// Looks up the picked product, fills its display labels, and defaults the price
// (only when the line doesn't already have one — editing an existing line keeps it).
export function usePurchaseOrderProduct() {
	const toast = useToast()

	async function applyProduct(line: PurchaseOrderLineDraft, productId: number | null) {
		line.product_id = productId
		line.product_code = undefined
		line.product_name = undefined
		line.brand_name = undefined
		line.unit_name = undefined
		if (!productId) return
		try {
			const res = await api.get<{ data: Product }>(`/product/${productId}`)
			const product = res.data.data
			line.product_code = product.code
			line.product_name = product.name
			line.brand_name = product.brand_name
			line.unit_name = product.unit_name
			if (!line.price) line.price = product.last_purchase_price
		} catch {
			toast.error('Produk tidak dapat dimuat')
		}
	}

	return { applyProduct }
}
