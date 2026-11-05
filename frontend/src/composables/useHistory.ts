import { useHistoryStore } from '@/stores/history'

// useHistory().open({ kode: 'PO-…', endpoint: `/purchase-order/${id}/history` })
export function useHistory() {
	const store = useHistoryStore()
	return { open: store.show }
}
