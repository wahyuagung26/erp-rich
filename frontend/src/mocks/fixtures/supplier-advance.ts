import type { SupplierAdvance, SupplierAdvanceUsage } from '@/utils/types'

const sampleAttachment = {
	name: 'bukti-uang-muka-supplier.pdf',
	type: 'application/pdf',
	size: 1024,
	data_url: 'data:application/pdf;base64,JVBERi0xLjQK'
}

// Header refs resolve against the supplier / account / department / cash-flow
// fixtures (company 1): supplier_id 12 = RC00007, cash_account_id 17 = 1001302,
// department_id 10 = Produksi. Labels are re-resolved by the mock on read.
// `used`/`remaining`/`last_payable_number` are NOT stored here — the mock
// recomputes them from supplierAdvanceUsageSeed below (avoid duplicating totals).
export const supplierAdvanceSeed: SupplierAdvance[] = [
	{
		id: 1,
		number: 'UMS-RICH/0001/09/2026',
		date: '2026-09-05',
		department_id: 10,
		supplier_id: 12,
		amount: 250000000,
		used: 0,
		remaining: 250000000,
		last_payable_number: null,
		description: 'DEPOSIT PEMBELIAN E-MONEY RICHSO.XXX.XXXXXXX',
		cash_account_id: 17,
		advance_type: 'TITIPAN-PO',
		cash_flow: 'OPERASI_OUT_STOK',
		attachment: sampleAttachment
	},
	{
		id: 2,
		number: 'UMS-RICH/0002/08/2026',
		date: '2026-08-14',
		department_id: 9,
		supplier_id: 8,
		amount: 60000000,
		used: 0,
		remaining: 60000000,
		last_payable_number: null,
		description: 'UANG MUKA PEMBELIAN ASET — DATA DEMO PROTOTIPE',
		cash_account_id: 16,
		advance_type: 'TITIPAN-PO',
		cash_flow: 'INVESTASI_OUT_ASET',
		attachment: sampleAttachment
	},
	{
		id: 3,
		number: 'UMS-RICH/0003/09/2026',
		date: '2026-09-07',
		department_id: 5,
		supplier_id: 7,
		amount: 10000000,
		used: 0,
		remaining: 10000000,
		last_payable_number: null,
		description: 'UANG MUKA DEMO BELUM TERPAKAI — DATA DEMO PROTOTIPE',
		cash_account_id: 12,
		advance_type: 'TITIPAN-PO',
		cash_flow: 'OPERASI_OUT',
		attachment: sampleAttachment
	}
]

// Usage history — amounts sum to the `used` shown on advances 1 and 2 above.
export const supplierAdvanceUsageSeed: SupplierAdvanceUsage[] = [
	{
		id: 1,
		supplier_advance_id: 1,
		date: '2026-09-05',
		payable_number: 'AP-RICH.CEM/0002/09/2026',
		payment_number: 'AP-RICH.CEM/0002/09/2026-BY01',
		note: 'CICIL',
		amount: 150000000
	},
	{
		id: 2,
		supplier_advance_id: 2,
		date: '2026-08-20',
		payable_number: 'AP-RICH.MDR/0001/08/2026',
		payment_number: 'AP-RICH.MDR/0001/08/2026-BY01',
		note: 'DP 1',
		amount: 20000000
	},
	{
		id: 3,
		supplier_advance_id: 2,
		date: '2026-08-30',
		payable_number: 'AP-RICH.MDR/0001/08/2026',
		payment_number: 'AP-RICH.MDR/0001/08/2026-BY02',
		note: 'PELUNASAN',
		amount: 40000000
	}
]
