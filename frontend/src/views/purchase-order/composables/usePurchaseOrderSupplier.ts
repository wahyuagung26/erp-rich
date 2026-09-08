import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import type { Supplier } from '@/utils/types'
import type { PurchaseOrderDraft } from '../schema'

// Looks up the picked supplier and defaults the draft's PKP status + address.
// pkp_active stays a plain, user-editable field on the draft afterward.
export function usePurchaseOrderSupplier() {
	const toast = useToast()

	async function applySupplierDefaults(draft: PurchaseOrderDraft, supplierId: number | null) {
		draft.supplier_id = supplierId
		draft.pkp_active = false
		if (!supplierId) return
		try {
			const res = await api.get<{ data: Supplier }>(`/supplier/${supplierId}`)
			draft.pkp_active = Boolean(res.data.data.pkp)
			draft.address = res.data.data.address || draft.address
		} catch {
			toast.error('Supplier tidak dapat dimuat')
		}
	}

	return { applySupplierDefaults }
}
