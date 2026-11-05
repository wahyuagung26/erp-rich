<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { IconPlus, IconHistory, IconCircleCheck, IconClockHour4, IconCoin } from '@tabler/icons-vue'
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
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import DateRangePicker from '@/components/base/DateRangePicker.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import Table from '@/components/base/Table.vue'
import KpiFilter from '@/components/base/KpiFilter.vue'
import Amount from '@/components/base/Amount.vue'
import RowActions from '@/components/base/RowActions.vue'
import ClosingBadge from '@/components/common/ClosingBadge.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import { approvalOptions } from '@/views/purchase-invoice/schema'
import { settlementOptions, settlementStatusLabel, settlementTone } from '@/views/purchase-return/schema'
import type { PurchaseInvoiceApprovalStatus, PurchaseInvoiceTaxInvoice, PurchaseReturn, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<PurchaseReturn>({ endpoint: '/purchase-return' })
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
const runSearch = useDebounce(applyAll, 250)

// KPI tiles = presets of the approval + penyelesaian dropdowns (docs/purchase-return/list-purchase-return.md).
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
		{ key: 'settled', label: 'Selesai', filters: { settlement_status: 'settled' }, icon: IconCircleCheck, tone: 'success', emptyText: 'Belum ada' }
	],
	{ approval_status: approvalStatus, settlement_status: settlementStatus },
	computed(() => pagination.value?.summary),
	applyAll
)

function openTaxInvoice(row: PurchaseReturn) {
	fakturPajak.open({ kode: row.number, endpoint: `/purchase-return/${row.id}/tax-invoice`, onSaved: fetchList })
}
function openHistory(row: PurchaseReturn) {
	history.open({ kode: row.number, endpoint: `/purchase-return/${row.id}/history` })
}
const canWrite = (row: PurchaseReturn) => row.approval_status === 'pending' && !row.locked
function remove(row: PurchaseReturn) {
	ask({ title: 'Hapus retur pembelian', message: `Hapus retur pembelian “${row.number}”?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/purchase-return/${row.id}`)
			toast.success('Retur pembelian dihapus')
			fetchList()
		} catch (error) {
			toast.error(
				axios.isAxiosError(error) ? (error.response?.data?.message ?? 'Retur pembelian tidak dapat dihapus') : 'Retur pembelian tidak dapat dihapus'
			)
		}
	})
}

const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'date', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number' },
	{ label: 'Departemen', field: 'department_name' },
	{ label: 'Supplier', field: 'supplier_name' },
	{ label: 'Total', field: 'total', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: 'Faktur Pajak', field: 'tax_invoice' },
	{ label: 'Status', field: 'approval_status' },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Retur Pembelian" subtitle="Pembelian"
			><template #actions
				><Button size="sm" @click="router.push('/purchase-return/tambah')"><IconPlus class="h-4 w-4" /> Tambah</Button></template
			></PageHeader
		>
		<Panel>
			<KpiFilter class="mb-3" :items="kpi.items.value" :active="kpi.active.value" @select="kpi.select" />
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / supplier / alasan…" class="!w-64" @update:model-value="runSearch" />
				<Select v-model="approvalStatus" :options="approvalOptions" class="!w-52" @update:model-value="applyAll" />
				<Select v-model="settlementStatus" :options="settlementOptions" class="!w-52" @update:model-value="applyAll" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
			</FilterBar>
			<Table
				@row-dblclick="(r) => router.push(`/purchase-return/${r.id}`)"
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'date'" class="tnum whitespace-nowrap text-ink-muted">{{ date(column.date as string) }}</span>
					<div v-else-if="row.field === 'number'" class="leading-snug">
						<button class="whitespace-nowrap text-left text-primary-dark hover:underline" @click="router.push(`/purchase-return/${column.id}`)">
							{{ column.number }}
						</button>
						<p class="whitespace-nowrap text-s text-ink-muted">Invoice {{ column.purchase_invoice_number }}</p>
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
					<Amount v-else-if="row.field === 'total'" :value="column.total as number" />
					<div v-else-if="row.field === 'tax_invoice'">
						<button
							v-if="column.tax_invoice && !column.locked"
							class="text-left leading-snug"
							title="Lihat faktur pajak"
							@click="openTaxInvoice(column as unknown as PurchaseReturn)"
						>
							<span class="block whitespace-nowrap text-primary-dark hover:underline">{{
								(column.tax_invoice as PurchaseInvoiceTaxInvoice).number
							}}</span>
							<span class="block whitespace-nowrap text-s text-ink-muted">{{ date((column.tax_invoice as PurchaseInvoiceTaxInvoice).date) }}</span>
						</button>
						<div v-else-if="column.tax_invoice" class="leading-snug" title="Periode sudah closing, faktur pajak tidak bisa diubah">
							<span class="block whitespace-nowrap text-ink">{{ (column.tax_invoice as PurchaseInvoiceTaxInvoice).number }}</span>
							<span class="block whitespace-nowrap text-s text-ink-muted">{{ date((column.tax_invoice as PurchaseInvoiceTaxInvoice).date) }}</span>
						</div>
						<Button
							v-else-if="column.pkp_active && column.approval_status === 'approved' && !column.locked"
							size="sm"
							variant="outline"
							@click="openTaxInvoice(column as unknown as PurchaseReturn)"
						>
							<IconPlus class="h-4 w-4" /> Tambah
						</Button>
						<ClosingBadge
							v-else-if="column.pkp_active && column.approval_status === 'approved'"
							title="Periode sudah closing, faktur pajak tidak bisa diubah"
						/>
						<span v-else class="text-ink-subtle" title="Faktur pajak hanya untuk retur PKP yang sudah disetujui">–</span>
					</div>
					<div v-else-if="row.field === 'approval_status'" class="flex flex-col items-start gap-1">
						<ApprovalBadge :status="column.approval_status as PurchaseInvoiceApprovalStatus" />
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
						base="/purchase-return"
						:actions="[{ label: 'Riwayat', icon: IconHistory, onClick: () => openHistory(column as unknown as PurchaseReturn) }]"
						:can-modify="canWrite(column as unknown as PurchaseReturn)"
						@remove="remove(column as unknown as PurchaseReturn)"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
