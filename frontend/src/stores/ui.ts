import { defineStore } from 'pinia'
import type { ContentWidth, Feel } from '@/utils/types'

// App-shell chrome state. Persisted to localStorage so a reload keeps layout.
export const useUiStore = defineStore('ui', {
	state: () => ({
		railCollapsed: localStorage.getItem('ui.railCollapsed') === 'true',
		feel: (localStorage.getItem('ui.feel') === 'cold' ? 'cold' : 'warm') as Feel,
		contentWidth: (localStorage.getItem('ui.contentWidth') === 'full' ? 'full' : 'narrow') as ContentWidth,
		mobileNavOpen: false // off-canvas drawer below lg; not persisted
	}),
	actions: {
		toggleRail() {
			this.railCollapsed = !this.railCollapsed
			localStorage.setItem('ui.railCollapsed', String(this.railCollapsed))
		},
		toggleMobileNav(open?: boolean) {
			this.mobileNavOpen = open ?? !this.mobileNavOpen
		},
		// Neutral-surface tint only (tokens.css [data-feel]); brand primary is untouched.
		setFeel(value: Feel) {
			this.feel = value
			localStorage.setItem('ui.feel', value)
			document.documentElement.dataset.feel = value
		},
		setContentWidth(value: ContentWidth) {
			this.contentWidth = value
			localStorage.setItem('ui.contentWidth', value)
		}
	}
})
