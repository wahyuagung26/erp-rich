import { defineStore } from 'pinia'

export interface HistoryRequest {
	// Label under the title, usually the document number.
	kode: string
	// `/<resource>/:id/history` — contract in docs/conventions.md (record history).
	endpoint: string
}

// Drives the one global <HistoryModal> mounted in DefaultLayout.
export const useHistoryStore = defineStore('history', {
	state: () => ({ open: false, request: null as HistoryRequest | null }),
	actions: {
		show(request: HistoryRequest) {
			this.request = request
			this.open = true
		},
		close() {
			this.open = false
		}
	}
})
