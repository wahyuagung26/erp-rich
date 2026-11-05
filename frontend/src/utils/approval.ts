// The one place that names and colours approval statuses. Journals / cash advance use `submitted`, Pembelian uses
// `pending` (an API naming difference we keep) — both read "Menunggu Persetujuan". Render with <ApprovalBadge>.
export type ApprovalStatus = 'pending' | 'submitted' | 'approved' | 'rejected'
export type ApprovalTone = 'warning' | 'success' | 'danger'

export const approvalLabel: Record<ApprovalStatus, string> = {
	pending: 'Menunggu Persetujuan',
	submitted: 'Menunggu Persetujuan',
	approved: 'Disetujui',
	rejected: 'Ditolak'
}

export const approvalTone: Record<ApprovalStatus, ApprovalTone> = {
	pending: 'warning',
	submitted: 'warning',
	approved: 'success',
	rejected: 'danger'
}

// Label/tone maps for a module that only has some of the statuses, in the given order (used for filter dropdowns).
export function approvalSubset<S extends ApprovalStatus>(statuses: S[]) {
	return {
		label: Object.fromEntries(statuses.map((status) => [status, approvalLabel[status]])) as Record<S, string>,
		tone: Object.fromEntries(statuses.map((status) => [status, approvalTone[status]])) as Record<S, ApprovalTone>
	}
}
