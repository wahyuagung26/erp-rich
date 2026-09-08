import type { PurchaseOrder, PurchaseOrderLine, PurchaseOrderLineRequest, PurchaseOrderRequest } from '@/utils/types'
import type { PurchaseOrderDraft, PurchaseOrderForm, PurchaseOrderLineDraft, PurchaseOrderLineForm } from './schema'

const DEFAULT_DEPARTMENT_ID = 4

export function createEmptyPurchaseOrderDraft(): PurchaseOrderDraft {
	return {
		date: new Date().toISOString().slice(0, 10),
		supplier_id: null,
		pkp_active: false,
		department_id: DEFAULT_DEPARTMENT_ID,
		warehouse_id: null,
		purchase_type: null,
		address: '',
		description: '',
		lines: []
	}
}

function toLineDraft(line: PurchaseOrderLine): PurchaseOrderLineDraft {
	return {
		product_id: line.product_id,
		product_code: line.product_code,
		product_name: line.product_name,
		brand_name: line.brand_name,
		unit_name: line.unit_name,
		quantity: line.quantity,
		price: line.price,
		discount: line.discount
	}
}

export function toPurchaseOrderDraft(order: PurchaseOrder): PurchaseOrderDraft {
	return {
		date: order.date,
		supplier_id: order.supplier_id,
		pkp_active: order.pkp_active,
		department_id: order.department_id,
		warehouse_id: order.warehouse_id,
		purchase_type: order.purchase_type,
		address: order.address,
		description: order.description,
		lines: order.lines.map(toLineDraft)
	}
}

function toLineRequest(line: PurchaseOrderLineForm): PurchaseOrderLineRequest {
	return { product_id: line.product_id, quantity: line.quantity, price: line.price, discount: line.discount }
}

export function toPurchaseOrderRequest(form: PurchaseOrderForm): PurchaseOrderRequest {
	return {
		date: form.date,
		supplier_id: form.supplier_id,
		pkp_active: form.pkp_active,
		department_id: form.department_id,
		warehouse_id: form.warehouse_id,
		purchase_type: form.purchase_type,
		address: form.address,
		description: form.description,
		lines: form.lines.map(toLineRequest)
	}
}
