<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconEye, IconPencil, IconPlus, IconTrash } from '@tabler/icons-vue'
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
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import Table from '@/components/base/Table.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import { limitOptions, searchFieldOptions, sortFieldOptions, sortOrderOptions } from '@/views/supplier-advance/schema'
import type { SupplierAdvance, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, limit, fetchList, pageTo, applyFilters } = useTableList<SupplierAdvance>({
	endpoint: '/supplier-advance',
	defaultLimit: 20
})
const { ask } = useConfirm()
const toast = useToast()

const searchField = ref('')
const q = ref('')
const sortByField = ref('date')
const sortOrder = ref('desc')
const limitSel = ref('20')

function applyAll() {
	applyFilters({ field: searchField.value, q: q.value, sort_by: sortByField.value, sort_order: sortOrder.value })
}
const runSearch = useDebounce(applyAll, 250)

function onLimitChange() {
	const lim = limitSel.value === 'all' ? 9999 : Number(limitSel.value)
	pageTo({ limit: lim })
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
	{ label: 'No', field: 'no', align: 'left' },
	{ label: 'Nomor Transaksi', field: 'number', align: 'left' },
	{ label: 'Tanggal', field: 'date', align: 'left' },
	{ label: 'Departemen', field: 'department_name', align: 'left' },
	{ label: 'Supplier', field: 'supplier_name', align: 'left' },
	{ label: 'Nominal', field: 'amount', align: 'right' },
	{ label: 'Terpakai', field: 'used', align: 'right' },
	{ label: 'Saldo Tersedia', field: 'remaining', align: 'right' },
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
				<Select v-model="searchField" :options="searchFieldOptions" class="!w-44" placeholder="Cari Berdasarkan" @update:model-value="applyAll" />
				<Input v-model="q" placeholder="Pencarian…" class="!w-60" @update:model-value="runSearch" />
				<Select v-model="sortByField" :options="sortFieldOptions" class="!w-44" @update:model-value="applyAll" />
				<Select v-model="sortOrder" :options="sortOrderOptions" class="!w-32" @update:model-value="applyAll" />
				<Select v-model="limitSel" :options="limitOptions" class="!w-36" @update:model-value="onLimitChange" />
			</FilterBar>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading">
				<template #table-content="{ row, column, rowIndex }">
					<span v-if="row.field === 'no'" class="font-mono tnum text-ink-muted">
						{{ ((pagination?.page ?? 1) - 1) * (pagination?.per_page ?? 20) + rowIndex + 1 }}
					</span>
					<a v-else-if="row.field === 'number'" class="text-primary-dark hover:underline" @click="router.push(`/supplier-advance/${column.id}`)">
						{{ column.number }}
					</a>
					<span v-else-if="row.field === 'date'" class="font-mono tnum text-ink-muted">{{ date(column.date as string) }}</span>
					<span v-else-if="row.field === 'department_name'" class="text-ink">{{ column.department_name }}</span>
					<span v-else-if="row.field === 'supplier_name'" class="text-ink">{{ column.supplier_code }} — {{ column.supplier_name }}</span>
					<Amount v-else-if="row.field === 'amount'" :value="column.amount as number" />
					<Amount v-else-if="row.field === 'used'" :value="column.used as number" />
					<Amount v-else-if="row.field === 'remaining'" :value="column.remaining as number" />
					<span v-else-if="row.field === 'last_payable_number'" class="text-ink-muted">{{ column.last_payable_number || '–' }}</span>
					<span v-else-if="row.field === 'description'" class="text-ink-muted">{{ column.description || '–' }}</span>
					<div v-else-if="row.field === 'action'" class="flex justify-end gap-1">
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
							title="Lihat detail"
							@click="router.push(`/supplier-advance/${column.id}`)"
						>
							<IconEye class="h-4 w-4" />
						</button>
						<template v-if="(column.used as number) === 0">
							<button
								class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
								title="Edit uang muka supplier"
								@click="router.push(`/supplier-advance/edit/${column.id}`)"
							>
								<IconPencil class="h-4 w-4" />
							</button>
							<button
								class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
								title="Hapus uang muka supplier"
								@click="remove(column as unknown as SupplierAdvance)"
							>
								<IconTrash class="h-4 w-4" />
							</button>
						</template>
					</div>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>

			<div class="mt-3">
				<TablePagination :pagination="pagination" :limit-options="[limit]" @page-to="pageTo" />
			</div>
		</Panel>
	</div>
</template>
