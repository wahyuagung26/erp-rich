import type { ClosingHistory, PostingRun, ReopenHistory } from '@/utils/types'

// Per-company posting/closing state. Seeded: Jun & Jul 2026 closed, so Aug is next to close.
export interface PostingState {
	closed_until: string | null
	history: ClosingHistory[]
	reopen_history: ReopenHistory[]
	repost_pending: { period: string; posted: boolean }[]
	runs: PostingRun[]
}

export const postingSeed = (): PostingState => ({
	closed_until: '2026-07',
	history: [
		{
			period: '2026-07',
			closed_by: 'Rina Kusuma',
			closed_at: '2026-08-04T09:12:00+07:00',
			total_debit: 1_842_500_000,
			total_credit: 1_842_500_000,
			profit: 126_400_000
		},
		{
			period: '2026-06',
			closed_by: 'Rina Kusuma',
			closed_at: '2026-07-03T14:40:00+07:00',
			total_debit: 1_615_300_000,
			total_credit: 1_615_300_000,
			profit: 98_750_000
		}
	],
	reopen_history: [],
	repost_pending: [],
	runs: [
		{ period: '2026-07', posted_by: 'Rina Kusuma', posted_at: '2026-08-03T16:05:00+07:00' },
		{ period: '2026-06', posted_by: 'Rina Kusuma', posted_at: '2026-07-02T15:30:00+07:00' }
	]
})
