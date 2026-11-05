import { useFakturPajakStore } from '@/stores/fakturPajak'

// useFakturPajak().open({ kode: 'BL-…', endpoint: `/purchase-invoice/${id}/tax-invoice`, onSaved: refetch })
export function useFakturPajak() {
	const store = useFakturPajakStore()
	return { open: store.show }
}
