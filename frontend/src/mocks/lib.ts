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
