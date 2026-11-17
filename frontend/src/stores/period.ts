import { defineStore } from 'pinia'
import api from '@/utils/api'
import type { ApiItem, ClosingStatus } from '@/utils/types'

// Active financial period = first period not yet closed (`next_period`). Shared by the topbar and the Closing tab,
// so closing or re-opening a period updates the topbar without a reload.
export const usePeriodStore = defineStore('period', {
	state: () => ({ status: null as ClosingStatus | null }),
	actions: {
		async load() {
			const res = await api.get<ApiItem<ClosingStatus>>('/posting/closing')
			this.status = res.data.data
		}
	}
})
