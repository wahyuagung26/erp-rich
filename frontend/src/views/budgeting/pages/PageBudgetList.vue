<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { useRouter } from 'vue-router'
import { IconPlus, IconUpload } from '@tabler/icons-vue'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Button from '@/components/base/Button.vue'
import Table from '@/components/base/Table.vue'
import RowActions from '@/components/base/RowActions.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Badge from '@/components/base/Badge.vue'
import Amount from '@/components/base/Amount.vue'
import { date } from '@/utils/format'
import type { TableRow } from '@/utils/types'
import { statusTone, type BudgetDocument } from '../types'

const router = useRouter()
const base = '/budgeting/budgets'

const { columns, pagination, loading, handleSort, pageTo, applyFilters } = useTableList<BudgetDocument>({ endpoint: base, scopedToCompany: true })
const q = ref('')
const year = ref('')
const status = ref('')
const departmentId = ref<number | string | null>(null)
watch(
	() => useCompanyStore().activeId,
	() => {
		departmentId.value = null
		runSearch()
	}
)
const departmentLabel = (row: Record<string, unknown>) => `${row.code} — ${row.name}`
const runSearch = useDebounce(() => applyFilters({ q: q.value, year: year.value, status: status.value, department_id: departmentId.value }), 250)
const statuses = [{ label: 'Semua status', value: '' }, ...['Draft', 'Diajukan', 'Disetujui', 'Ditolak'].map((value) => ({ label: value, value }))]
const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'created_at', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number', isSort: { activeSort: 'asc' } },
	{ label: 'Departemen', field: 'department_name' },
	{ label: 'Tahun', field: 'year' },
	{ label: 'Status', field: 'status' },
	{ label: 'Laba Rugi Setelah Belanja Modal', field: 'total', align: 'right' },
	{ label: '', field: 'action', align: 'right' }
]
</script>
<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Budget" subtitle="Rencana anggaran tahunan per departemen">
			<template #actions
				><div class="flex flex-wrap items-center gap-2">
					<Button size="sm" variant="outline" @click="router.push(`${base}/import`)"><IconUpload class="h-4 w-4" /> Import Multi-Departemen</Button
					><Button size="sm" @click="router.push(`${base}/tambah`)"><IconPlus class="h-4 w-4" /> Tambah Budget</Button>
				</div></template
			>
		</PageHeader>
		<Panel>
			<FilterBar class="mb-3" :loading="loading" @refresh="runSearch">
				<Input v-model="q" placeholder="Cari nomor, departemen, deskripsi…" class="!w-64" @update:model-value="runSearch" />
				<Input v-model="year" type="number" placeholder="Tahun" class="!w-28" @update:model-value="runSearch" />
				<div class="w-40"><Select v-model="status" :options="statuses" @update:model-value="runSearch" /></div>
				<div class="w-48">
					<AsyncSelect
						v-model="departmentId"
						endpoint="/department"
						:option-label="departmentLabel"
						placeholder="Semua departemen"
						@update:model-value="runSearch"
					/>
				</div>
			</FilterBar>
			<Table
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
				@row-dblclick="(r) => router.push(`${base}/${r.id}`)"
			>
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'created_at'" class="whitespace-nowrap tnum">{{ date(column.created_at as string) }}</span>
					<div v-else-if="row.field === 'number'" class="leading-snug">
						<button class="whitespace-nowrap text-primary-dark hover:underline" @click="router.push(`${base}/${column.id}`)">
							{{ column.number }}
						</button>
						<p class="text-s text-ink-muted">{{ column.description }}</p>
					</div>
					<div v-else-if="row.field === 'department_name'" class="leading-snug">
						<p>{{ column.department_name }}</p>
						<p class="text-s text-ink-muted">{{ column.department_code }}</p>
					</div>
					<Badge v-else-if="row.field === 'status'" :tone="statusTone(column.status as BudgetDocument['status'])">{{ column.status }}</Badge>
					<Amount v-else-if="row.field === 'total'" :value="column.total as number" />
					<RowActions v-else-if="row.field === 'action'" :base="base" :id="column.id as number" :can-modify="false" />
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
