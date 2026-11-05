import { defineStore } from 'pinia'
import api from '@/utils/api'
import type { ApiList } from '@/utils/types'
import { applyBrand } from '@/utils/brand'

// Just what the topbar picker needs — the full Company entity lives in
// views/company. Backed by GET /company.
export interface CompanyOption {
	id: number
	code: string
	short_name: string
	legal_name: string
	brand_color: string
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
		async load(force = false) {
			if (this.loaded && !force) return
			const res = await api.get<ApiList<CompanyOption>>('/company', { params: { per_page: 100 } })
			this.companies = res.data.data
			if (!this.companies.some((c) => c.id === this.activeId)) this.setActive(this.companies[0]?.id ?? null)
			this.loaded = true
			applyBrand(this.active?.brand_color)
		},
		setActive(id: number | null) {
			this.activeId = id
			if (id) localStorage.setItem(STORAGE_KEY, String(id))
			else localStorage.removeItem(STORAGE_KEY)
			applyBrand(this.active?.brand_color)
		}
	}
})
