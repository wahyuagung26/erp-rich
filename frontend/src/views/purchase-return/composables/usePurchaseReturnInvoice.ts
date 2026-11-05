import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import type { PurchaseInvoiceReturnableLines } from '@/utils/types'
import { toLineDraft } from '../mappers'
import type { PurchaseReturnDraft } from '../schema'

// Loads the picked invoice's products with how much of each is still returnable, then seeds the draft.
// On edit, `keep` carries the quantities already saved on this return and `excludeReturnId` stops them counting as "sudah diretur".
export function usePurchaseReturnInvoice() {
	const toast = useToast()

	async function applyInvoice(draft: PurchaseReturnDraft, invoiceId: number | null, keep: Record<number, number> = {}, excludeReturnId?: number) {
		draft.purchase_invoice_id = invoiceId
		draft.lines = []
		draft.pkp_active = false
		if (!invoiceId) return null
		try {
			const res = await api.get<{ data: PurchaseInvoiceReturnableLines }>(`/purchase-invoice/${invoiceId}/returnable-lines`, {
				params: { exclude_return_id: excludeReturnId }
			})
			const { purchase_invoice, lines } = res.data.data
			draft.pkp_active = purchase_invoice.pkp_active
			draft.lines = lines.map((line) => ({ ...toLineDraft(line), quantity: keep[line.product_id] ?? 0 }))
			return purchase_invoice
		} catch {
			toast.error('Invoice pembelian tidak dapat dimuat')
			return null
		}
	}

	return { applyInvoice }
}
