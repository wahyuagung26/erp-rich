import { db } from './db'
import { companyIdOf } from './lib'

// Legacy ERP-FUSIDIGITAL document numbers (company code + yymmdd + 3-digit sequence per day), e.g. `RIN.INV260920/001`.
// Sources: so_model::get_new_soID (invoice), sq_model::get_new_soID (sales order), rj_model::get_new_rjid (retur),
// titipan::create_action (titipan), so_model::get_byr_id (payment), surat_jalan_model (SJ = SJ-<invoice number>).
const ymd = (date: string) => date.slice(2, 4) + date.slice(5, 7) + date.slice(8, 10)
const seq3 = (n: number) => String(n).padStart(3, '0')
const nextSeq = (existing: string[], prefix: string) =>
	existing.filter((number) => number.startsWith(prefix)).reduce((max, number) => Math.max(max, Number(number.slice(-3)) || 0), 0) + 1

export const companyCode = (config: { headers?: Record<string, unknown> }) =>
	db.company.find((item) => item.id === companyIdOf(config))?.code ?? 'RIN'

export function salesOrderNumber(code: string, date: string, existing: string[]) {
	const prefix = `${code}.SO${ymd(date)}`
	return prefix + seq3(nextSeq(existing, prefix))
}

export function salesInvoiceNumber(code: string, date: string, existing: string[]) {
	const prefix = `${code}.INV${ymd(date)}/`
	return prefix + seq3(nextSeq(existing, prefix))
}

export function salesReturnNumber(code: string, date: string, existing: string[]) {
	const prefix = `RET.${code}${ymd(date)}/`
	return prefix + seq3(nextSeq(existing, prefix))
}

export function customerDepositNumber(code: string, date: string, existing: string[]) {
	const prefix = `TSC.${code}/${ymd(date)}/`
	return prefix + seq3(nextSeq(existing, prefix))
}

// One SJ per invoice, so the number is derived from the invoice number (no sequence).
export const deliveryNoteNumber = (invoiceNumber: string) => `SJ-${invoiceNumber}`

// Payment of an invoice, `AR-<invoice number>-BY<nn>`; nn counts every payment row of that invoice.
export const invoicePaymentNumber = (invoiceNumber: string, seq: number) => `AR-${invoiceNumber}-BY${String(seq).padStart(2, '0')}`
