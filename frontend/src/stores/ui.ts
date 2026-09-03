import { defineStore } from 'pinia'
import type { Density } from '@/utils/types'

// App-shell chrome state. Persisted to localStorage so a reload keeps layout.
export const useUiStore = defineStore('ui', {
	state: () => ({
		railCollapsed: localStorage.getItem('ui.railCollapsed') === 'true',
		density: (localStorage.getItem('ui.density') as Density) || 'comfortable'
	}),
	actions: {
		toggleRail() {
			this.railCollapsed = !this.railCollapsed
			localStorage.setItem('ui.railCollapsed', String(this.railCollapsed))
		},
		setDensity(value: Density) {
			this.density = value
			localStorage.setItem('ui.density', value)
		}
	}
})
