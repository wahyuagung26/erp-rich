import { ref } from 'vue'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import type { Company } from '@/utils/types'

// Full record of the active company (address, NPWP…) for printouts — the store only keeps the picker subset.
export function usePrintCompany() {
	const company = ref<Company>()
	async function load() {
		const store = useCompanyStore()
		await store.load()
		company.value = (await api.get<{ data: Company }>(`/company/${store.activeId}`)).data.data
	}
	return { company, load }
}
