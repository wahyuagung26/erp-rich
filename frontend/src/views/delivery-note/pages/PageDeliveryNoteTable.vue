<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconPlus, IconHistory } from '@tabler/icons-vue'
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
import DateRangePicker from '@/components/base/DateRangePicker.vue'
import Button from '@/components/base/Button.vue'
import Table from '@/components/base/Table.vue'
import RowActions from '@/components/base/RowActions.vue'
import CreatedCell from '@/components/common/CreatedCell.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import type { DeliveryNote, TableRow } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<DeliveryNote>({
	endpoint: '/delivery-note',
	immediate: false
})
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const q = ref('')
const dateFrom = ref('')
const dateTo = ref('')
// `?sales_invoice_id=` (link from an invoice) narrows the list to that invoice's surat jalan.
const invoiceId = String(route.query.sales_invoice_id ?? '')

function applyAll() {
	applyFilters({ q: q.value, sales_invoice_id: invoiceId, date_from: dateFrom.value, date_to: dateTo.value })
}
const runSearch = useDebounce(applyAll)
onMounted(applyAll)

function openHistory(row: DeliveryNote) {
	history.open({ kode: row.number, endpoint: `/delivery-note/${row.id}/history` })
}
function remove(row: DeliveryNote) {
	ask(
		{
			title: 'Hapus surat jalan',
			message: `Hapus surat jalan “${row.number}”? Invoice ${row.sales_invoice_number} dapat dibuatkan surat jalan baru.`,
			type: 'danger',
			confirmText: 'Hapus'
		},
		async () => {
			await api.delete(`/delivery-note/${row.id}`)
			toast.success('Surat jalan dihapus')
			fetchList()
		}
	)
}

const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'date', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number', isSort: { activeSort: 'asc' } },
	{ label: 'Customer', field: 'customer_name' },
	{ label: 'Penerima', field: 'recipient' },
	{ label: 'Driver', field: 'driver' },
	{ label: 'Qty Dikirim', field: 'total_quantity', align: 'right' },
	{ label: 'Dibuat', field: 'created_at', align: 'left' },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Surat Jalan" subtitle="Penjualan"
			><template #actions
				><Button size="sm" @click="router.push('/delivery-note/tambah')"><IconPlus class="h-4 w-4" /> Tambah</Button></template
			></PageHeader
		>
		<Panel>
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / invoice / customer / driver…" class="!w-72" @update:model-value="runSearch" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
			</FilterBar>
			<Table
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@row-dblclick="(r) => router.push(`/delivery-note/${r.id}`)"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'date'" class="tnum whitespace-nowrap text-ink-muted">{{ date(column.date as string) }}</span>
					<div v-else-if="row.field === 'number'" class="leading-snug">
						<button class="whitespace-nowrap text-left text-primary-dark hover:underline" @click="router.push(`/delivery-note/${column.id}`)">
							{{ column.number }}
						</button>
						<p class="whitespace-nowrap text-s text-ink-muted">Invoice {{ column.sales_invoice_number }}</p>
					</div>
					<div v-else-if="row.field === 'customer_name'" class="min-w-[150px] max-w-[220px] leading-snug" :title="column.delivery_address as string">
						<p class="line-clamp-2 text-ink">{{ column.customer_name }}</p>
						<p class="text-s text-ink-muted">{{ column.customer_code }}</p>
					</div>
					<span v-else-if="row.field === 'recipient'" class="text-ink">{{ column.recipient || '–' }}</span>
					<div v-else-if="row.field === 'driver'" class="leading-snug">
						<p class="text-ink">{{ column.driver || '–' }}</p>
						<p v-if="column.vehicle" class="whitespace-nowrap text-s text-ink-muted">{{ column.vehicle }}</p>
					</div>
					<span v-else-if="row.field === 'total_quantity'" class="tnum text-ink">{{ column.total_quantity }}</span>
					<CreatedCell v-else-if="row.field === 'created_at'" :by="column.created_by as string" :at="column.created_at as string" />
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/delivery-note"
						:actions="[{ label: 'Riwayat', icon: IconHistory, onClick: () => openHistory(column as unknown as DeliveryNote) }]"
						@remove="remove(column as unknown as DeliveryNote)"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
