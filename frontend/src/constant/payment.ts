// Hard-coded payment type "Biaya" (decision 2026-10-14): not a row of the Pembayaran master. Shared by Invoice Penjualan and Piutang Customer.
export const BIAYA_PAYMENT_TYPE = { id: -1, code: 'BIAYA-INV', name: 'Biaya', method: 'expense' as const }
