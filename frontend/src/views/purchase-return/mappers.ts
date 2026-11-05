import type { PurchaseReturn, PurchaseReturnLine, PurchaseReturnRequest } from '@/utils/types'
import type { PurchaseReturnDraft, PurchaseReturnForm, PurchaseReturnLineDraft } from './schema'

export function createEmptyPurchaseReturnDraft(): PurchaseReturnDraft {
	return { purchase_invoice_id: null, date: new Date().toISOString().slice(0, 10), warehouse_id: null, reason: '', pkp_active: false, lines: [] }
}

export function toLineDraft(line: PurchaseReturnLine): PurchaseReturnLineDraft {
	return {
		product_id: line.product_id,
		product_code: line.product_code,
		product_name: line.product_name,
		brand_name: line.brand_name,
		unit_name: line.unit_name,
		quantity_purchased: line.quantity_purchased,
		quantity_returned_before: line.quantity_returned_before,
		quantity: line.quantity,
		price: line.price
	}
}

// Edit: the saved lines only hold returned products, so the full product list is re-merged by the form via the invoice lookup.
export function toPurchaseReturnDraft(row: PurchaseReturn): PurchaseReturnDraft {
	return {
		purchase_invoice_id: row.purchase_invoice_id,
		date: row.date,
		warehouse_id: row.warehouse_id,
		reason: row.reason,
		pkp_active: row.pkp_active,
		lines: row.lines.map(toLineDraft)
	}
}

export function toPurchaseReturnRequest(form: PurchaseReturnForm): PurchaseReturnRequest {
	return {
		purchase_invoice_id: form.purchase_invoice_id,
		date: form.date,
		warehouse_id: form.warehouse_id,
		reason: form.reason,
		lines: form.lines.map((line) => ({ product_id: line.product_id, quantity: line.quantity }))
	}
}
