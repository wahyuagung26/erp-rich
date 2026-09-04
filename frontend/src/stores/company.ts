import { defineStore } from 'pinia'
import api from '@/utils/api'
import type { ApiList } from '@/utils/types'

// Just what the topbar picker needs — the full Perusahaan entity lives in
// views/perusahaan. Backed by GET /perusahaan.
export interface CompanyOption {
	id: number
	code: string
	short_name: string
	legal_name: string
}

const STORAGE_KEY = 'company.activeId'

// Active company for the session — which company's data the app is scoped to.
// Persisted to localStorage so a reload keeps the selection.
export const useCompanyStore = defineStore('company', {
	state: () => ({
		companies: [] as CompanyOption[],
		activeId: Number(localStorage.getItem(STORAGE_KEY)) || null,
		loaded: false
	}),
	getters: {
		active: (s): CompanyOption | null => s.companies.find((c) => c.id === s.activeId) ?? null
	},
	actions: {
		async load() {
			if (this.loaded) return
			const res = await api.get<ApiList<CompanyOption>>('/perusahaan', { params: { per_page: 100 } })
			this.companies = res.data.data
			if (!this.companies.some((c) => c.id === this.activeId)) this.setActive(this.companies[0]?.id ?? null)
			this.loaded = true
		},
		setActive(id: number | null) {
			this.activeId = id
			if (id) localStorage.setItem(STORAGE_KEY, String(id))
			else localStorage.removeItem(STORAGE_KEY)
		}
	}
})
