<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { IconPlus, IconHistory, IconCircleX, IconClockHour4, IconPackage, IconTruckDelivery } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useHistory } from '@/composables/useHistory'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import DateRangePicker from '@/components/base/DateRangePicker.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import ApprovalBadge from '@/components/common/ApprovalBadge.vue'
import Table from '@/components/base/Table.vue'
import KpiFilter from '@/components/base/KpiFilter.vue'
import { useKpiTiles } from '@/composables/useKpiTiles'
import RowActions from '@/components/base/RowActions.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import { approvalOptions, deliveryOptions, deliveryStatusLabel, deliveryStatusTone } from '@/views/purchase-order/schema'
import type { PurchaseOrder, PurchaseOrderApprovalStatus, PurchaseOrderDeliveryStatus, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<PurchaseOrder>({
	endpoint: '/purchase-order'
})
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const q = ref('')
const approvalStatus = ref('')
const deliveryStatus = ref('')
const dateFrom = ref('')
const dateTo = ref('')

function applyAll() {
	applyFilters({
		q: q.value,
		approval_status: approvalStatus.value,
		delivery_status: deliveryStatus.value,
		date_from: dateFrom.value,
		date_to: dateTo.value
	})
}
const runSearch = useDebounce(applyAll, 250)

// KPI tiles = presets of the status dropdowns, so tiles and dropdowns always agree (docs/purchase-order/list-purchase-order.md).
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
			key: 'awaiting_receipt',
			label: 'Belum Diterima',
			filters: { approval_status: 'approved', delivery_status: 'not_received' },
			icon: IconTruckDelivery,
			tone: 'info',
			attention: true,
			emptyText: 'Semua sudah diterima'
		},
		{
			key: 'partial',
			label: 'Diterima Sebagian',
			filters: { approval_status: 'approved', delivery_status: 'partial' },
			icon: IconPackage,
			tone: 'warning',
			attention: true,
			emptyText: 'Tidak ada penerimaan sebagian'
		},
		{
			key: 'rejected',
			label: 'Ditolak',
			filters: { approval_status: 'rejected' },
			icon: IconCircleX,
			tone: 'danger',
			attention: true,
			emptyText: 'Tidak ada yang ditolak'
		}
	],
	{ approval_status: approvalStatus, delivery_status: deliveryStatus },
	computed(() => pagination.value?.summary),
	applyAll
)
// Opens the shared record-history modal for one row.
function openHistory(row: PurchaseOrder) {
	history.open({ kode: row.number, endpoint: `/purchase-order/${row.id}/history` })
}
function canWrite(row: PurchaseOrder) {
	return row.approval_status !== 'approved' && row.delivery_status === 'not_received'
}
function remove(row: PurchaseOrder) {
	ask({ title: 'Hapus order pembelian', message: `Hapus order pembelian “${row.number}”?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/purchase-order/${row.id}`)
			toast.success('Order pembelian dihapus')
			fetchList()
		} catch (error) {
			if (axios.isAxiosError(error)) toast.error(error.response?.data?.message ?? 'Order pembelian tidak dapat dihapus')
			else toast.error('Order pembelian tidak dapat dihapus')
		}
	})
}

const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'date', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number' },
	{ label: 'Departemen', field: 'department_name' },
	{ label: 'Supplier', field: 'supplier_name' },
	{ label: 'Keterangan', field: 'description' },
	{ label: 'Total', field: 'total', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: 'Status', field: 'approval_status' },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Order Pembelian" subtitle="Pembelian"
			><template #actions
				><Button size="sm" @click="router.push('/purchase-order/tambah')"><IconPlus class="h-4 w-4" /> Tambah</Button></template
			></PageHeader
		>
		<Panel>
			<KpiFilter class="mb-3" :items="kpi.items.value" :active="kpi.active.value" @select="kpi.select" />
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / supplier / keterangan…" class="!w-64" @update:model-value="runSearch" />
				<Select v-model="approvalStatus" :options="approvalOptions" class="!w-52" @update:model-value="applyAll" />
				<Select v-model="deliveryStatus" :options="deliveryOptions" class="!w-48" @update:model-value="applyAll" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
			</FilterBar>
			<Table
				@row-dblclick="(r) => router.push(`/purchase-order/${r.id}`)"
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<button
						v-if="row.field === 'number'"
						class="whitespace-nowrap text-left text-primary-dark hover:underline"
						@click="router.push(`/purchase-order/${column.id}`)"
					>
						{{ column.number }}
					</button>
					<span v-else-if="row.field === 'date'" class="tnum whitespace-nowrap text-ink-muted">{{ date(column.date as string) }}</span>
					<div v-else-if="row.field === 'department_name'" class="leading-snug">
						<p class="text-ink">{{ column.department_name }}</p>
						<p class="text-s text-ink-muted">{{ column.department_code }}</p>
					</div>
					<div
						v-else-if="row.field === 'supplier_name'"
						class="min-w-[150px] max-w-[200px] leading-snug"
						:title="`${column.supplier_code} — ${column.supplier_name}`"
					>
						<p class="line-clamp-2 text-ink">{{ column.supplier_name }}</p>
						<p class="text-s text-ink-muted">{{ column.supplier_code }}</p>
					</div>
					<p
						v-else-if="row.field === 'description'"
						class="line-clamp-2 min-w-[130px] max-w-[200px] text-ink-muted"
						:title="column.description as string"
					>
						{{ column.description || '–' }}
					</p>
					<Amount v-else-if="row.field === 'total'" :value="column.total as number" />
					<div v-else-if="row.field === 'approval_status'" class="flex flex-col items-start gap-1">
						<ApprovalBadge :status="column.approval_status as PurchaseOrderApprovalStatus" />
						<Badge class="whitespace-nowrap" :tone="deliveryStatusTone[column.delivery_status as PurchaseOrderDeliveryStatus]">{{
							deliveryStatusLabel[column.delivery_status as PurchaseOrderDeliveryStatus]
						}}</Badge>
					</div>
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/purchase-order"
						:actions="[{ label: 'Riwayat', icon: IconHistory, onClick: () => openHistory(column as unknown as PurchaseOrder) }]"
						:can-modify="canWrite(column as unknown as PurchaseOrder)"
						@remove="remove(column as unknown as PurchaseOrder)"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
