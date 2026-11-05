<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconCash, IconCircleCheck, IconClockHour4, IconAlertTriangle } from '@tabler/icons-vue'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useKpiTiles } from '@/composables/useKpiTiles'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import DateRangePicker from '@/components/base/DateRangePicker.vue'
import Badge from '@/components/base/Badge.vue'
import Table from '@/components/base/Table.vue'
import KpiFilter from '@/components/base/KpiFilter.vue'
import Amount from '@/components/base/Amount.vue'
import RowActions from '@/components/base/RowActions.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import { dateFieldOptions, dueOptions, payableStatusLabel, payableStatusOptions, payableTone } from '@/views/supplier-payable/schema'
import type { SupplierPayable, SupplierPayableStatus, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, handleSort, pageTo, applyFilters } = useTableList<SupplierPayable>({ endpoint: '/supplier-payable' })
const q = ref('')
const status = ref('')
const due = ref('')
const dateField = ref('date')
const dateFrom = ref('')
const dateTo = ref('')

function applyAll() {
	applyFilters({ q: q.value, status: status.value, due: due.value, date_field: dateField.value, date_from: dateFrom.value, date_to: dateTo.value })
}
const runSearch = useDebounce(applyAll, 250)

// KPI tiles = presets of the status + jatuh tempo dropdowns (docs/supplier-payable/list-supplier-payable.md).
const kpi = useKpiTiles(
	[
		{
			key: 'open',
			label: 'Belum Lunas',
			filters: { status: 'open' },
			icon: IconClockHour4,
			tone: 'warning',
			attention: true,
			emptyText: 'Semua hutang sudah lunas'
		},
		{
			key: 'overdue',
			label: 'Lewat Jatuh Tempo',
			filters: { due: 'overdue' },
			icon: IconAlertTriangle,
			tone: 'danger',
			attention: true,
			emptyText: 'Tidak ada yang lewat jatuh tempo'
		},
		{ key: 'paid', label: 'Lunas', filters: { status: 'paid' }, icon: IconCircleCheck, tone: 'success', emptyText: 'Belum ada' }
	],
	{ status, due },
	computed(() => pagination.value?.summary),
	applyAll
)

const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'date', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number' },
	{ label: 'Supplier', field: 'supplier_name' },
	{ label: 'Jatuh Tempo', field: 'due_date', isSort: { activeSort: 'asc' } },
	{ label: 'Total', field: 'total', align: 'right' },
	{ label: 'Bayar', field: 'paid_total', align: 'right' },
	{ label: 'Sisa', field: 'remaining_total', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: 'Status', field: 'status' },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Hutang Supplier" subtitle="Pembelian · terbentuk otomatis saat invoice pembelian disetujui" />
		<Panel>
			<KpiFilter class="mb-3" :items="kpi.items.value" :active="kpi.active.value" @select="kpi.select" />
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / supplier / invoice…" class="!w-56" @update:model-value="runSearch" />
				<Select v-model="status" :options="payableStatusOptions" class="!w-40" @update:model-value="applyAll" />
				<Select v-model="due" :options="dueOptions" class="!w-48" @update:model-value="applyAll" />
				<Select v-model="dateField" :options="dateFieldOptions" class="!w-40" @update:model-value="dateFrom || dateTo ? applyAll() : undefined" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
			</FilterBar>
			<Table
				@row-dblclick="(r) => router.push(`/supplier-payable/${r.id}`)"
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'date'" class="tnum whitespace-nowrap text-ink-muted">{{ date(column.date as string) }}</span>
					<div v-else-if="row.field === 'number'" class="leading-snug">
						<button class="whitespace-nowrap text-left text-primary-dark hover:underline" @click="router.push(`/supplier-payable/${column.id}`)">
							{{ column.number }}
						</button>
						<p class="whitespace-nowrap text-s text-ink-muted">Invoice {{ column.purchase_invoice_number }}</p>
					</div>
					<div
						v-else-if="row.field === 'supplier_name'"
						class="min-w-[150px] max-w-[200px] leading-snug"
						:title="`${column.supplier_code} — ${column.supplier_name}`"
					>
						<p class="line-clamp-2 text-ink">{{ column.supplier_name }}</p>
						<p class="text-s text-ink-muted">{{ column.supplier_code }} · {{ column.department_code }}</p>
					</div>
					<div v-else-if="row.field === 'due_date'" class="leading-snug">
						<p class="tnum whitespace-nowrap" :class="column.overdue ? 'text-danger' : 'text-ink-muted'">{{ date(column.due_date as string) }}</p>
						<p class="whitespace-nowrap text-s text-ink-muted">TOP {{ column.top_days }} hari</p>
					</div>
					<Amount v-else-if="row.field === 'total'" :value="column.total as number" />
					<Amount v-else-if="row.field === 'paid_total'" :value="column.paid_total as number" />
					<Amount v-else-if="row.field === 'remaining_total'" :value="column.remaining_total as number" />
					<Badge v-else-if="row.field === 'status'" class="whitespace-nowrap" :tone="payableTone[column.status as SupplierPayableStatus]">{{
						payableStatusLabel[column.status as SupplierPayableStatus]
					}}</Badge>
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/supplier-payable"
						:can-modify="false"
						:hide-detail="column.status !== 'paid'"
						:actions="[
							{
								label: 'Bayar',
								icon: IconCash,
								onClick: () => router.push(`/supplier-payable/${column.id}?tab=pembayaran`),
								hidden: column.status === 'paid'
							}
						]"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
