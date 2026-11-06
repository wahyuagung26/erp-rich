import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import type { SalesInvoiceDeliverableLines } from '@/utils/types'
import type { DeliveryNoteDraft } from '../schema'

// Looks up the picked invoice's deliverable lines and seeds the draft: lines (qty = invoice qty) and the address from the customer.
// Only used on a new surat jalan — the invoice can't change once one exists, see docs/delivery-note/.
export function useDeliveryNoteInvoice() {
	const toast = useToast()

	async function applyInvoice(draft: DeliveryNoteDraft, invoiceId: number | null) {
		draft.sales_invoice_id = invoiceId
		draft.lines = []
		if (!invoiceId) return null
		try {
			const res = await api.get<{ data: SalesInvoiceDeliverableLines }>(`/sales-invoice/${invoiceId}/deliverable-lines`)
			const { sales_invoice, lines } = res.data.data
			draft.delivery_address = sales_invoice.customer_address ?? ''
			draft.lines = lines.map((line) => ({ ...line }))
			return sales_invoice
		} catch (error) {
			draft.sales_invoice_id = null
			toast.error(axios.isAxiosError(error) ? (error.response?.data?.message ?? 'Invoice tidak dapat dimuat') : 'Invoice tidak dapat dimuat')
			return null
		}
	}

	return { applyInvoice }
}
