import type { CustomerDeposit, CustomerDepositUsage } from '@/utils/types'

const sampleAttachment = {
	name: 'bukti-transfer-customer.pdf',
	type: 'application/pdf',
	size: 1024,
	data_url: 'data:application/pdf;base64,JVBERi0xLjQK'
}

// Refs resolve against the company 1 fixtures: customer_id 1 = CUST-0001, 4 = second company-1 customer,
// department_id 9 = Sales, cash_account_id 16/17 = bank accounts. Labels are re-resolved by the mock on read.
// `used`/`remaining`/`last_invoice_number` are NOT stored here — the mock recomputes them from the usage seed below.
export const customerDepositSeed: CustomerDeposit[] = [
	{
		id: 1,
		number: 'TSC.RIN/260903/001',
		date: '2026-09-03',
		department_id: 9,
		customer_id: 1,
		amount: 50000000,
		used: 0,
		remaining: 50000000,
		last_invoice_number: null,
		description: 'TITIPAN PEMBELIAN PAKET BUKU SEMESTER GANJIL — DATA DEMO PROTOTIPE',
		cash_account_id: 17,
		cash_flow: 'OPERASI_IN',
		attachment: sampleAttachment
	},
	{
		id: 2,
		number: 'TSC.RIN/260818/001',
		date: '2026-08-18',
		department_id: 9,
		customer_id: 4,
		amount: 3000000,
		used: 0,
		remaining: 3000000,
		last_invoice_number: null,
		description: 'TITIPAN DP PESANAN CETAK — DATA DEMO PROTOTIPE',
		cash_account_id: 16,
		cash_flow: 'OPERASI_IN',
		attachment: sampleAttachment
	},
	{
		id: 3,
		number: 'TSC.RIN/260912/001',
		date: '2026-09-12',
		department_id: 9,
		customer_id: 1,
		amount: 10000000,
		used: 0,
		remaining: 10000000,
		last_invoice_number: null,
		description: 'TITIPAN BELUM TERPAKAI — DATA DEMO PROTOTIPE',
		cash_account_id: 17,
		cash_flow: null,
		attachment: sampleAttachment
	},
	// Dated in a closed period (closed_until 2026-07) so the locked state can be seen.
	{
		id: 4,
		number: 'TSC.RIN/260720/001',
		date: '2026-07-20',
		department_id: 9,
		customer_id: 4,
		amount: 25000000,
		used: 0,
		remaining: 25000000,
		last_invoice_number: null,
		description: 'TITIPAN PERIODE JULI (SUDAH CLOSING) — DATA DEMO PROTOTIPE',
		cash_account_id: 17,
		cash_flow: 'OPERASI_IN',
		attachment: sampleAttachment
	}
]

// Usage history — Invoice Penjualan creates these rows when an invoice is paid with a deposit. Each row mirrors a `down_payment`
// payment of the invoice (fixtures/sales-invoice.ts) and points at that invoice by id + number.
export const customerDepositUsageSeed: CustomerDepositUsage[] = [
	{ id: 1, customer_deposit_id: 1, date: '2026-10-12', invoice_id: 3, invoice_number: 'RIN.INV261012/001', note: 'DP INVOICE', amount: 2_500_000 },
	{ id: 2, customer_deposit_id: 2, date: '2026-09-20', invoice_id: 1, invoice_number: 'RIN.INV260920/001', note: 'DP INVOICE', amount: 3_000_000 }
]
