import type { PurchaseReceipt, PurchaseReceiptLine } from '@/utils/types'

// Row shape mirrors purchase-order.ts's convention: only product_id/quantity/warehouse_id
// are real, the rest of each line (and the PO/supplier/department breadcrumbs) are
// placeholders — the mock's resolve() always recomputes them fresh from db.purchaseOrder,
// db.product, db.department, and db.warehouse on every read.
function line(product_id: number, quantity: number, warehouse_id: number): PurchaseReceiptLine {
	return { product_id, ordered_quantity: 0, received_quantity: 0, remaining_quantity: 0, quantity, warehouse_id }
}

// Aligned with purchase-order seed's existing `delivery_status`: PO 2 is `partial`
// (100 ordered, 40 received here) and PO 3 is `full` (10 ordered, 10 received here) —
// see mocks/fixtures/purchase-order.ts.
export const purchaseReceiptSeed: PurchaseReceipt[] = [
	{
		id: 1,
		number: 'BM-RICH/0001/09/2026',
		purchase_order_id: 2,
		delivery_note_number: 'SJ-2026-0091',
		description: 'Penerimaan sebagian produk PO',
		department_id: 10,
		invoice_status: 'not_invoiced',
		date: '2026-09-06',
		created_by: 'FAT',
		lines: [line(1, 40, 1)]
	},
	{
		id: 2,
		number: 'BM-RICH/0002/09/2026',
		purchase_order_id: 3,
		delivery_note_number: 'SJ-2026-0102',
		description: 'Penerimaan penuh produk PO',
		department_id: 19,
		invoice_status: 'invoiced',
		date: '2026-09-07',
		created_by: 'Purchasing',
		lines: [line(2, 10, 1)]
	}
]
