<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconPlus, IconHistory, IconCircleCheck, IconCircleX, IconClockHour4, IconCoin } from '@tabler/icons-vue'
import api from '@/utils/api'
import ApprovalBadge from '@/components/common/ApprovalBadge.vue'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useHistory } from '@/composables/useHistory'
import { useFakturPajak } from '@/composables/useFakturPajak'
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
import Table from '@/components/base/Table.vue'
import KpiFilter from '@/components/base/KpiFilter.vue'
import Amount from '@/components/base/Amount.vue'
import RowActions from '@/components/base/RowActions.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import { approvalOptions, settlementOptions, settlementStatusLabel, settlementTone } from '@/views/sales-return/schema'
import type { SalesReturn, SalesReturnApprovalStatus, SalesReturnTaxInvoice, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<SalesReturn>({ endpoint: '/sales-return' })
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const fakturPajak = useFakturPajak()
const q = ref('')
const approvalStatus = ref('')
const settlementStatus = ref('')
const dateFrom = ref('')
const dateTo = ref('')

function applyAll() {
	applyFilters({
		q: q.value,
		approval_status: approvalStatus.value,
		settlement_status: settlementStatus.value,
		date_from: dateFrom.value,
		date_to: dateTo.value
	})
}
const runSearch = useDebounce(applyAll)

// Filters beyond the toolbar's 3 controls live in the Filter Lanjutan drawer; the badge counts the active ones.
const advancedCount = computed(() => (Boolean(settlementStatus.value) ? 1 : 0))
function resetAdvanced() {
	settlementStatus.value = ''
	applyAll()
}

// KPI tiles = presets of the approval + penyelesaian dropdowns (docs/sales-return/list-sales-return.md).
const kpi = useKpiTiles(
	[
		{
			key: 'pending',
			label: 'Menunggu Persetujuan',
			filters: { approval_status: 'pending' },
			icon: IconClockHour4,
			tone: 'warning',
			attention: true,
			emptyText: 'Semua sudah diproses'
		},
		{
			key: 'open',
			label: 'Sisa Retur Belum Selesai',
			filters: { approval_status: 'approved', settlement_status: 'open' },
			icon: IconCoin,
			tone: 'warning',
			attention: true,
			emptyText: 'Semua retur sudah diselesaikan'
		},
		{ key: 'settled', label: 'Selesai', filters: { settlement_status: 'settled' }, icon: IconCircleCheck, tone: 'success', emptyText: 'Belum ada' },
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
	{ approval_status: approvalStatus, settlement_status: settlementStatus },
	computed(() => pagination.value?.summary),
	applyAll
)

function openTaxInvoice(row: SalesReturn) {
	fakturPajak.open({ kode: row.number, endpoint: `/sales-return/${row.id}/tax-invoice`, onSaved: fetchList })
}
function openHistory(row: SalesReturn) {
	history.open({ kode: row.number, endpoint: `/sales-return/${row.id}/history` })
}
const canWrite = (row: SalesReturn) => row.approval_status !== 'approved' && !row.locked
function remove(row: SalesReturn) {
	ask({ title: 'Hapus retur penjualan', message: `Hapus retur penjualan “${row.number}”?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/sales-return/${row.id}`)
		toast.success('Retur penjualan dihapus')
		fetchList()
	})
}

const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'date', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number' },
	{ label: 'Customer', field: 'customer_name' },
	{ label: 'Departemen', field: 'department_name' },
	{ label: 'Total', field: 'total', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: 'Faktur Pajak', field: 'tax_invoice' },
	{ label: 'Status', field: 'approval_status' },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Retur Penjualan" subtitle="Penjualan"
			><template #actions
				><Button size="sm" @click="router.push('/sales-return/tambah')"><IconPlus class="h-4 w-4" /> Tambah</Button></template
			></PageHeader
		>
		<Panel>
			<KpiFilter class="mb-3" :items="kpi.items.value" :active="kpi.active.value" @select="kpi.select" />
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / customer / alasan…" class="!w-64" @update:model-value="runSearch" />
				<Select v-model="approvalStatus" :options="approvalOptions" class="!w-52" @update:model-value="applyAll" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
				<AdvancedFilter :count="advancedCount" @reset="resetAdvanced">
					<FormField label="Penyelesaian">
						<Select v-model="settlementStatus" :options="settlementOptions" @update:model-value="applyAll" />
					</FormField>
				</AdvancedFilter>
			</FilterBar>
			<Table
				@row-dblclick="(r) => router.push(`/sales-return/${r.id}`)"
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'date'" class="tnum whitespace-nowrap text-ink-muted">{{ date(column.date as string) }}</span>
					<div v-else-if="row.field === 'number'" class="leading-snug">
						<button class="whitespace-nowrap text-left text-primary-dark hover:underline" @click="router.push(`/sales-return/${column.id}`)">
							{{ column.number }}
						</button>
						<p class="whitespace-nowrap text-s text-ink-muted">Invoice {{ column.sales_invoice_number }}</p>
					</div>
					<div
						v-else-if="row.field === 'customer_name'"
						class="min-w-[130px] max-w-[190px] leading-snug"
						:title="`${column.customer_code} — ${column.customer_name}`"
					>
						<p class="line-clamp-2 text-ink">{{ column.customer_name }}</p>
						<p class="text-s text-ink-muted">{{ column.customer_code }}</p>
					</div>
					<div v-else-if="row.field === 'department_name'" class="leading-snug">
						<p class="text-ink">{{ column.department_name }}</p>
						<p class="text-s text-ink-muted">{{ column.department_code }}</p>
					</div>
					<div v-else-if="row.field === 'total'" class="leading-snug">
						<Amount :value="column.total as number" />
						<p v-if="column.approval_status === 'approved'" class="whitespace-nowrap text-s text-ink-muted">
							Sisa <Amount muted :value="column.remaining_total as number" />
						</p>
					</div>
					<div v-else-if="row.field === 'tax_invoice'">
						<button
							v-if="column.tax_invoice"
							class="text-left leading-snug"
							title="Lihat faktur pajak"
							@click="openTaxInvoice(column as unknown as SalesReturn)"
						>
							<span class="block whitespace-nowrap text-primary-dark hover:underline">{{
								(column.tax_invoice as SalesReturnTaxInvoice).number
							}}</span>
							<span class="block whitespace-nowrap text-s text-ink-muted">{{ date((column.tax_invoice as SalesReturnTaxInvoice).date) }}</span>
						</button>
						<Button
							v-else-if="column.pkp_active && column.approval_status === 'approved'"
							size="sm"
							variant="outline"
							@click="openTaxInvoice(column as unknown as SalesReturn)"
						>
							<IconPlus class="h-4 w-4" /> Tambah
						</Button>
						<span v-else class="text-ink-subtle" title="Faktur pajak hanya untuk retur PKP yang sudah disetujui">–</span>
					</div>
					<div v-else-if="row.field === 'approval_status'" class="flex flex-col items-start gap-1">
						<ApprovalBadge :status="column.approval_status as SalesReturnApprovalStatus" />
						<Badge
							v-if="column.approval_status === 'approved'"
							class="whitespace-nowrap"
							:tone="settlementTone[column.settlement_status as 'open' | 'settled']"
							>{{ settlementStatusLabel[column.settlement_status as 'open' | 'settled'] }}</Badge
						>
					</div>
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/sales-return"
						:actions="[{ label: 'Riwayat', icon: IconHistory, onClick: () => openHistory(column as unknown as SalesReturn) }]"
						:can-modify="canWrite(column as unknown as SalesReturn)"
						@remove="remove(column as unknown as SalesReturn)"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
