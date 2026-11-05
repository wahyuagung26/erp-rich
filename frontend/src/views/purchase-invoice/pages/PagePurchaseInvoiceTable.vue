<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { IconPlus } from '@tabler/icons-vue'
import api from '@/utils/api'
import Badge from '@/components/base/Badge.vue'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useFakturPajak } from '@/composables/useFakturPajak'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import DateRangePicker from '@/components/base/DateRangePicker.vue'
import Button from '@/components/base/Button.vue'
import Table from '@/components/base/Table.vue'
import Amount from '@/components/base/Amount.vue'
import RowActions from '@/components/base/RowActions.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import { approvalOptions, approvalStatusLabel, approvalStatusTone } from '@/views/purchase-invoice/schema'
import type { PurchaseInvoice, PurchaseInvoiceApprovalStatus, PurchaseInvoiceTaxInvoice, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<PurchaseInvoice>({
	endpoint: '/purchase-invoice'
})
const { ask } = useConfirm()
const toast = useToast()
const fakturPajak = useFakturPajak()
const q = ref('')
const approvalStatus = ref('')
const dateFrom = ref('')
const dateTo = ref('')

function applyAll() {
	applyFilters({ q: q.value, approval_status: approvalStatus.value, date_from: dateFrom.value, date_to: dateTo.value })
}
const runSearch = useDebounce(applyAll, 250)
// Opens the shared faktur pajak modal for one row; the list refetches after a save.
function openTaxInvoice(row: PurchaseInvoice) {
	fakturPajak.open({ kode: row.number, endpoint: `/purchase-invoice/${row.id}/tax-invoice`, onSaved: fetchList })
}
function canWrite(row: PurchaseInvoice) {
	return row.approval_status === 'pending'
}
function remove(row: PurchaseInvoice) {
	ask({ title: 'Hapus invoice pembelian', message: `Hapus invoice pembelian “${row.number}”?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/purchase-invoice/${row.id}`)
			toast.success('Invoice pembelian dihapus')
			fetchList()
		} catch (error) {
			if (axios.isAxiosError(error)) toast.error(error.response?.data?.message ?? 'Invoice pembelian tidak dapat dihapus')
			else toast.error('Invoice pembelian tidak dapat dihapus')
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
		<PageHeader title="Invoice Pembelian" subtitle="Pembelian"
			><template #actions
				><Button size="sm" @click="router.push('/purchase-invoice/tambah')"><IconPlus class="h-4 w-4" /> Tambah</Button></template
			></PageHeader
		>
		<Panel>
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / supplier / invoice…" class="!w-64" @update:model-value="runSearch" />
				<Select v-model="approvalStatus" :options="approvalOptions" class="!w-52" @update:model-value="applyAll" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
			</FilterBar>
			<Table
				@row-dblclick="(r) => router.push(`/purchase-invoice/${r.id}`)"
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'date'" class="tnum whitespace-nowrap text-ink-muted">{{ date(column.date as string) }}</span>
					<div v-else-if="row.field === 'number'" class="leading-snug">
						<button class="whitespace-nowrap text-left text-primary-dark hover:underline" @click="router.push(`/purchase-invoice/${column.id}`)">
							{{ column.number }}
						</button>
						<p class="whitespace-nowrap text-s text-ink-muted">Invoice supplier {{ column.supplier_invoice_number }}</p>
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
							v-if="column.tax_invoice"
							class="text-left leading-snug"
							title="Lihat faktur pajak"
							@click="openTaxInvoice(column as unknown as PurchaseInvoice)"
						>
							<span class="block whitespace-nowrap text-primary-dark hover:underline">{{
								(column.tax_invoice as PurchaseInvoiceTaxInvoice).number
							}}</span>
							<span class="block whitespace-nowrap text-s text-ink-muted">{{ date((column.tax_invoice as PurchaseInvoiceTaxInvoice).date) }}</span>
						</button>
						<Button v-else-if="column.pkp_active" size="sm" variant="outline" @click="openTaxInvoice(column as unknown as PurchaseInvoice)">
							<IconPlus class="h-4 w-4" /> Tambah
						</Button>
						<span v-else class="text-ink-subtle" title="Invoice non-PKP tidak memiliki faktur pajak">–</span>
					</div>
					<Badge
						v-else-if="row.field === 'approval_status'"
						class="whitespace-nowrap"
						:tone="approvalStatusTone[column.approval_status as PurchaseInvoiceApprovalStatus]"
						>{{ approvalStatusLabel[column.approval_status as PurchaseInvoiceApprovalStatus] }}</Badge
					>
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/purchase-invoice"
						:can-modify="canWrite(column as unknown as PurchaseInvoice)"
						@remove="remove(column as unknown as PurchaseInvoice)"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
