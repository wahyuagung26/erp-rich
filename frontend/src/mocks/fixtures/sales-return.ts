import type { SalesInvoicePayment, SalesReturn, SalesReturnLine, SalesReturnSettlementType } from '@/utils/types'

// Stored shape: inputs + approval bookkeeping only. Labels, price / discount, amounts and settlement totals are derived on read
// from the source invoice (mocks/modules/sales-return.ts), the same convention as the purchase-return fixture.
export type SalesReturnRow = Omit<
	SalesReturn,
	| 'locked'
	| 'sales_invoice_number'
	| 'sales_invoice_date'
	| 'customer_id'
	| 'customer_code'
	| 'customer_name'
	| 'department_id'
	| 'department_code'
	| 'department_name'
	| 'warehouse_code'
	| 'warehouse_name'
	| 'lines'
	| 'dpp'
	| 'ppn'
	| 'total'
	| 'used_total'
	| 'refunded_total'
	| 'remaining_total'
	| 'invoice_outstanding'
	| 'settlement_status'
	| 'settlements'
> & { lines: Pick<SalesReturnLine, 'variant_id' | 'quantity'>[] }

export interface SalesReturnSettlementRow {
	id: number
	sales_return_id: number
	date: string
	type: SalesReturnSettlementType
	bank_account_id: number | null
	description: string
	amount: number
	invoice_payment_id: number | null // the db.salesInvoicePayment row a receivable_deduction owns
}

const base = { rejection_reason: null, approved_by: null, approved_at: null, tax_invoice: null, created_by: 'Admin' }
const approved = (at: string) => ({ approval_status: 'approved' as const, approved_by: 'FAT', approved_at: `${at}T09:30:00.000Z` })

// Source invoices (see fixtures/sales-invoice.ts): 1 = approved PKP, product 1 × 4 @ 4.200.000 − 200.000, Sisa 8.122.000 (customer 4);
// 2 = approved PKP, fully paid (customer 6); 4 = approved, dated in the closed period (customer 4); 6 = approved, unpaid (customer 2).
export const salesReturnSeed: SalesReturnRow[] = [
	{
		...base,
		id: 1,
		number: 'RET.RIN260925/001',
		date: '2026-09-25',
		sales_invoice_id: 1,
		warehouse_id: 1,
		reason: 'Barang diterima dalam kondisi rusak',
		pkp_active: true,
		...approved('2026-09-25'),
		lines: [{ variant_id: 1, quantity: 1 }]
	},
	{
		...base,
		id: 2,
		number: 'RET.RIN261010/001',
		date: '2026-10-10',
		sales_invoice_id: 1,
		warehouse_id: 1,
		reason: 'Spesifikasi tidak sesuai pesanan',
		pkp_active: true,
		approval_status: 'pending',
		lines: [{ variant_id: 1, quantity: 1 }]
	},
	{
		...base,
		id: 3,
		number: 'RET.RIN260928/001',
		date: '2026-09-28',
		sales_invoice_id: 2,
		warehouse_id: 1,
		reason: 'Kelebihan kirim, customer mengembalikan sebagian',
		pkp_active: true,
		...approved('2026-09-28'),
		tax_invoice: { number: '010.000-26.00000031', date: '2026-09-29', file: null },
		lines: [{ variant_id: 3, quantity: 2 }]
	},
	{
		...base,
		id: 4,
		number: 'RET.RIN260720/001',
		date: '2026-07-20',
		sales_invoice_id: 4,
		warehouse_id: 1,
		reason: 'Periode Juli (sudah closing)',
		pkp_active: true,
		...approved('2026-07-20'),
		lines: [{ variant_id: 3, quantity: 1 }]
	},
	{
		...base,
		id: 5,
		number: 'RET.RIN261014/001',
		date: '2026-10-14',
		sales_invoice_id: 6,
		warehouse_id: 1,
		reason: 'Barang tidak sesuai',
		pkp_active: true,
		approval_status: 'rejected',
		rejection_reason: 'Retur ditolak, silakan periksa kembali detailnya.',
		lines: [{ variant_id: 1, quantity: 1 }]
	}
]

// RJ 1 total = 4.440.000: 2.000.000 offset against invoice 1 (payment row 5), 1.000.000 refunded → Sisa 1.440.000.
// RJ 4 total = 277.500: 100.000 offset in the closed period (payment row 6, locked), 177.500 refunded → settled.
export const salesReturnSettlementSeed: SalesReturnSettlementRow[] = [
	{
		id: 1,
		sales_return_id: 1,
		date: '2026-09-26',
		type: 'receivable_deduction',
		bank_account_id: null,
		description: 'Potong piutang invoice RIN.INV260920/001',
		amount: 2_000_000,
		invoice_payment_id: 5
	},
	{
		id: 2,
		sales_return_id: 1,
		date: '2026-09-30',
		type: 'cash_bank',
		bank_account_id: 1,
		description: 'Pengembalian dana ke customer',
		amount: 1_000_000,
		invoice_payment_id: null
	},
	{
		id: 3,
		sales_return_id: 4,
		date: '2026-07-25',
		type: 'receivable_deduction',
		bank_account_id: null,
		description: 'Potong piutang invoice RIN.INV260715/001',
		amount: 100_000,
		invoice_payment_id: 6
	},
	{
		id: 4,
		sales_return_id: 4,
		date: '2026-09-02',
		type: 'cash_bank',
		bank_account_id: 1,
		description: 'Pengembalian dana ke customer',
		amount: 177_500,
		invoice_payment_id: null
	}
]

// The invoice-side rows of the receivable_deduction settlements above (db.salesInvoicePayment, kind 'receivable').
// payment_type_id 0: "Retur Penjualan" is not a row of the payment-type master — the label is what is shown.
const returnPayment = (id: number, invoice_id: number, return_id: number, reference: string, date: string, amount: number): SalesInvoicePayment => ({
	id,
	invoice_id,
	date,
	payment_type_id: 0,
	payment_type: 'Retur Penjualan',
	method: 'cash_bank',
	reference,
	amount,
	kind: 'receivable',
	return_id
})

export const salesReturnPaymentSeed: SalesInvoicePayment[] = [
	returnPayment(5, 1, 1, 'RET.RIN260925/001', '2026-09-26', 2_000_000),
	returnPayment(6, 4, 4, 'RET.RIN260720/001', '2026-07-25', 100_000)
]
