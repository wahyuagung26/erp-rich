import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import type { ApiList, Pagination, TableRow } from '@/utils/types'

interface Options {
	endpoint: string
	defaultLimit?: number
	immediate?: boolean
}

// Standard list/table data-flow (RICH architecture.md §4): fetch on mount,
// re-fetch on page / limit / sort / filter change. Keeps view files small.
export function useTableList<T>({ endpoint, defaultLimit = 10, immediate = true }: Options) {
	const columns = ref<T[]>([]) as { value: T[] }
	const pagination = ref<Pagination>()
	const loading = ref(false)
	const page = ref(1)
	const limit = ref(defaultLimit)
	const orderBy = ref<TableRow>()
	const filters = ref<Record<string, unknown>>({})

	async function fetchList() {
		loading.value = true
		try {
			const res = await api.get<ApiList<T>>(endpoint, {
				params: {
					page: page.value,
					per_page: limit.value,
					sort_by: orderBy.value?.field,
					sort_order: orderBy.value?.isSort?.activeSort,
					...filters.value
				}
			})
			columns.value = res.data.data ?? []
			pagination.value = res.data.meta
		} finally {
			loading.value = false
		}
	}

	function handleSort(row: TableRow) {
		if (!row.isSort) return
		row.isSort.activeSort = row.isSort.activeSort === 'asc' ? 'desc' : 'asc'
		orderBy.value = row
		fetchList()
	}

	function pageTo(data: { page?: number; limit?: number }) {
		if (data.limit) {
			limit.value = data.limit
			page.value = 1
		} else {
			page.value = data.page ?? 1
		}
		fetchList()
	}

	function applyFilters(next: Record<string, unknown>) {
		filters.value = next
		page.value = 1
		fetchList()
	}

	if (immediate) onMounted(fetchList)

	return { columns, pagination, loading, page, limit, orderBy, filters, fetchList, handleSort, pageTo, applyFilters }
}
