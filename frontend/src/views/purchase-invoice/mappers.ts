import type { PurchaseInvoice, PurchaseInvoiceLine, PurchaseInvoiceRequest } from '@/utils/types'
import type { PurchaseInvoiceDraft, PurchaseInvoiceForm, PurchaseInvoiceLineDraft } from './schema'

export function createEmptyPurchaseInvoiceDraft(): PurchaseInvoiceDraft {
	return {
		purchase_receipt_id: null,
		date: new Date().toISOString().slice(0, 10),
		supplier_invoice_number: '',
		description: '',
		pkp_active: false,
		lines: []
	}
}

export function toLineDraft(line: PurchaseInvoiceLine): PurchaseInvoiceLineDraft {
	return {
		product_id: line.product_id,
		product_code: line.product_code,
		product_name: line.product_name,
		brand_name: line.brand_name,
		unit_name: line.unit_name,
		quantity: line.quantity,
		price: line.price
	}
}

export function toPurchaseInvoiceDraft(invoice: PurchaseInvoice): PurchaseInvoiceDraft {
	return {
		purchase_receipt_id: invoice.purchase_receipt_id,
		date: invoice.date,
		supplier_invoice_number: invoice.supplier_invoice_number,
		description: invoice.description,
		pkp_active: invoice.pkp_active,
		lines: invoice.lines.map(toLineDraft)
	}
}

export function toPurchaseInvoiceRequest(form: PurchaseInvoiceForm): PurchaseInvoiceRequest {
	return {
		purchase_receipt_id: form.purchase_receipt_id,
		date: form.date,
		supplier_invoice_number: form.supplier_invoice_number,
		description: form.description,
		lines: form.lines.map((line) => ({ product_id: line.product_id, price: line.price }))
	}
}
