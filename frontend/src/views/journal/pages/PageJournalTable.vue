<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconPlus } from '@tabler/icons-vue'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Button from '@/components/base/Button.vue'
import Table from '@/components/base/Table.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import type { Journal, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, handleSort, pageTo, applyFilters } = useTableList<Journal>({ endpoint: '/journal' })

const q = ref('')
const runSearch = useDebounce(() => applyFilters({ q: q.value }), 250)

const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'date', align: 'left', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number', align: 'left' },
	{ label: 'Keterangan', field: 'description', align: 'left' },
	{ label: 'Baris', field: 'lines', align: 'center' },
	{ label: 'Nilai (Rp)', field: 'total', align: 'right', isSort: { activeSort: 'asc' } }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Jurnal Umum" subtitle="Journal entries">
			<template #actions>
				<Button size="sm" @click="router.push('/journal/tambah')"> <IconPlus class="h-4 w-4" /> Buat Jurnal </Button>
			</template>
		</PageHeader>

		<Panel>
			<FilterBar class="mb-3">
				<Input v-model="q" placeholder="Cari nomor / keterangan…" class="!w-64" @update:model-value="runSearch" />
			</FilterBar>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'date'" class="font-mono tnum text-ink-muted">{{ date(column.date as string) }}</span>
					<span v-else-if="row.field === 'number'" class="text-ink">{{ column.number }}</span>
					<span v-else-if="row.field === 'lines'" class="tnum text-ink-muted">{{ (column.lines as unknown[]).length }}</span>
					<Amount v-else-if="row.field === 'total'" :value="column.total as number" />
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>

			<div class="mt-3">
				<TablePagination :pagination="pagination" @page-to="pageTo" />
			</div>
		</Panel>
	</div>
</template>
