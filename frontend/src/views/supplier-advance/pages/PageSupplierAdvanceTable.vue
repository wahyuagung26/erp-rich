<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconHistory, IconPlus } from '@tabler/icons-vue'
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
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import type { SupplierAdvance, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<SupplierAdvance>({
	endpoint: '/supplier-advance'
})
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()

const q = ref('')
const dateFrom = ref('')
const dateTo = ref('')

function applyAll() {
	applyFilters({ q: q.value, date_from: dateFrom.value, date_to: dateTo.value })
}
const runSearch = useDebounce(applyAll, 250)

// Opens the shared record-history modal for one row.
function openHistory(row: SupplierAdvance) {
	history.open({ kode: row.number, endpoint: `/supplier-advance/${row.id}/history` })
}

function remove(row: SupplierAdvance) {
	ask({ title: 'Hapus uang muka supplier', message: `Hapus uang muka supplier "${row.number}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/supplier-advance/${row.id}`)
			toast.success('Uang muka supplier dihapus')
			fetchList()
		} catch (err) {
			toast.error('Uang muka yang sudah dipakai di Hutang Supplier tidak boleh dihapus')
		}
	})
}

const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'date', align: 'left', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Departemen', field: 'department_name', align: 'left' },
	{ label: 'Supplier', field: 'supplier_name', align: 'left' },
	{ label: 'Nominal', field: 'amount', align: 'right' },
	{ label: 'Terpakai', field: 'used', align: 'right' },
	{ label: 'Sisa', field: 'remaining', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Uang Muka Supplier" subtitle="Pembelian">
			<template #actions>
				<Button size="sm" @click="router.push('/supplier-advance/tambah')"> <IconPlus class="h-4 w-4" /> Tambah </Button>
			</template>
		</PageHeader>

		<Panel>
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / supplier / keterangan…" class="!w-64" @update:model-value="runSearch" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
			</FilterBar>

			<Table
				@row-dblclick="(r) => router.push(`/supplier-advance/${r.id}`)"
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<div v-if="row.field === 'number'" class="leading-snug">
						<button class="whitespace-nowrap text-left text-primary-dark hover:underline" @click="router.push(`/supplier-advance/${column.id}`)">
							{{ column.number }}
						</button>
						<p class="max-w-[180px] truncate text-s text-ink-muted" :title="column.description as string">{{ column.description || '–' }}</p>
					</div>
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
					<Amount v-else-if="row.field === 'amount'" :value="column.amount as number" />
					<div
						v-else-if="row.field === 'used'"
						class="leading-snug"
						:title="column.last_payable_number ? 'Hutang terakhir yang memakai uang muka ini' : ''"
					>
						<Amount :value="column.used as number" />
						<p v-if="column.last_payable_number" class="whitespace-nowrap text-s text-ink-muted">{{ column.last_payable_number }}</p>
					</div>
					<Amount v-else-if="row.field === 'remaining'" :value="column.remaining as number" />
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/supplier-advance"
						:actions="[{ label: 'Riwayat', icon: IconHistory, onClick: () => openHistory(column as unknown as SupplierAdvance) }]"
						:can-modify="(column.used as number) === 0 && !column.locked"
						@remove="remove(column as unknown as SupplierAdvance)"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>

			<div class="mt-3">
				<TablePagination :pagination="pagination" @page-to="pageTo" />
			</div>
		</Panel>
	</div>
</template>
