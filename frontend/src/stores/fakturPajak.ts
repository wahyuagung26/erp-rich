import { defineStore } from 'pinia'

export interface FakturPajakRequest {
	// Label under the title, usually the document number.
	kode: string
	// `<resource>/:id/tax-invoice` — GET reads the current faktur, PUT saves it (docs/purchase-invoice/index.md).
	endpoint: string
	// Called after a successful save, e.g. to refetch the list that opened the modal.
	onSaved?: () => unknown
}

// Drives the one global <FakturPajakModal> mounted in DefaultLayout.
export const useFakturPajakStore = defineStore('fakturPajak', {
	state: () => ({ open: false, request: null as FakturPajakRequest | null }),
	actions: {
		show(request: FakturPajakRequest) {
			this.request = request
			this.open = true
		},
		close() {
			this.open = false
		}
	}
})
