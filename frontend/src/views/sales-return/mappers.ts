import type { SalesReturn, SalesReturnLine, SalesReturnRequest } from '@/utils/types'
import type { SalesReturnDraft, SalesReturnForm, SalesReturnLineDraft } from './schema'

export function createEmptySalesReturnDraft(): SalesReturnDraft {
	return { sales_invoice_id: null, date: new Date().toISOString().slice(0, 10), warehouse_id: null, reason: '', pkp_active: false, lines: [] }
}

export function toLineDraft(line: SalesReturnLine): SalesReturnLineDraft {
	return {
		variant_id: line.variant_id,
		product_code: line.product_code,
		product_name: line.product_name,
		sku: line.sku,
		variant_label: line.variant_label,
		brand_name: line.brand_name,
		unit_name: line.unit_name,
		quantity_sold: line.quantity_sold,
		quantity_returned_before: line.quantity_returned_before,
		quantity: line.quantity,
		price: line.price,
		discount: line.discount
	}
}

// Edit: the saved lines only hold returned products, so the full product list is re-merged by the form via the invoice lookup.
export function toSalesReturnDraft(row: SalesReturn): SalesReturnDraft {
	return {
		sales_invoice_id: row.sales_invoice_id,
		date: row.date,
		warehouse_id: row.warehouse_id,
		reason: row.reason,
		pkp_active: row.pkp_active,
		lines: row.lines.map(toLineDraft)
	}
}

export function toSalesReturnRequest(form: SalesReturnForm): SalesReturnRequest {
	return {
		sales_invoice_id: form.sales_invoice_id,
		date: form.date,
		warehouse_id: form.warehouse_id,
		reason: form.reason,
		lines: form.lines.map((line) => ({ variant_id: line.variant_id, quantity: line.quantity }))
	}
}
