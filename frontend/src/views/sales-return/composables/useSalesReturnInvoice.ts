import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import type { SalesInvoiceReturnableLines } from '@/utils/types'
import { toLineDraft } from '../mappers'
import type { SalesReturnDraft } from '../schema'

// Loads the picked invoice's products with how much of each is still returnable, then seeds the draft.
// On edit, `keep` carries the quantities already saved on this return and `excludeReturnId` stops them counting as "sudah diretur".
export function useSalesReturnInvoice() {
	const toast = useToast()

	async function applyInvoice(draft: SalesReturnDraft, invoiceId: number | null, keep: Record<number, number> = {}, excludeReturnId?: number) {
		draft.sales_invoice_id = invoiceId
		draft.lines = []
		draft.pkp_active = false
		if (!invoiceId) return null
		try {
			const res = await api.get<{ data: SalesInvoiceReturnableLines }>(`/sales-invoice/${invoiceId}/returnable-lines`, {
				params: { exclude_return_id: excludeReturnId }
			})
			const { sales_invoice, lines } = res.data.data
			draft.pkp_active = sales_invoice.pkp_active
			draft.lines = lines.map((line) => ({ ...toLineDraft(line), quantity: keep[line.product_id] ?? 0 }))
			return sales_invoice
		} catch {
			toast.error('Invoice penjualan tidak dapat dimuat')
			return null
		}
	}

	return { applyInvoice }
}
