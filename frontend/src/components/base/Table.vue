<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import { IconArrowNarrowUp, IconArrowNarrowDown } from '@tabler/icons-vue'
import Spinner from './Spinner.vue'
import EmptyState from './EmptyState.vue'
import type { TableRow, Density } from '@/utils/types'

// API-compatible with the RICH Table (architecture.md §4): `rows` = column
// definitions, `columns` = row data. Flat/borderless styling.
const props = withDefaults(
	defineProps<{
		rows: TableRow[]
		columns: Record<string, unknown>[]
		loading?: boolean
		density?: Density
		emptyText?: string
	}>(),
	{ density: 'comfortable', emptyText: 'Tidak ada data' }
)

const emit = defineEmits<{ handleSort: [TableRow]; rowDblclick: [Record<string, unknown>] }>()

// Legacy ERP behaviour: double-click a row to open it. Clicks on buttons/links/inputs inside the row keep their own meaning.
const clickable = !!getCurrentInstance()?.vnode.props?.onRowDblclick
function onRowDblclick(e: MouseEvent, column: Record<string, unknown>) {
	if ((e.target as HTMLElement).closest('button, a, input, label, select, textarea')) return
	emit('rowDblclick', column)
}

const pad = computed(() => (props.density === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2.5'))
const alignClass = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left')
</script>

<template>
	<div class="overflow-x-auto rounded-md bg-panel">
		<!-- phone: columns keep a readable width and the table scrolls sideways instead of wrapping text -->
		<table class="w-full border-collapse text-m max-sm:min-w-[var(--table-min)]" :style="{ '--table-min': rows.length * 110 + 'px' }">
			<thead class="sticky top-0 z-[1]">
				<!-- grey header band, rounded at both ends — same look as the line-item tables -->
				<tr class="bg-fill [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
					<th v-for="(row, i) in rows" :key="row.field" :class="['font-semibold text-ink-muted', pad, alignClass(row.align)]">
						<slot name="table-header" :row="row" :index="i">
							<button
								v-if="row.isSort"
								class="inline-flex items-center gap-1 hover:text-ink"
								:class="{ 'ml-auto flex-row-reverse': row.align === 'right' }"
								@click="$emit('handleSort', row)"
							>
								<span>{{ row.label }}</span>
								<IconArrowNarrowUp v-if="row.isSort.activeSort === 'asc'" class="h-3.5 w-3.5" />
								<IconArrowNarrowDown v-else class="h-3.5 w-3.5" />
							</button>
							<span v-else>{{ row.label }}</span>
						</slot>
					</th>
				</tr>
			</thead>

			<tbody class="divide-y divide-hairline">
				<tr v-if="loading">
					<td :colspan="rows.length" class="py-10 text-center">
						<Spinner class="mx-auto" />
					</td>
				</tr>
				<tr v-else-if="!columns.length">
					<td :colspan="rows.length" class="py-10">
						<EmptyState :title="emptyText" />
					</td>
				</tr>
				<tr
					v-for="(column, rowIndex) in columns"
					v-else
					:key="rowIndex"
					class="transition-colors hover:bg-fill"
					:class="{ 'cursor-pointer': clickable }"
					@dblclick="onRowDblclick($event, column)"
				>
					<td v-for="row in rows" :key="row.field" :class="[pad, alignClass(row.align)]">
						<slot name="table-content" :row="row" :column="column" :index="rowIndex" :row-index="rowIndex">
							<span :class="{ tnum: row.align === 'right' }">{{ column[row.field] ?? '-' }}</span>
						</slot>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
