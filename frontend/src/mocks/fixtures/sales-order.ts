import type { SalesOrder, SalesOrderExpense, SalesOrderLine } from '@/utils/types'

// Stored shape: only inputs + the approval/invoice bookkeeping. Labels and every amount are derived on read (mocks/modules/sales-order.ts).
export type SalesOrderRow = Omit<
	SalesOrder,
	| 'due_date'
	| 'customer_code'
	| 'customer_name'
	| 'customer_address'
	| 'customer_phone'
	| 'sales_code'
	| 'sales_name'
	| 'department_code'
	| 'department_name'
	| 'discount_global'
	| 'invoice_status'
	| 'lines'
	| 'expenses'
	| 'subtotal'
	| 'dpp'
	| 'ppn'
	| 'expense_total'
	| 'total'
> & {
	lines: Pick<SalesOrderLine, 'product_id' | 'warehouse_id' | 'quantity' | 'price' | 'discount' | 'notes' | 'invoiced_quantity'>[]
	expenses: Pick<SalesOrderExpense, 'sales_expense_id' | 'notes' | 'amount'>[]
}

const line = (product_id: number, quantity: number, price: number, discount = 0, invoiced_quantity = 0, notes = '') => ({
	product_id,
	warehouse_id: 1,
	quantity,
	price,
	discount,
	notes,
	invoiced_quantity
})

export const salesOrderSeed: SalesOrderRow[] = [
	{
		id: 1,
		number: 'RIN.SO260902001',
		date: '2026-09-02',
		top_days: 30,
		customer_id: 1,
		sales_id: 1,
		department_id: 9,
		pkp_active: false,
		description: 'Pesanan perlengkapan kantor',
		discount_type: 'nominal',
		discount_value: 0,
		approval_status: 'pending',
		rejection_reason: null,
		approved_by: null,
		approved_at: null,
		created_by: 'Admin',
		lines: [line(1, 2, 4_200_000, 100_000), line(3, 2, 250_000, 0, 0, 'Pasang di lantai 2')],
		expenses: []
	},
	{
		id: 2,
		number: 'RIN.SO260905001',
		date: '2026-09-05',
		top_days: 14,
		customer_id: 2,
		sales_id: 3,
		department_id: 9,
		pkp_active: true,
		description: 'Pesanan toko cabang Sidoarjo',
		discount_type: 'nominal',
		discount_value: 0,
		approval_status: 'approved',
		rejection_reason: null,
		approved_by: 'Admin',
		approved_at: '2026-09-05T09:30:00.000Z',
		created_by: 'Admin',
		lines: [line(1, 3, 4_200_000)],
		expenses: []
	},
	{
		id: 3,
		number: 'RIN.SO260910001',
		date: '2026-09-10',
		top_days: 30,
		customer_id: 4,
		sales_id: 2,
		department_id: 9,
		pkp_active: true,
		description: 'Pesanan rutin bulanan',
		discount_type: 'percent',
		discount_value: 5,
		approval_status: 'approved',
		rejection_reason: null,
		approved_by: 'Admin',
		approved_at: '2026-09-10T09:30:00.000Z',
		created_by: 'Admin',
		lines: [line(1, 10, 4_200_000, 200_000, 4), line(3, 5, 250_000, 0, 0, 'Jadwal pemasangan menyusul')],
		expenses: [{ sales_expense_id: 1, notes: 'Kirim ke gudang customer', amount: 250_000 }]
	},
	{
		id: 4,
		number: 'RIN.SO260918001',
		date: '2026-09-18',
		top_days: 7,
		customer_id: 6,
		sales_id: 1,
		department_id: 9,
		pkp_active: true,
		description: 'Pesanan retail akhir bulan',
		discount_type: 'nominal',
		discount_value: 150_000,
		approval_status: 'approved',
		rejection_reason: null,
		approved_by: 'Admin',
		approved_at: '2026-09-18T10:00:00.000Z',
		created_by: 'Admin',
		lines: [line(3, 8, 250_000, 0, 8)],
		expenses: []
	},
	{
		id: 5,
		number: 'RIN.SO261003001',
		date: '2026-10-03',
		top_days: 0,
		customer_id: 5,
		sales_id: 2,
		department_id: 9,
		pkp_active: false,
		description: 'Pesanan yayasan',
		discount_type: 'nominal',
		discount_value: 0,
		approval_status: 'rejected',
		rejection_reason: 'SO ditolak, silakan periksa kembali detailnya.',
		approved_by: null,
		approved_at: null,
		created_by: 'Admin',
		lines: [line(1, 1, 4_200_000, 500_000)],
		expenses: []
	},
	{
		id: 6,
		number: 'RIN.SO261020001',
		date: '2026-10-20',
		top_days: 21,
		customer_id: 4,
		sales_id: 1,
		department_id: 9,
		pkp_active: true,
		description: '',
		discount_type: 'nominal',
		discount_value: 100_000,
		approval_status: 'pending',
		rejection_reason: null,
		approved_by: null,
		approved_at: null,
		created_by: 'Admin',
		lines: [line(1, 2, 4_200_000), line(2, 1, 1_250_000)],
		expenses: [{ sales_expense_id: 1, notes: '', amount: 300_000 }]
	}
]
