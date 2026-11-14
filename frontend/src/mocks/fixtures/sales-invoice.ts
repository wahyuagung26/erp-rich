import type { SalesInvoice, SalesInvoiceLine, SalesInvoicePayment, SalesOrderExpense } from '@/utils/types'

// Stored shape: inputs + approval bookkeeping only. Labels, amounts, payments and paid/outstanding are derived on read (mocks/modules/sales-invoice.ts).
export type SalesInvoiceRow = Omit<
	SalesInvoice,
	| 'locked'
	| 'due_date'
	| 'customer_code'
	| 'customer_name'
	| 'customer_address'
	| 'customer_phone'
	| 'sales_code'
	| 'sales_name'
	| 'department_code'
	| 'department_name'
	| 'sales_order_number'
	| 'discount_global'
	| 'lines'
	| 'expenses'
	| 'subtotal'
	| 'dpp'
	| 'ppn'
	| 'expense_total'
	| 'total'
	| 'payments'
	| 'paid_total'
	| 'outstanding'
	| 'payment_status'
> & {
	lines: Pick<SalesInvoiceLine, 'product_id' | 'warehouse_id' | 'quantity' | 'price' | 'discount' | 'notes'>[]
	expenses: Pick<SalesOrderExpense, 'sales_expense_id' | 'notes' | 'amount'>[]
}

const line = (product_id: number, quantity: number, price: number, discount = 0, notes = '') => ({
	product_id,
	warehouse_id: 1,
	quantity,
	price,
	discount,
	notes
})

const base = {
	rejection_reason: null,
	approved_by: null,
	approved_at: null,
	tax_invoice: null,
	created_by: 'Admin',
	discount_type: 'nominal' as const,
	discount_value: 0,
	expenses: []
}

const approved = (at: string) => ({ approval_status: 'approved' as const, approved_by: 'Admin', approved_at: `${at}T09:30:00.000Z` })

// Refs resolve against the company 1 fixtures (customers 1/2/4/5/6, sales 1-3, department 9, products 1-3, warehouse 1).
// 1 + 2 mirror the invoiced quantities already seeded on Sales Order 3 (4 of 10) and 4 (8 of 8); 4 is dated in the closed period (closed_until 2026-07).
export const salesInvoiceSeed: SalesInvoiceRow[] = [
	{
		...base,
		id: 1,
		number: 'RIN.INV260920/001',
		date: '2026-09-20',
		top_days: 30,
		customer_id: 4,
		sales_id: 2,
		department_id: 9,
		sales_order_id: 3,
		pkp_active: true,
		description: 'Pengiriman tahap pertama pesanan rutin',
		discount_type: 'percent',
		discount_value: 5,
		...approved('2026-09-20'),
		lines: [line(1, 4, 4_200_000, 200_000)],
		expenses: [{ sales_expense_id: 1, notes: 'Kirim ke gudang customer', amount: 250_000 }]
	},
	{
		...base,
		id: 2,
		number: 'RIN.INV260919/001',
		date: '2026-09-19',
		top_days: 7,
		customer_id: 6,
		sales_id: 1,
		department_id: 9,
		sales_order_id: 4,
		pkp_active: true,
		description: 'Pesanan retail akhir bulan',
		discount_value: 150_000,
		...approved('2026-09-19'),
		tax_invoice: { number: '010.000-26.00000021', date: '2026-09-20', file: null },
		lines: [line(3, 8, 250_000)]
	},
	{
		...base,
		id: 3,
		number: 'RIN.INV261012/001',
		date: '2026-10-12',
		top_days: 30,
		customer_id: 1,
		sales_id: 1,
		department_id: 9,
		sales_order_id: null,
		pkp_active: false,
		description: 'Penjualan langsung tanpa sales order',
		approval_status: 'pending',
		lines: [line(1, 1, 4_200_000, 100_000)]
	},
	{
		...base,
		id: 4,
		number: 'RIN.INV260715/001',
		date: '2026-07-15',
		top_days: 14,
		customer_id: 4,
		sales_id: 3,
		department_id: 9,
		sales_order_id: null,
		pkp_active: true,
		description: 'Periode Juli (sudah closing)',
		...approved('2026-07-15'),
		tax_invoice: { number: '010.000-26.00000007', date: '2026-07-16', file: null },
		lines: [line(3, 10, 250_000)]
	},
	{
		...base,
		id: 5,
		number: 'RIN.INV261005/001',
		date: '2026-10-05',
		top_days: 0,
		customer_id: 5,
		sales_id: 2,
		department_id: 9,
		sales_order_id: null,
		pkp_active: false,
		description: 'Harga perlu dikoreksi',
		approval_status: 'rejected',
		rejection_reason: 'Invoice ditolak, silakan periksa kembali detailnya.',
		lines: [line(2, 2, 1_250_000)]
	},
	{
		...base,
		id: 6,
		number: 'RIN.INV260820/001',
		date: '2026-08-20',
		top_days: 14,
		customer_id: 2,
		sales_id: 3,
		department_id: 9,
		sales_order_id: null,
		pkp_active: true,
		description: 'Belum dibayar, sudah lewat jatuh tempo',
		...approved('2026-08-20'),
		lines: [line(1, 2, 4_200_000)]
	}
]

// Invoice 1 total 17.122.000: 5.000.000 with the invoice (2.000.000 tunai + 3.000.000 titipan) + 4.000.000 receivable → partial. Invoice 2 total 2.053.500: paid in full with the invoice.
const pay = (
	id: number,
	invoice_id: number,
	date: string,
	amount: number,
	kind: SalesInvoicePayment['kind'],
	reference = ''
): SalesInvoicePayment => ({
	id,
	invoice_id,
	date,
	payment_type_id: 1,
	payment_type: 'Tunai',
	method: 'cash_bank',
	reference,
	amount,
	kind
})

const titipan = (id: number, invoice_id: number, date: string, amount: number, deposit_id: number, reference: string): SalesInvoicePayment => ({
	id,
	invoice_id,
	date,
	payment_type_id: 2,
	payment_type: 'Titipan Customer',
	method: 'down_payment',
	reference,
	amount,
	kind: 'creation',
	deposit_id
})

export const salesInvoicePaymentSeed: SalesInvoicePayment[] = [
	pay(1, 1, '2026-09-20', 2_000_000, 'creation', 'DP saat invoice'),
	pay(2, 1, '2026-10-02', 4_000_000, 'receivable', 'Termin kedua'),
	pay(3, 2, '2026-09-19', 2_053_500, 'creation'),
	pay(4, 4, '2026-07-15', 1_000_000, 'creation'),
	// Paid with a Titipan Customer: each row has a matching usage row in fixtures/customer-deposit.ts.
	titipan(7, 1, '2026-09-20', 3_000_000, 2, 'TSC.RIN/260818/001'),
	titipan(8, 3, '2026-10-12', 2_500_000, 1, 'TSC.RIN/260903/001')
]
