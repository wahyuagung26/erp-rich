<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { IconPlus, IconHistory, IconCircleCheck, IconFileInvoice } from '@tabler/icons-vue'
import api from '@/utils/api'
import Badge from '@/components/base/Badge.vue'
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
import Table from '@/components/base/Table.vue'
import KpiFilter from '@/components/base/KpiFilter.vue'
import { useKpiTiles } from '@/composables/useKpiTiles'
import RowActions from '@/components/base/RowActions.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import { invoiceOptions, invoiceStatusLabel, invoiceStatusTone } from '@/views/purchase-receipt/schema'
import type { PurchaseReceipt, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<PurchaseReceipt>({
	endpoint: '/purchase-receipt'
})
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const q = ref('')
const invoiceStatus = ref('')
const dateFrom = ref('')
const dateTo = ref('')

function applyAll() {
	applyFilters({ q: q.value, invoice_status: invoiceStatus.value, date_from: dateFrom.value, date_to: dateTo.value })
}
const runSearch = useDebounce(applyAll, 250)

// KPI tiles = presets of the invoice-status dropdown (docs/purchase-receipt/list-purchase-receipt.md).
const kpi = useKpiTiles(
	[
		{
			key: 'not_invoiced',
			label: 'Belum Dibuat Invoice',
			filters: { invoice_status: 'not_invoiced' },
			icon: IconFileInvoice,
			tone: 'warning',
			attention: true,
			emptyText: 'Semua sudah dibuat invoice'
		},
		{
			key: 'invoiced',
			label: 'Sudah Dibuat Invoice',
			filters: { invoice_status: 'invoiced' },
			icon: IconCircleCheck,
			tone: 'success',
			emptyText: 'Belum ada'
		}
	],
	{ invoice_status: invoiceStatus },
	computed(() => pagination.value?.summary),
	applyAll
)
// Opens the shared record-history modal for one row.
function openHistory(row: PurchaseReceipt) {
	history.open({ kode: row.number, endpoint: `/purchase-receipt/${row.id}/history` })
}
function canWrite(row: PurchaseReceipt) {
	return row.invoice_status !== 'invoiced' && !row.locked
}
function remove(row: PurchaseReceipt) {
	ask(
		{ title: 'Hapus penerimaan pembelian', message: `Hapus penerimaan pembelian “${row.number}”?`, type: 'danger', confirmText: 'Hapus' },
		async () => {
			try {
				await api.delete(`/purchase-receipt/${row.id}`)
				toast.success('Penerimaan pembelian dihapus')
				fetchList()
			} catch (error) {
				if (axios.isAxiosError(error)) toast.error(error.response?.data?.message ?? 'Penerimaan pembelian tidak dapat dihapus')
				else toast.error('Penerimaan pembelian tidak dapat dihapus')
			}
		}
	)
}

const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'date', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number', isSort: { activeSort: 'asc' } },
	{ label: 'Departemen', field: 'department_name' },
	{ label: 'Supplier', field: 'supplier_name' },
	{ label: 'Gudang', field: 'warehouse_label' },
	{ label: 'Keterangan', field: 'description' },
	{ label: 'Status', field: 'invoice_status' },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Penerimaan Pembelian" subtitle="Pembelian"
			><template #actions
				><Button size="sm" @click="router.push('/purchase-receipt/tambah')"><IconPlus class="h-4 w-4" /> Tambah</Button></template
			></PageHeader
		>
		<Panel>
			<KpiFilter class="mb-3" :items="kpi.items.value" :active="kpi.active.value" @select="kpi.select" />
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / supplier / SJ…" class="!w-64" @update:model-value="runSearch" />
				<Select v-model="invoiceStatus" :options="invoiceOptions" class="!w-52" @update:model-value="applyAll" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
			</FilterBar>
			<Table
				@row-dblclick="(r) => router.push(`/purchase-receipt/${r.id}`)"
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'date'" class="tnum whitespace-nowrap text-ink-muted">{{ date(column.date as string) }}</span>
					<div v-else-if="row.field === 'number'" class="leading-snug">
						<button class="whitespace-nowrap text-left text-primary-dark hover:underline" @click="router.push(`/purchase-receipt/${column.id}`)">
							{{ column.number }}
						</button>
						<p v-if="column.delivery_note_number" class="whitespace-nowrap text-s text-ink-muted">Surat jalan {{ column.delivery_note_number }}</p>
					</div>
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
					<span v-else-if="row.field === 'warehouse_label'" class="text-ink">{{ column.warehouse_label || '–' }}</span>
					<p
						v-else-if="row.field === 'description'"
						class="line-clamp-2 min-w-[130px] max-w-[200px] text-ink-muted"
						:title="column.description as string"
					>
						{{ column.description || '–' }}
					</p>
					<Badge
						v-else-if="row.field === 'invoice_status'"
						class="whitespace-nowrap"
						:tone="invoiceStatusTone[column.invoice_status as keyof typeof invoiceStatusTone]"
					>
						{{ invoiceStatusLabel[column.invoice_status as keyof typeof invoiceStatusLabel] ?? column.invoice_status }}
					</Badge>
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/purchase-receipt"
						:actions="[{ label: 'Riwayat', icon: IconHistory, onClick: () => openHistory(column as unknown as PurchaseReceipt) }]"
						:can-modify="canWrite(column as unknown as PurchaseReceipt)"
						@remove="remove(column as unknown as PurchaseReceipt)"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
