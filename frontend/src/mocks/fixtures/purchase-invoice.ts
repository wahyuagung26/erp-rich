import type { PurchaseInvoice, PurchaseInvoiceLine } from '@/utils/types'

// Only product_id/price are real on a stored line: the mock's resolve() recomputes
// quantity (from the receipt), labels, and amounts on every read — same convention as
// the purchase-receipt fixture.
function line(product_id: number, price: number): PurchaseInvoiceLine {
	return { product_id, quantity: 0, price, dpp: 0, ppn: 0, total: 0 }
}

// Receipt 2 is seeded `invoiced` (see fixtures/purchase-receipt.ts), so it owns this
// approved invoice. Receipt 1 stays `not_invoiced` for the create flow.
export const purchaseInvoiceSeed: PurchaseInvoice[] = [
	{
		id: 1,
		number: 'BL-RICH/0001/09/2026',
		date: '2026-09-08',
		purchase_receipt_id: 2,
		supplier_invoice_number: 'INV-SUP-0102',
		description: 'Tagihan penerimaan penuh PO',
		pkp_active: true,
		approval_status: 'approved',
		approved_by: 'FAT',
		approved_at: '2026-09-09T08:00:00.000Z',
		kontrabon_number: 'KB-RICH/0001/09/2026',
		tax_invoice: { number: '010.000-26.00000001', date: '2026-09-09', file: null },
		created_by: 'Purchasing',
		lines: [line(2, 800000)],
		dpp: 0,
		ppn: 0,
		total: 0
	}
]
