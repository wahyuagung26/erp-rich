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
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import DateRangePicker from '@/components/base/DateRangePicker.vue'
import Button from '@/components/base/Button.vue'
import Table from '@/components/base/Table.vue'
import RowActions from '@/components/base/RowActions.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import { invoiceOptions, invoiceStatusLabel, invoiceStatusTone } from '@/views/purchase-receipt/schema'
import type { PurchaseReceipt, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<PurchaseReceipt>({
	endpoint: '/purchase-receipt',
	defaultLimit: 20
})
const { ask } = useConfirm()
const toast = useToast()
const q = ref('')
const invoiceStatus = ref('')
const dateFrom = ref('')
const dateTo = ref('')

function applyAll() {
	applyFilters({ q: q.value, invoice_status: invoiceStatus.value, date_from: dateFrom.value, date_to: dateTo.value })
}
const runSearch = useDebounce(applyAll, 250)
function canWrite(row: PurchaseReceipt) {
	return row.invoice_status !== 'invoiced'
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
	{ label: 'No', field: 'no' },
	{ label: 'Tanggal', field: 'date', isSort: { activeSort: 'desc' } },
	{ label: 'BM #', field: 'number', isSort: { activeSort: 'asc' } },
	{ label: 'Gudang', field: 'warehouse_label', isSort: { activeSort: 'asc' } },
	{ label: 'SJ Supplier', field: 'delivery_note_number', isSort: { activeSort: 'asc' } },
	{ label: 'Supplier', field: 'supplier_name', isSort: { activeSort: 'asc' } },
	{ label: 'Status Invoice', field: 'invoice_status' },
	{ label: 'Keterangan', field: 'description' },
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
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / gudang / supplier / SJ…" class="!w-64" @update:model-value="runSearch" />
				<Select v-model="invoiceStatus" :options="invoiceOptions" class="!w-52" @update:model-value="applyAll" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
			</FilterBar>
			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column, rowIndex }">
					<span v-if="row.field === 'no'" class="tnum text-ink-muted">{{
						((pagination?.page ?? 1) - 1) * (pagination?.per_page ?? 20) + rowIndex + 1
					}}</span>
					<span v-else-if="row.field === 'date'" class="tnum text-ink-muted">{{ date(column.date as string) }}</span>
					<button v-else-if="row.field === 'number'" class="text-primary-dark hover:underline" @click="router.push(`/purchase-receipt/${column.id}`)">
						{{ column.number }}
					</button>
					<span v-else-if="row.field === 'warehouse_label'">{{ column.warehouse_label || '–' }}</span>
					<span v-else-if="row.field === 'supplier_name'">{{ column.supplier_code }} — {{ column.supplier_name }}</span>
					<Badge v-else-if="row.field === 'invoice_status'" :tone="invoiceStatusTone[column.invoice_status as keyof typeof invoiceStatusTone]">
						{{ invoiceStatusLabel[column.invoice_status as keyof typeof invoiceStatusLabel] ?? column.invoice_status }}
					</Badge>
					<span v-else-if="row.field === 'description'" class="text-ink-muted">{{ column.description || '–' }}</span>
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/purchase-receipt"
						:can-modify="canWrite(column as unknown as PurchaseReceipt)"
						@remove="remove(column as unknown as PurchaseReceipt)"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" :show-limit="false" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
