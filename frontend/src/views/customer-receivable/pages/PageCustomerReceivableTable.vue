<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconCash, IconCircleCheck, IconClockHour4, IconAlertTriangle, IconFileInvoice } from '@tabler/icons-vue'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useKpiTiles } from '@/composables/useKpiTiles'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import DateRangePicker from '@/components/base/DateRangePicker.vue'
import Badge from '@/components/base/Badge.vue'
import Table from '@/components/base/Table.vue'
import KpiFilter from '@/components/base/KpiFilter.vue'
import Amount from '@/components/base/Amount.vue'
import RowActions from '@/components/base/RowActions.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import { dateFieldOptions, dueOptions, receivableStatusLabel, receivableTone, statusOptions } from '@/views/customer-receivable/schema'
import type { CustomerReceivable, SalesInvoicePaymentStatus, TableRow } from '@/utils/types'

const router = useRouter()
// Opens on "Belum Lunas" (what a collector needs first), so the first fetch waits for applyAll() below.
const { columns, pagination, loading, handleSort, pageTo, applyFilters } = useTableList<CustomerReceivable>({
	endpoint: '/customer-receivable',
	immediate: false
})
const q = ref('')
const customerId = ref<number | null>(null)
const status = ref('open')
const due = ref('')
const dateField = ref('date')
const dateFrom = ref('')
const dateTo = ref('')

function applyAll() {
	applyFilters({
		q: q.value,
		customer_id: customerId.value ?? '',
		status: status.value,
		due: due.value,
		date_field: dateField.value,
		date_from: dateFrom.value,
		date_to: dateTo.value
	})
}
const runSearch = useDebounce(applyAll, 250)
onMounted(applyAll)

// KPI tiles = presets of the status + jatuh tempo dropdowns (docs/customer-receivable/list-customer-receivable.md).
const kpi = useKpiTiles(
	[
		{
			key: 'open',
			label: 'Total Piutang',
			filters: { status: 'open' },
			icon: IconClockHour4,
			tone: 'warning',
			attention: true,
			emptyText: 'Semua piutang sudah lunas'
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

// AsyncSelect isn't generic — type the picker's row here.
const customerLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`

const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'date', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number' },
	{ label: 'Customer', field: 'customer_name' },
	{ label: 'Jatuh Tempo', field: 'due_date', isSort: { activeSort: 'asc' } },
	{ label: 'Total', field: 'total', align: 'right' },
	{ label: 'Bayar', field: 'paid_total', align: 'right' },
	{ label: 'Sisa', field: 'outstanding', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: 'Status', field: 'status' },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Piutang Customer" subtitle="Penjualan · terbentuk otomatis saat invoice penjualan disetujui" />
		<Panel>
			<KpiFilter class="mb-3" :items="kpi.items.value" :active="kpi.active.value" @select="kpi.select" />
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / customer…" class="!w-52" @update:model-value="runSearch" />
				<AsyncSelect
					v-model="customerId"
					endpoint="/customer"
					:option-label="customerLabel"
					placeholder="Semua customer"
					class="!w-52"
					@update:model-value="applyAll"
				/>
				<Select v-model="status" :options="statusOptions" class="!w-40" @update:model-value="applyAll" />
				<Select v-model="due" :options="dueOptions" class="!w-48" @update:model-value="applyAll" />
				<Select v-model="dateField" :options="dateFieldOptions" class="!w-40" @update:model-value="dateFrom || dateTo ? applyAll() : undefined" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
			</FilterBar>
			<Table
				@row-dblclick="(r) => router.push(`/customer-receivable/${r.id}`)"
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'date'" class="tnum whitespace-nowrap text-ink-muted">{{ date(column.date as string) }}</span>
					<button
						v-else-if="row.field === 'number'"
						class="whitespace-nowrap text-left text-primary-dark hover:underline"
						@click="router.push(`/customer-receivable/${column.id}`)"
					>
						{{ column.number }}
					</button>
					<div
						v-else-if="row.field === 'customer_name'"
						class="min-w-[150px] max-w-[200px] leading-snug"
						:title="`${column.customer_code} — ${column.customer_name}`"
					>
						<p class="line-clamp-2 text-ink">{{ column.customer_name }}</p>
						<p class="text-s text-ink-muted">{{ column.customer_code }} · {{ column.department_code }}</p>
					</div>
					<div v-else-if="row.field === 'due_date'" class="leading-snug">
						<p class="tnum whitespace-nowrap" :class="column.overdue ? 'text-danger' : 'text-ink-muted'">{{ date(column.due_date as string) }}</p>
						<p class="whitespace-nowrap text-s text-ink-muted">TOP {{ column.top_days }} hari</p>
					</div>
					<Amount v-else-if="row.field === 'total'" :value="column.total as number" />
					<Amount v-else-if="row.field === 'paid_total'" :value="column.paid_total as number" />
					<Amount v-else-if="row.field === 'outstanding'" :value="column.outstanding as number" />
					<Badge v-else-if="row.field === 'status'" class="whitespace-nowrap" :tone="receivableTone[column.status as SalesInvoicePaymentStatus]">{{
						receivableStatusLabel[column.status as SalesInvoicePaymentStatus]
					}}</Badge>
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/customer-receivable"
						:can-modify="false"
						:hide-detail="column.status !== 'paid'"
						:actions="[
							{
								label: 'Bayar',
								icon: IconCash,
								onClick: () => router.push(`/customer-receivable/${column.id}?tab=pembayaran`),
								hidden: column.status === 'paid'
							},
							{ label: 'Lihat Invoice', icon: IconFileInvoice, onClick: () => router.push(`/sales-invoice/${column.id}`) }
						]"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
