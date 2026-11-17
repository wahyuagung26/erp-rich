<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IconLock, IconPencil } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Tabs from '@/components/base/Tabs.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Button from '@/components/base/Button.vue'
import Table from '@/components/base/Table.vue'
import RowActions from '@/components/base/RowActions.vue'
import CreatedCell from '@/components/common/CreatedCell.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Badge from '@/components/base/Badge.vue'
import Amount from '@/components/base/Amount.vue'
import { date } from '@/utils/format'
import type { TableRow } from '@/utils/types'
import { monthNames, statusTone, type BudgetDocument, type RevisionPeriod } from '../types'

const router = useRouter()
const company = useCompanyStore()
const tab = ref('available')
const period = ref<RevisionPeriod | null>(null)
const today = new Date().toLocaleDateString('sv-SE')
const thisYear = new Date().getFullYear()
async function loadPeriod() {
	try {
		period.value = (await api.get<{ data: RevisionPeriod }>('/budgeting/period')).data.data
	} catch {
		period.value = null
	}
}
// Months before this one are locked to the original budget (same rule as the revision form).
const firstMonth = computed(() =>
	period.value ? Math.max(period.value.revision_month_start, period.value.year === thisYear ? new Date().getMonth() + 1 : 1) : 1
)
const upcoming = computed(() => !!period.value?.is_active && !!period.value.start_date && today < period.value.start_date)

// Tab 1: approved budgets that do not have a revision yet.
const avail = useTableList<BudgetDocument>({ endpoint: '/budgeting/budgets', scopedToCompany: true, immediate: false })
const availQ = ref('')
const availYear = ref('')
const availDept = ref<number | string | null>(null)
const runAvail = useDebounce(() =>
	avail.applyFilters({ status: 'Disetujui', revision: 'none', q: availQ.value, year: availYear.value, department_id: availDept.value })
)
// Tab 2: submitted revision documents.
const done = useTableList<BudgetDocument>({ endpoint: '/budgeting/revisions', scopedToCompany: true })
const doneQ = ref('')
const doneYear = ref('')
const doneStatus = ref('')
const doneDept = ref<number | string | null>(null)
const runDone = useDebounce(() =>
	done.applyFilters({ q: doneQ.value, year: doneYear.value, status: doneStatus.value, department_id: doneDept.value })
)
watch(
	() => company.activeId,
	() => {
		availDept.value = null
		doneDept.value = null
		loadPeriod()
	}
)
const statuses = [
	{ label: 'Semua status', value: '' },
	...['Draft', 'Diajukan', 'Disetujui', 'Ditolak', 'Dibatalkan'].map((value) => ({ label: value, value }))
]
const deptLabel = (row: Record<string, unknown>) => `${row.code} — ${row.name}`
const tabs = computed(() => [
	{ label: `Belum Ada Revisi (${avail.pagination.value?.total ?? 0})`, value: 'available' },
	{ label: `Pengajuan Revisi (${done.pagination.value?.total ?? 0})`, value: 'revisions' }
])
const availRows: TableRow[] = [
	{ label: 'Dibuat', field: 'created_at', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number', isSort: { activeSort: 'asc' } },
	{ label: 'Departemen', field: 'department_name' },
	{ label: 'Tahun', field: 'year' },
	{ label: 'Laba Rugi Setelah Belanja Modal (Awal)', field: 'total', align: 'right' },
	{ label: '', field: 'action', align: 'right' }
]
const doneRows: TableRow[] = [
	{ label: 'Dibuat', field: 'created_at', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number', isSort: { activeSort: 'asc' } },
	{ label: 'Budget Awal', field: 'budget_number' },
	{ label: 'Departemen', field: 'department_name' },
	{ label: 'Tahun', field: 'year' },
	{ label: 'Status', field: 'status' },
	{ label: 'Laba Rugi (Awal)', field: 'initial_total', align: 'right' },
	{ label: 'Laba Rugi (Hasil Revisi)', field: 'total', align: 'right' },
	{ label: '', field: 'action', align: 'right' }
]
const canRevise = (row: Record<string, unknown>) => !!period.value?.is_open && row.year === period.value.year
onMounted(() => {
	loadPeriod()
	runAvail()
})
</script>
<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Revisi Budget" subtitle="Ajukan dan pantau perubahan anggaran yang sudah disetujui" />
		<Panel class="space-y-4">
			<div v-if="period?.is_open" class="rounded-md bg-success-soft p-3 text-success">
				<p class="font-semibold">Periode Pembukaan Revisi Budget Tahun {{ period.year }} · Aktif</p>
				<p>
					{{ date(period.start_date) }} s/d {{ date(period.end_date) }} · Bulan yang dapat direvisi: {{ monthNames[firstMonth - 1] }} – Desember.
					Bulan 1 s/d {{ firstMonth - 1 }} terkunci sebagai Budget Awal.
				</p>
			</div>
			<div v-else-if="period" class="rounded-md bg-fill p-3 text-ink-muted">
				<p class="font-semibold text-ink">Periode Pembukaan Revisi Budget · Ditutup</p>
				<p v-if="upcoming">
					Periode pengisian revisi sedang ditutup. Jadwal berikutnya: {{ date(period.start_date) }} s/d {{ date(period.end_date) }} (Tahun Anggaran
					{{ period.year }}).
				</p>
				<p v-else>
					Belum ada periode revisi yang dibuka. Atur melalui menu
					<button type="button" class="text-primary-dark hover:underline" @click="router.push('/budgeting/period')">Periode Revisi</button> bila ingin
					membukanya.
				</p>
			</div>
			<Tabs v-model="tab" :tabs="tabs" />
			<template v-if="tab === 'available'">
				<FilterBar :loading="avail.loading.value" @refresh="runAvail">
					<Input v-model="availQ" placeholder="Cari nomor, departemen, deskripsi…" class="!w-64" @update:model-value="runAvail" />
					<Input v-model="availYear" type="number" placeholder="Tahun" class="!w-28" @update:model-value="runAvail" />
					<div class="w-48">
						<AsyncSelect
							v-model="availDept"
							endpoint="/department"
							:option-label="deptLabel"
							placeholder="Semua departemen"
							@update:model-value="runAvail"
						/>
					</div>
				</FilterBar>
				<Table
					:rows="availRows"
					:columns="avail.columns.value as unknown as Record<string, unknown>[]"
					:loading="avail.loading.value"
					empty-text="Tidak ada Master Budget yang cocok"
					empty-description="Semua budget yang disetujui sudah punya dokumen revisi."
					@handle-sort="avail.handleSort"
				>
					<template #table-content="{ row, column }">
						<CreatedCell v-if="row.field === 'created_at'" :by="column.created_by as string" :at="column.created_at as string" />
						<div v-else-if="row.field === 'number'" class="leading-snug">
							<button class="whitespace-nowrap text-primary-dark hover:underline" @click="router.push(`/budgeting/budgets/${column.id}`)">
								{{ column.number }}
							</button>
							<p class="text-s text-ink-muted">{{ column.description }}</p>
						</div>
						<div v-else-if="row.field === 'department_name'" class="leading-snug">
							<p>{{ column.department_name }}</p>
							<p class="text-s text-ink-muted">{{ column.department_code }}</p>
						</div>
						<Amount v-else-if="row.field === 'total'" :value="column.total as number" />
						<template v-else-if="row.field === 'action'">
							<Button v-if="canRevise(column)" size="sm" @click="router.push(`/budgeting/revisions/tambah?budget_id=${column.id}`)"
								><IconPencil class="h-4 w-4" /> Revisi Budget</Button
							>
							<span v-else class="inline-flex items-center gap-1 whitespace-nowrap text-s text-ink-muted"
								><IconLock class="h-4 w-4" /> Periode Ditutup</span
							>
						</template>
						<span v-else>{{ column[row.field] }}</span>
					</template>
				</Table>
				<TablePagination :pagination="avail.pagination.value" @page-to="avail.pageTo" />
			</template>
			<template v-else>
				<FilterBar :loading="done.loading.value" @refresh="runDone">
					<Input v-model="doneQ" placeholder="Cari nomor, departemen, deskripsi…" class="!w-64" @update:model-value="runDone" />
					<Input v-model="doneYear" type="number" placeholder="Tahun" class="!w-28" @update:model-value="runDone" />
					<div class="w-40"><Select v-model="doneStatus" :options="statuses" @update:model-value="runDone" /></div>
					<div class="w-48">
						<AsyncSelect
							v-model="doneDept"
							endpoint="/department"
							:option-label="deptLabel"
							placeholder="Semua departemen"
							@update:model-value="runDone"
						/>
					</div>
				</FilterBar>
				<Table
					:rows="doneRows"
					:columns="done.columns.value as unknown as Record<string, unknown>[]"
					:loading="done.loading.value"
					empty-text="Tidak ada dokumen revisi yang cocok"
					empty-description="Buka tab Belum Ada Revisi, pilih Master Budget, lalu klik Revisi Budget."
					@handle-sort="done.handleSort"
					@row-dblclick="(r) => router.push(`/budgeting/revisions/${r.id}`)"
				>
					<template #table-content="{ row, column }">
						<CreatedCell v-if="row.field === 'created_at'" :by="column.created_by as string" :at="column.created_at as string" />
						<div v-else-if="row.field === 'number'" class="leading-snug">
							<button class="whitespace-nowrap text-primary-dark hover:underline" @click="router.push(`/budgeting/revisions/${column.id}`)">
								{{ column.number }}
							</button>
							<p class="text-s text-ink-muted">{{ column.description }}</p>
						</div>
						<button
							v-else-if="row.field === 'budget_number'"
							class="whitespace-nowrap text-primary-dark hover:underline"
							@click="router.push(`/budgeting/budgets/${column.budget_id}`)"
						>
							{{ column.budget_number }}
						</button>
						<div v-else-if="row.field === 'department_name'" class="leading-snug">
							<p>{{ column.department_name }}</p>
							<p class="text-s text-ink-muted">{{ column.department_code }}</p>
						</div>
						<Badge v-else-if="row.field === 'status'" :tone="statusTone(column.status as BudgetDocument['status'])">{{ column.status }}</Badge>
						<Amount v-else-if="row.field === 'initial_total' || row.field === 'total'" :value="column[row.field] as number" />
						<RowActions v-else-if="row.field === 'action'" base="/budgeting/revisions" :id="column.id as number" :can-modify="false" />
						<span v-else>{{ column[row.field] }}</span>
					</template>
				</Table>
				<TablePagination :pagination="done.pagination.value" @page-to="done.pageTo" />
			</template>
		</Panel>
	</div>
</template>
