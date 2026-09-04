import type { Pagination } from '@/utils/types'

export interface ListParams {
	page?: number
	per_page?: number
	sort_by?: string
	sort_order?: 'asc' | 'desc'
	[k: string]: unknown
}

export function paginate<T>(items: T[], params: ListParams): { data: T[]; meta: Pagination } {
	const page = Number(params.page) || 1
	const perPage = Number(params.per_page) || 10
	const start = (page - 1) * perPage
	return {
		data: items.slice(start, start + perPage),
		meta: { page, per_page: perPage, total: items.length, last_page: Math.max(1, Math.ceil(items.length / perPage)) }
	}
}

// Next auto-increment id for an in-memory collection.
export function nextId(items: { id: number }[]): number {
	return items.reduce((max, x) => Math.max(max, x.id), 0) + 1
}

export function sortBy<T>(items: T[], field?: string, dir: 'asc' | 'desc' = 'asc'): T[] {
	if (!field) return items
	return [...items].sort((a, b) => {
		const av = (a as Record<string, unknown>)[field]
		const bv = (b as Record<string, unknown>)[field]
		const cmp = `${av}`.localeCompare(`${bv}`, 'id', { numeric: true })
		return dir === 'asc' ? cmp : -cmp
	})
}

// X-Company-Id arrives as a request header on every request once a company is
// active (see utils/api.ts's request interceptor + stores/company.ts).
// Company-scoped mock modules read it the same way across GET/POST/PUT/DELETE.
export function companyIdOf(config: { headers?: Record<string, unknown> }): number | null {
	const n = Number(config.headers?.['X-Company-Id'])
	return Number.isFinite(n) && n > 0 ? n : null
}
