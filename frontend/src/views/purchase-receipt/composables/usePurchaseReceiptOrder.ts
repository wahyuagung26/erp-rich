import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import type { PurchaseOrderReceivableLines } from '@/utils/types'
import type { PurchaseReceiptDraft } from '../schema'

// Looks up the picked PO's receivable lines, seeds the draft's product lines (quantity 0,
// warehouse defaulted to the PO's), and defaults department. Only used on a new receipt —
// purchase_order_id can't change once a receipt exists, see docs/purchase-receipt/.
export function usePurchaseReceiptOrder() {
	const toast = useToast()

	async function applyPurchaseOrder(draft: PurchaseReceiptDraft, poId: number | null) {
		draft.purchase_order_id = poId
		draft.lines = []
		if (!poId) return null
		try {
			const res = await api.get<{ data: PurchaseOrderReceivableLines }>(`/purchase-order/${poId}/receivable-lines`)
			const { purchase_order, lines } = res.data.data
			draft.department_id = purchase_order.department_id
			draft.lines = lines.map((line) => ({ ...line }))
			return purchase_order
		} catch {
			toast.error('Order pembelian tidak dapat dimuat')
			return null
		}
	}

	return { applyPurchaseOrder }
}
