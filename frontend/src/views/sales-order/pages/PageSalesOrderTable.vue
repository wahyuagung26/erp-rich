<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconPlus, IconHistory, IconClockHour4, IconFileInvoice, IconFileDescription } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useHistory } from '@/composables/useHistory'
import { useKpiTiles } from '@/composables/useKpiTiles'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import FormField from '@/components/base/FormField.vue'
import AdvancedFilter from '@/components/common/AdvancedFilter.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import DateRangePicker from '@/components/base/DateRangePicker.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import ApprovalBadge from '@/components/common/ApprovalBadge.vue'
import Table from '@/components/base/Table.vue'
import KpiFilter from '@/components/base/KpiFilter.vue'
import RowActions from '@/components/base/RowActions.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import { approvalOptions, invoiceOptions, invoiceStatusLabel, invoiceStatusTone } from '@/views/sales-order/schema'
import type { SalesOrder, SalesOrderApprovalStatus, SalesOrderInvoiceStatus, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<SalesOrder>({ endpoint: '/sales-order' })
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const q = ref('')
const approvalStatus = ref('')
const invoiceStatus = ref('')
const dateFrom = ref('')
const dateTo = ref('')

function applyAll() {
	applyFilters({
		q: q.value,
		approval_status: approvalStatus.value,
		invoice_status: invoiceStatus.value,
		date_from: dateFrom.value,
		date_to: dateTo.value
	})
}
const runSearch = useDebounce(applyAll)

// Filters beyond the toolbar's 3 controls live in the Filter Lanjutan drawer; the badge counts the active ones.
const advancedCount = computed(() => (Boolean(invoiceStatus.value) ? 1 : 0))
function resetAdvanced() {
	invoiceStatus.value = ''
	applyAll()
}

// KPI tiles = presets of the status dropdowns, so tiles and dropdowns always agree (docs/sales-order/list-sales-order.md).
const kpi = useKpiTiles(
	[
		{
			key: 'pending',
			label: 'Menunggu Persetujuan',
			filters: { approval_status: 'pending' },
			icon: IconClockHour4,
			tone: 'warning',
			attention: true,
			emptyText: 'Tidak ada yang menunggu'
		},
		{
			key: 'awaiting_invoice',
			label: 'Belum Diinvoice',
			filters: { approval_status: 'approved', invoice_status: 'not_invoiced' },
			icon: IconFileDescription,
			tone: 'info',
			attention: true,
			emptyText: 'Semua sudah diinvoice'
		},
		{
			key: 'invoiced',
			label: 'Sudah Diinvoice',
			filters: { invoice_status: 'invoiced' },
			icon: IconFileInvoice,
			tone: 'success',
			emptyText: 'Belum ada yang diinvoice'
		}
	],
	{ approval_status: approvalStatus, invoice_status: invoiceStatus },
	computed(() => pagination.value?.summary),
	applyAll
)

// Opens the shared record-history modal for one row.
function openHistory(row: SalesOrder) {
	history.open({ kode: row.number, endpoint: `/sales-order/${row.id}/history` })
}
const canWrite = (row: SalesOrder) => row.approval_status === 'pending' && !row.locked
function remove(row: SalesOrder) {
	ask({ title: 'Hapus sales order', message: `Hapus sales order “${row.number}”?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/sales-order/${row.id}`)
		toast.success('Sales order dihapus')
		fetchList()
	})
}

const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'date', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number' },
	{ label: 'Customer', field: 'customer_name' },
	{ label: 'Sales', field: 'sales_name' },
	{ label: 'Departemen', field: 'department_name' },
	{ label: 'Total', field: 'total', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: 'Status', field: 'approval_status' },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Sales Order" subtitle="Penjualan"
			><template #actions
				><Button size="sm" @click="router.push('/sales-order/tambah')"><IconPlus class="h-4 w-4" /> Tambah</Button></template
			></PageHeader
		>
		<Panel>
			<KpiFilter class="mb-3" :items="kpi.items.value" :active="kpi.active.value" @select="kpi.select" />
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / customer / sales…" class="!w-64" @update:model-value="runSearch" />
				<Select v-model="approvalStatus" :options="approvalOptions" class="!w-52" @update:model-value="applyAll" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
				<AdvancedFilter :count="advancedCount" @reset="resetAdvanced">
					<FormField label="Status Invoice">
						<Select v-model="invoiceStatus" :options="invoiceOptions" @update:model-value="applyAll" />
					</FormField>
				</AdvancedFilter>
			</FilterBar>
			<Table
				@row-dblclick="(r) => router.push(`/sales-order/${r.id}`)"
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<div v-if="row.field === 'number'" class="leading-snug">
						<button class="whitespace-nowrap text-left text-primary-dark hover:underline" @click="router.push(`/sales-order/${column.id}`)">
							{{ column.number }}
						</button>
						<p v-if="column.description" class="line-clamp-1 max-w-[220px] text-s text-ink-muted" :title="column.description as string">
							{{ column.description }}
						</p>
					</div>
					<span v-else-if="row.field === 'date'" class="tnum whitespace-nowrap text-ink-muted">{{ date(column.date as string) }}</span>
					<div
						v-else-if="row.field === 'customer_name'"
						class="min-w-[150px] max-w-[200px] leading-snug"
						:title="`${column.customer_code} — ${column.customer_name}`"
					>
						<p class="line-clamp-2 text-ink">{{ column.customer_name }}</p>
						<p class="text-s text-ink-muted">{{ column.customer_code }}</p>
					</div>
					<div v-else-if="row.field === 'sales_name'" class="leading-snug">
						<p class="text-ink">{{ column.sales_name }}</p>
						<p class="text-s text-ink-muted">{{ column.sales_code }}</p>
					</div>
					<div v-else-if="row.field === 'department_name'" class="leading-snug">
						<p class="text-ink">{{ column.department_name }}</p>
						<p class="text-s text-ink-muted">{{ column.department_code }}</p>
					</div>
					<Amount v-else-if="row.field === 'total'" :value="column.total as number" />
					<div v-else-if="row.field === 'approval_status'" class="flex flex-col items-start gap-1">
						<ApprovalBadge :status="column.approval_status as SalesOrderApprovalStatus" />
						<Badge class="whitespace-nowrap" :tone="invoiceStatusTone[column.invoice_status as SalesOrderInvoiceStatus]">{{
							invoiceStatusLabel[column.invoice_status as SalesOrderInvoiceStatus]
						}}</Badge>
					</div>
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/sales-order"
						:actions="[{ label: 'Riwayat', icon: IconHistory, onClick: () => openHistory(column as unknown as SalesOrder) }]"
						:can-modify="canWrite(column as unknown as SalesOrder)"
						@remove="remove(column as unknown as SalesOrder)"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
