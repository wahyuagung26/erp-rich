import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import type { PurchaseReceiptInvoiceableLines } from '@/utils/types'
import { toLineDraft } from '../mappers'
import type { PurchaseInvoiceDraft } from '../schema'

// Looks up the picked receipt's received lines (with default prices) and the PO's PKP status,
// then seeds the draft. Only used on a new invoice — the receipt is locked once an invoice exists.
export function usePurchaseInvoiceReceipt() {
	const toast = useToast()

	async function applyReceipt(draft: PurchaseInvoiceDraft, receiptId: number | null) {
		draft.purchase_receipt_id = receiptId
		draft.lines = []
		draft.pkp_active = false
		if (!receiptId) return null
		try {
			const res = await api.get<{ data: PurchaseReceiptInvoiceableLines }>(`/purchase-receipt/${receiptId}/invoiceable-lines`)
			const { purchase_receipt, lines } = res.data.data
			draft.pkp_active = purchase_receipt.pkp_active
			draft.lines = lines.map(toLineDraft)
			return purchase_receipt
		} catch {
			toast.error('Penerimaan pembelian tidak dapat dimuat')
			return null
		}
	}

	return { applyReceipt }
}
