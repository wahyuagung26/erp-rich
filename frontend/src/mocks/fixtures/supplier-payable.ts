// Payments against supplier payables. A payable is not stored — it is derived from an approved purchase invoice
// (id = purchase_invoice_id), so only its payments live here. See mocks/modules/supplier-payable.ts.
export interface SupplierPayablePaymentRow {
	id: number
	payable_id: number
	number: string
	date: string
	payment_type_id: number
	bank_account_id: number | null
	purchase_return_id: number | null
	supplier_advance_id: number | null
	description: string
	amount: number
}

// Invoice 1 total = 8.880.000: 3.000.000 transfer + 500.000 potong retur (RB 1) → partial, 5.380.000 remaining.
export const supplierPayablePaymentSeed: SupplierPayablePaymentRow[] = [
	{
		id: 1,
		payable_id: 1,
		number: 'BYR-RICH/0001/09/2026',
		date: '2026-09-10',
		payment_type_id: 3,
		bank_account_id: 1,
		purchase_return_id: null,
		supplier_advance_id: null,
		description: 'Pembayaran termin pertama',
		amount: 3000000
	},
	{
		id: 2,
		payable_id: 1,
		number: 'BYR-RICH/0002/09/2026',
		date: '2026-09-14',
		payment_type_id: 4,
		bank_account_id: null,
		purchase_return_id: 1,
		supplier_advance_id: null,
		description: 'Potong retur RB-RICH/0001/09/2026',
		amount: 500000
	}
]
