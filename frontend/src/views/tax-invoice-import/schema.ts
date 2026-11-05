import type { TaxInvoiceImportRowStatus, TaxInvoiceImportSource } from '@/utils/types'

// Where "Buka Laporan Pajak" points (legacy opened the report in a new tab).
export const reportUrl = (tab: string) => `/laporan-pajak?tab=${tab}`

export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const FILE_EXTENSIONS = ['xlsx', 'xls', 'csv']

// Tabs = the two sources; `report` names the Laporan Pajak the user exports first (docs/tax-invoice-import/index.md).
// `reportTab` is the Laporan Pajak tab to open. The Laporan Pajak page does NOT exist in v2 yet, so the link is intentionally broken.
export const IMPORT_SOURCES: { value: TaxInvoiceImportSource; label: string; report: string; reportTab: string; target: string; route: string }[] = [
	{
		value: 'purchase_invoice',
		label: 'Pajak Masukan',
		report: 'Pajak Masukan',
		reportTab: 'pajak-masukan',
		target: 'Invoice Pembelian',
		route: '/purchase-invoice'
	},
	{
		value: 'purchase_return',
		label: 'Retur Pajak Keluaran',
		report: 'Retur Pajak Keluaran',
		reportTab: 'retur-pajak-keluaran',
		target: 'Retur Pembelian',
		route: '/purchase-return'
	}
]

export const rowStatusLabel: Record<TaxInvoiceImportRowStatus, string> = {
	matched: 'Siap Diimpor',
	to_be_replaced: 'Akan Diganti',
	unmatched: 'Tidak Ditemukan',
	skipped: 'Dilewati',
	error: 'Error'
}
export const rowStatusTone: Record<TaxInvoiceImportRowStatus, 'success' | 'info' | 'warning' | 'neutral' | 'danger'> = {
	matched: 'success',
	to_be_replaced: 'info',
	unmatched: 'warning',
	skipped: 'neutral',
	error: 'danger'
}

// Client-side file check (UX only — the backend re-validates). Returns a message or null.
export function validateImportFile(file: File | undefined): string | null {
	if (!file) return 'File wajib dipilih'
	if (!FILE_EXTENSIONS.includes(file.name.split('.').at(-1)?.toLowerCase() ?? '')) return 'File harus berformat XLSX, XLS, atau CSV'
	if (file.size > MAX_FILE_SIZE) return 'Ukuran file maksimal 10 MB'
	return null
}
