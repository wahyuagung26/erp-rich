import type { PurchaseReceipt, PurchaseReceiptLine, PurchaseReceiptLineRequest, PurchaseReceiptRequest } from '@/utils/types'
import type { PurchaseReceiptDraft, PurchaseReceiptForm, PurchaseReceiptLineDraft, PurchaseReceiptLineForm } from './schema'

export function createEmptyPurchaseReceiptDraft(): PurchaseReceiptDraft {
	return {
		purchase_order_id: null,
		delivery_note_number: '',
		description: '',
		department_id: null,
		date: new Date().toISOString().slice(0, 10),
		lines: []
	}
}

function toLineDraft(line: PurchaseReceiptLine): PurchaseReceiptLineDraft {
	return {
		product_id: line.product_id,
		product_code: line.product_code,
		product_name: line.product_name,
		brand_name: line.brand_name,
		unit_name: line.unit_name,
		ordered_quantity: line.ordered_quantity,
		received_quantity: line.received_quantity,
		remaining_quantity: line.remaining_quantity,
		quantity: line.quantity,
		warehouse_id: line.warehouse_id,
		warehouse_code: line.warehouse_code,
		warehouse_name: line.warehouse_name
	}
}

// Edit's initial draft — purchase_order_id can't change (see docs/purchase-receipt/), so
// this reads lines straight from the loaded receipt instead of the receivable-lines lookup.
export function toPurchaseReceiptDraft(receipt: PurchaseReceipt): PurchaseReceiptDraft {
	return {
		purchase_order_id: receipt.purchase_order_id,
		delivery_note_number: receipt.delivery_note_number,
		description: receipt.description,
		department_id: receipt.department_id,
		date: receipt.date,
		lines: receipt.lines.map(toLineDraft)
	}
}

function toLineRequest(line: PurchaseReceiptLineForm): PurchaseReceiptLineRequest {
	return { product_id: line.product_id, quantity: line.quantity, warehouse_id: line.warehouse_id }
}

export function toPurchaseReceiptRequest(form: PurchaseReceiptForm): PurchaseReceiptRequest {
	return {
		purchase_order_id: form.purchase_order_id,
		delivery_note_number: form.delivery_note_number,
		description: form.description,
		department_id: form.department_id,
		date: form.date,
		lines: form.lines.filter((line) => line.quantity > 0).map(toLineRequest)
	}
}
