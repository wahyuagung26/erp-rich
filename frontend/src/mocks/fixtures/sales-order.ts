import type { SalesOrder, SalesOrderExpense, SalesOrderLine } from '@/utils/types'
import { lineTotal, totals } from '@/views/sales-order/schema'
import { customerSeed } from './customer'

// Stored shape: inputs, approval bookkeeping, the customer snapshot and the totals stored at save. Labels are resolved on read (mocks/modules/sales-order.ts).
export type SalesOrderRow = Omit<
	SalesOrder,
	| 'locked'
	| 'due_date'
	| 'customer_code'
	| 'sales_code'
	| 'sales_name'
	| 'department_code'
	| 'department_name'
	| 'invoice_status'
	| 'sales_invoice_id'
	| 'sales_invoice_number'
	| 'lines'
	| 'expenses'
> & {
	lines: Pick<SalesOrderLine, 'variant_id' | 'warehouse_id' | 'quantity' | 'price' | 'discount' | 'notes' | 'total'>[]
	expenses: Pick<SalesOrderExpense, 'sales_expense_id' | 'notes' | 'amount'>[]
}

type SeedRow = Omit<
	SalesOrderRow,
	'customer_name' | 'customer_address' | 'customer_phone' | 'subtotal' | 'discount_global' | 'dpp' | 'ppn' | 'expense_total' | 'total' | 'lines'
> & { lines: Omit<SalesOrderRow['lines'][number], 'total'>[] }

// Line ids are default variant ids (= product ids, see fixtures/product.ts).
const line = (variant_id: number, quantity: number, price: number, discount = 0, notes = '') => ({
	variant_id,
	warehouse_id: 1,
	quantity,
	price,
	discount,
	notes
})

// Stamps what a save stores (customer snapshot + totals), the same way the ETL fills legacy rows.
function stored(row: SeedRow): SalesOrderRow {
	const customer = customerSeed.find((item) => item.id === row.customer_id)
	const { discount, ...sum } = totals(row.lines, row.expenses, {
		pkp: row.pkp_active,
		discount_type: row.discount_type,
		discount_value: row.discount_value
	})
	return {
		...row,
		customer_name: customer?.name ?? '',
		customer_address: customer?.address ?? '',
		customer_phone: customer?.phone ?? '',
		lines: row.lines.map((item) => ({ ...item, total: lineTotal(item) })),
		discount_global: discount,
		...sum
	}
}

const seeds: SeedRow[] = [
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
		approved_by: null,
		approved_at: null,
		created_by: 'Admin',
		created_at: '2026-09-02T08:30:00+07:00',
		lines: [line(1, 2, 4_200_000, 100_000), line(3, 2, 250_000, 0, 'Pasang di lantai 2')],
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
		approved_by: 'Admin',
		approved_at: '2026-09-05T09:30:00.000Z',
		created_by: 'Admin',
		created_at: '2026-09-05T08:30:00+07:00',
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
		approved_by: 'Admin',
		approved_at: '2026-09-10T09:30:00.000Z',
		created_by: 'Admin',
		created_at: '2026-09-10T08:30:00+07:00',
		lines: [line(1, 10, 4_200_000, 200_000), line(3, 5, 250_000, 0, 'Jadwal pemasangan menyusul')],
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
		approved_by: 'Admin',
		approved_at: '2026-09-18T10:00:00.000Z',
		created_by: 'Admin',
		created_at: '2026-09-18T08:30:00+07:00',
		lines: [line(3, 8, 250_000)],
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
		approval_status: 'pending',
		approved_by: null,
		approved_at: null,
		created_by: 'Admin',
		created_at: '2026-10-03T08:30:00+07:00',
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
		approved_by: null,
		approved_at: null,
		created_by: 'Admin',
		created_at: '2026-10-20T08:30:00+07:00',
		lines: [line(1, 2, 4_200_000), line(1001, 12, 65_000), line(1002, 8, 65_000)],
		expenses: [{ sales_expense_id: 1, notes: '', amount: 300_000 }]
	}
]

export const salesOrderSeed: SalesOrderRow[] = seeds.map(stored)
