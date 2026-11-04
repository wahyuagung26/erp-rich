<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconPlus } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
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
	endpoint: '/supplier-advance',
	defaultLimit: 20
})
const { ask } = useConfirm()
const toast = useToast()

const q = ref('')
const dateFrom = ref('')
const dateTo = ref('')

function applyAll() {
	applyFilters({ q: q.value, date_from: dateFrom.value, date_to: dateTo.value })
}
const runSearch = useDebounce(applyAll, 250)

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
	{ label: 'No', field: 'no', align: 'left' },
	{ label: 'Nomor Transaksi', field: 'number', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Tanggal', field: 'date', align: 'left', isSort: { activeSort: 'desc' } },
	{ label: 'Departemen', field: 'department_name', align: 'left' },
	{ label: 'Supplier', field: 'supplier_name', align: 'left' },
	{ label: 'Nominal', field: 'amount', align: 'right' },
	{ label: 'Terpakai', field: 'used', align: 'right' },
	{ label: 'Saldo Tersedia', field: 'remaining', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: 'No Hutang Terakhir', field: 'last_payable_number', align: 'left' },
	{ label: 'Keterangan', field: 'description', align: 'left' },
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

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column, rowIndex }">
					<span v-if="row.field === 'no'" class="tnum text-ink-muted">
						{{ ((pagination?.page ?? 1) - 1) * (pagination?.per_page ?? 20) + rowIndex + 1 }}
					</span>
					<button v-else-if="row.field === 'number'" class="text-primary-dark hover:underline" @click="router.push(`/supplier-advance/${column.id}`)">
						{{ column.number }}
					</button>
					<span v-else-if="row.field === 'date'" class="tnum text-ink-muted">{{ date(column.date as string) }}</span>
					<span v-else-if="row.field === 'department_name'" class="text-ink">{{ column.department_name }}</span>
					<span v-else-if="row.field === 'supplier_name'" class="text-ink">{{ column.supplier_code }} — {{ column.supplier_name }}</span>
					<Amount v-else-if="row.field === 'amount'" :value="column.amount as number" />
					<Amount v-else-if="row.field === 'used'" :value="column.used as number" />
					<Amount v-else-if="row.field === 'remaining'" :value="column.remaining as number" />
					<span v-else-if="row.field === 'last_payable_number'" class="text-ink-muted">{{ column.last_payable_number || '–' }}</span>
					<span v-else-if="row.field === 'description'" class="text-ink-muted">{{ column.description || '–' }}</span>
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/supplier-advance"
						:can-modify="(column.used as number) === 0"
						@remove="remove(column as unknown as SupplierAdvance)"
					/>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>

			<div class="mt-3">
				<TablePagination :pagination="pagination" :show-limit="false" @page-to="pageTo" />
			</div>
		</Panel>
	</div>
</template>
