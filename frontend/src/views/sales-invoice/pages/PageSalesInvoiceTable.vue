<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconPlus, IconHistory, IconCircleX, IconClockHour4, IconFileAlert, IconCash } from '@tabler/icons-vue'
import api from '@/utils/api'
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
import ApprovalBadge from '@/components/common/ApprovalBadge.vue'
import Table from '@/components/base/Table.vue'
import KpiFilter from '@/components/base/KpiFilter.vue'
import RowActions from '@/components/base/RowActions.vue'
import CreatedCell from '@/components/common/CreatedCell.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import { approvalOptions, paymentOptions, paymentStatusLabel, paymentStatusTone, taxInvoiceOptions } from '@/views/sales-invoice/schema'
import type { SalesInvoice, SalesInvoiceApprovalStatus, SalesInvoiceTaxInvoice, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<SalesInvoice>({ endpoint: '/sales-invoice' })
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const fakturPajak = useFakturPajak()
const q = ref('')
const approvalStatus = ref('')
const paymentStatus = ref('')
const taxInvoice = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const today = new Date().toISOString().slice(0, 10)

function applyAll() {
	applyFilters({
		q: q.value,
		approval_status: approvalStatus.value,
		payment_status: paymentStatus.value,
		tax_invoice: taxInvoice.value,
		date_from: dateFrom.value,
		date_to: dateTo.value
	})
}
const runSearch = useDebounce(applyAll)

// Filters beyond the toolbar's 3 controls live in the Filter Lanjutan drawer; the badge counts the active ones.
const advancedCount = computed(() => [paymentStatus.value, taxInvoice.value].filter(Boolean).length)
function resetAdvanced() {
	paymentStatus.value = ''
	taxInvoice.value = ''
	applyAll()
}

// KPI tiles = presets of the status dropdowns, so tiles and dropdowns always agree (docs/sales-invoice/list-sales-invoice.md).
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
			key: 'outstanding',
			label: 'Belum Lunas',
			filters: { approval_status: 'approved', payment_status: 'open' },
			icon: IconCash,
			tone: 'info',
			attention: true,
			emptyText: 'Semua sudah lunas'
		},
		{
			key: 'tax_missing',
			label: 'Belum Ada Faktur Pajak',
			filters: { tax_invoice: 'missing' },
			icon: IconFileAlert,
			tone: 'warning',
			attention: true,
			emptyText: 'Semua faktur pajak sudah lengkap'
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
	{ approval_status: approvalStatus, payment_status: paymentStatus, tax_invoice: taxInvoice },
	computed(() => pagination.value?.summary),
	applyAll
)

// Opens the shared faktur pajak modal for one row; the list refetches after a save.
function openTaxInvoice(row: SalesInvoice) {
	fakturPajak.open({ kode: row.number, endpoint: `/sales-invoice/${row.id}/tax-invoice`, onSaved: fetchList })
}
// Opens the shared record-history modal for one row.
function openHistory(row: SalesInvoice) {
	history.open({ kode: row.number, endpoint: `/sales-invoice/${row.id}/history` })
}
const canWrite = (row: SalesInvoice) => row.approval_status !== 'approved' && !row.locked
const isOverdue = (row: SalesInvoice) => row.approval_status === 'approved' && row.outstanding > 0 && row.due_date < today
function remove(row: SalesInvoice) {
	ask({ title: 'Hapus invoice penjualan', message: `Hapus invoice penjualan “${row.number}”?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/sales-invoice/${row.id}`)
		toast.success('Invoice penjualan dihapus')
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
	{ label: 'Dibuat', field: 'created_at', align: 'left' },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Invoice Penjualan" subtitle="Penjualan"
			><template #actions
				><Button size="sm" @click="router.push('/sales-invoice/tambah')"><IconPlus class="h-4 w-4" /> Tambah</Button></template
			></PageHeader
		>
		<Panel>
			<KpiFilter class="mb-3" :items="kpi.items.value" :active="kpi.active.value" @select="kpi.select" />
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / customer / sales order…" class="!w-64" @update:model-value="runSearch" />
				<Select v-model="approvalStatus" :options="approvalOptions" class="!w-52" @update:model-value="applyAll" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
				<AdvancedFilter :count="advancedCount" @reset="resetAdvanced">
					<FormField label="Pembayaran">
						<Select v-model="paymentStatus" :options="paymentOptions" @update:model-value="applyAll" />
					</FormField>
					<FormField label="Faktur Pajak">
						<Select v-model="taxInvoice" :options="taxInvoiceOptions" @update:model-value="applyAll" />
					</FormField>
				</AdvancedFilter>
			</FilterBar>
			<Table
				@row-dblclick="(r) => router.push(`/sales-invoice/${r.id}`)"
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<div v-if="row.field === 'date'" class="whitespace-nowrap leading-snug">
						<p class="tnum text-ink-muted">{{ date(column.date as string) }}</p>
						<p class="text-s" :class="isOverdue(column as unknown as SalesInvoice) ? 'text-danger' : 'text-ink-subtle'" title="Jatuh tempo">
							Tempo {{ date(column.due_date as string) }}
						</p>
					</div>
					<div v-else-if="row.field === 'number'" class="leading-snug">
						<button class="whitespace-nowrap text-left text-primary-dark hover:underline" @click="router.push(`/sales-invoice/${column.id}`)">
							{{ column.number }}
						</button>
						<p v-if="column.sales_order_number" class="whitespace-nowrap text-s text-ink-muted">{{ column.sales_order_number }}</p>
						<p v-else-if="column.description" class="line-clamp-1 max-w-[220px] text-s text-ink-muted" :title="column.description as string">
							{{ column.description }}
						</p>
					</div>
					<div
						v-else-if="row.field === 'customer_name'"
						class="min-w-[130px] max-w-[170px] leading-snug"
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
						<p v-if="column.approval_status !== 'rejected'" class="whitespace-nowrap text-s text-ink-muted">
							Sisa <Amount muted :value="column.outstanding as number" />
						</p>
					</div>
					<div v-else-if="row.field === 'tax_invoice'">
						<button
							v-if="column.tax_invoice"
							class="text-left leading-snug"
							title="Lihat faktur pajak"
							@click="openTaxInvoice(column as unknown as SalesInvoice)"
						>
							<span class="block whitespace-nowrap text-primary-dark hover:underline">{{
								(column.tax_invoice as SalesInvoiceTaxInvoice).number
							}}</span>
							<span class="block whitespace-nowrap text-s text-ink-muted">{{ date((column.tax_invoice as SalesInvoiceTaxInvoice).date) }}</span>
						</button>
						<Button v-else-if="column.pkp_active" size="sm" variant="outline" @click="openTaxInvoice(column as unknown as SalesInvoice)">
							<IconPlus class="h-4 w-4" /> Tambah
						</Button>
						<span v-else class="text-ink-subtle" title="Invoice non-PKP tidak memiliki faktur pajak">–</span>
					</div>
					<div v-else-if="row.field === 'approval_status'" class="flex flex-col items-start gap-1">
						<ApprovalBadge :status="column.approval_status as SalesInvoiceApprovalStatus" />
						<Badge
							v-if="column.approval_status !== 'rejected'"
							class="whitespace-nowrap"
							:tone="paymentStatusTone[column.payment_status as keyof typeof paymentStatusTone]"
							>{{ paymentStatusLabel[column.payment_status as keyof typeof paymentStatusLabel] }}</Badge
						>
					</div>
					<CreatedCell v-else-if="row.field === 'created_at'" :by="column.created_by as string" :at="column.created_at as string" />
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/sales-invoice"
						:actions="[{ label: 'Riwayat', icon: IconHistory, onClick: () => openHistory(column as unknown as SalesInvoice) }]"
						:can-modify="canWrite(column as unknown as SalesInvoice)"
						@remove="remove(column as unknown as SalesInvoice)"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
