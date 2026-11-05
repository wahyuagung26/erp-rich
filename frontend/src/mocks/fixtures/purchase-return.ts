import type { PurchaseReturn, PurchaseReturnLine } from '@/utils/types'

// Only product_id/quantity are real on a stored line: the mock's resolve() recomputes labels, price and amounts
// from the source invoice on every read (same convention as the purchase-invoice fixture).
function line(product_id: number, quantity: number): PurchaseReturnLine {
	return { product_id, quantity_purchased: 0, quantity_returned_before: 0, quantity, price: 0, dpp: 0, ppn: 0, total: 0 }
}

type Seed = Omit<PurchaseReturn, 'used_total' | 'refunded_total' | 'remaining_total' | 'settlement_status' | 'settlements'>

const blank = { dpp: 0, ppn: 0, total: 0 }

// Invoice 1 (approved, PKP, product 2 × 10) owns both returns. RB 1 is approved and partly settled — see
// purchaseReturnSettlementSeed; RB 2 is still pending so edit / delete / approve can be exercised.
export const purchaseReturnSeed: Seed[] = [
	{
		id: 1,
		number: 'RB-RICH/0001/09/2026',
		date: '2026-09-12',
		purchase_invoice_id: 1,
		warehouse_id: 1,
		reason: 'Barang rusak saat diterima',
		pkp_active: true,
		approval_status: 'approved',
		approved_by: 'FAT',
		approved_at: '2026-09-12T09:30:00.000Z',
		tax_invoice: null,
		created_by: 'Purchasing',
		lines: [line(2, 2)],
		...blank
	},
	{
		id: 2,
		number: 'RB-RICH/0002/09/2026',
		date: '2026-09-15',
		purchase_invoice_id: 1,
		warehouse_id: 1,
		reason: 'Spesifikasi tidak sesuai pesanan',
		pkp_active: true,
		approval_status: 'pending',
		approved_by: null,
		approved_at: null,
		tax_invoice: null,
		created_by: 'Purchasing',
		lines: [line(2, 1)],
		...blank
	}
]

export interface PurchaseReturnSettlementRow {
	id: number
	purchase_return_id: number
	date: string
	type: 'cash_bank' | 'payable_deduction'
	payable_number: string | null
	payment_number: string | null
	bank_account_id: number | null
	description: string
	amount: number
}

// RB 1 total = 1.776.000: 500.000 offset against a payable (mirrors supplierPayablePaymentSeed), 276.000 refunded.
export const purchaseReturnSettlementSeed: PurchaseReturnSettlementRow[] = [
	{
		id: 1,
		purchase_return_id: 1,
		date: '2026-09-14',
		type: 'payable_deduction',
		payable_number: 'KB-RICH/0001/09/2026',
		payment_number: 'BYR-RICH/0002/09/2026',
		bank_account_id: null,
		description: 'Potong hutang invoice BL-RICH/0001/09/2026',
		amount: 500000
	},
	{
		id: 2,
		purchase_return_id: 1,
		date: '2026-09-16',
		type: 'cash_bank',
		payable_number: null,
		payment_number: null,
		bank_account_id: 1,
		description: 'Pengembalian dana dari supplier',
		amount: 276000
	}
]
