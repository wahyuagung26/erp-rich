import { money } from '@/utils/format'
import { purchaseOrderSeed } from './purchase-order'
import { purchaseReceiptSeed } from './purchase-receipt'
import { purchaseInvoiceSeed } from './purchase-invoice'
import { supplierAdvanceSeed, supplierAdvanceUsageSeed } from './supplier-advance'
import { journalSeed } from './journal'
import { journalExpenseSeed } from './journal-expense'
import { journalIncomeSeed } from './journal-income'
import { cashAdvanceSeed, cashAdvanceSettlementSeed } from './cash-advance'
import type { HistoryEvent, HistoryKind } from '@/utils/types'

// Baseline timeline for the seeded documents, derived from their own fields so history is never empty on
// first open. New writes append through mocks/history.ts. Keyed `<resource>:<id>`, oldest first.
type Draft = { at: string; actor: string; title: string; kind: HistoryKind; summary?: string | null }

function timeline(drafts: Draft[]): HistoryEvent[] {
	return [...drafts].sort((a, b) => a.at.localeCompare(b.at)).map((draft, index) => ({ id: index + 1, summary: null, changes: [], ...draft }))
}

export const historySeed: Record<string, HistoryEvent[]> = {}

for (const po of purchaseOrderSeed) {
	const drafts: Draft[] = [{ at: `${po.date}T08:00:00.000Z`, actor: po.created_by, title: 'Dibuat', kind: 'created' }]
	if (po.approved_at) drafts.push({ at: po.approved_at, actor: po.approved_by ?? 'FAT', title: 'Disetujui', kind: 'approved' })
	if (po.approval_status === 'rejected')
		drafts.push({ at: `${po.date}T10:00:00.000Z`, actor: 'FAT', title: 'Ditolak', kind: 'rejected', summary: po.rejection_reason })
	historySeed[`purchase-order:${po.id}`] = timeline(drafts)
}

for (const receipt of purchaseReceiptSeed) {
	const drafts: Draft[] = [{ at: `${receipt.date}T09:00:00.000Z`, actor: receipt.created_by, title: 'Dibuat', kind: 'created' }]
	const invoice = purchaseInvoiceSeed.find((item) => item.purchase_receipt_id === receipt.id)
	if (invoice)
		drafts.push({ at: `${invoice.date}T09:00:00.000Z`, actor: invoice.created_by, title: 'Invoice Dibuat', kind: 'info', summary: invoice.number })
	historySeed[`purchase-receipt:${receipt.id}`] = timeline(drafts)
}

for (const invoice of purchaseInvoiceSeed) {
	const drafts: Draft[] = [{ at: `${invoice.date}T09:00:00.000Z`, actor: invoice.created_by, title: 'Dibuat', kind: 'created' }]
	if (invoice.tax_invoice)
		drafts.push({
			at: `${invoice.tax_invoice.date}T07:00:00.000Z`,
			actor: 'FAT',
			title: 'Faktur Pajak Disimpan',
			kind: 'info',
			summary: invoice.tax_invoice.number
		})
	if (invoice.approved_at)
		drafts.push({
			at: invoice.approved_at,
			actor: invoice.approved_by ?? 'FAT',
			title: 'Disetujui',
			kind: 'approved',
			summary: `Kontrabon ${invoice.kontrabon_number}`
		})
	historySeed[`purchase-invoice:${invoice.id}`] = timeline(drafts)
}

for (const advance of supplierAdvanceSeed) {
	const drafts: Draft[] = [{ at: `${advance.date}T08:00:00.000Z`, actor: 'FAT', title: 'Dibuat', kind: 'created' }]
	for (const usage of supplierAdvanceUsageSeed.filter((item) => item.supplier_advance_id === advance.id))
		drafts.push({
			at: `${usage.date}T10:00:00.000Z`,
			actor: 'Sistem',
			title: 'Dipakai di Hutang Supplier',
			kind: 'info',
			summary: `${usage.payable_number} · Rp ${money(usage.amount)}`
		})
	historySeed[`supplier-advance:${advance.id}`] = timeline(drafts)
}

// Journals and cash advances share one approval flow (submitted → approved / rejected), so one derivation covers them.
interface ApprovalDoc {
	id: number
	created_by: string
	created_at: string
	status: string
	approved_by: string | null
	approved_at: string | null
	rejection_reason: string | null
}
function approvalTimeline(doc: ApprovalDoc): HistoryEvent[] {
	const drafts: Draft[] = [{ at: doc.created_at, actor: doc.created_by, title: 'Dibuat', kind: 'created' }]
	if (doc.approved_at) drafts.push({ at: doc.approved_at, actor: doc.approved_by ?? 'FAT', title: 'Disetujui', kind: 'approved' })
	if (doc.status === 'rejected')
		drafts.push({
			at: new Date(Date.parse(doc.created_at) + 3_600_000).toISOString(),
			actor: 'FAT',
			title: 'Ditolak',
			kind: 'rejected',
			summary: doc.rejection_reason
		})
	return timeline(drafts)
}

for (const doc of journalSeed) historySeed[`journal:${doc.id}`] = approvalTimeline(doc)
for (const doc of journalExpenseSeed) historySeed[`journal-expense:${doc.id}`] = approvalTimeline(doc)
for (const doc of journalIncomeSeed) historySeed[`journal-income:${doc.id}`] = approvalTimeline(doc)
for (const advance of cashAdvanceSeed) {
	const events = approvalTimeline(advance)
	const drafts: Draft[] = events.map(({ at, actor, title, kind, summary }) => ({ at, actor, title, kind, summary }))
	for (const settlement of cashAdvanceSettlementSeed.filter((item) => item.cash_advance_id === advance.id))
		drafts.push({
			at: `${settlement.date}T10:00:00.000Z`,
			actor: settlement.created_by,
			title: 'Penyelesaian Ditambahkan',
			kind: 'info',
			summary: `${settlement.number} · Rp ${money(settlement.amount)}`
		})
	historySeed[`cash-advance:${advance.id}`] = timeline(drafts)
}
