<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconPlus, IconEye, IconPencil, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Button from '@/components/base/Button.vue'
import Table from '@/components/base/Table.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import type { Sales, TableRow } from '@/utils/types'

const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<Sales>({
	endpoint: '/sales',
	scopedToCompany: true
})

const q = ref('')
const runSearch = useDebounce(() => applyFilters({ q: q.value }), 250)

const rows: TableRow[] = [
	{ label: 'Kode', field: 'code', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Nama Sales', field: 'name', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Alamat', field: 'address', align: 'left' },
	{ label: '', field: 'action', align: 'right' }
]

function remove(row: Sales) {
	ask({ title: 'Hapus sales', message: `Hapus "${row.code} — ${row.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/sales/${row.id}`)
		toast.success('Sales dihapus')
		fetchList()
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Sales" subtitle="Master data sales">
			<template #actions>
				<Button size="sm" @click="router.push('/sales/tambah')"> <IconPlus class="h-4 w-4" /> Tambah Sales </Button>
			</template>
		</PageHeader>

		<Panel>
			<FilterBar class="mb-3" :loading="loading" @refresh="runSearch">
				<Input v-model="q" placeholder="Cari kode / nama…" class="!w-64" @update:model-value="runSearch" />
			</FilterBar>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column }">
					<button v-if="row.field === 'code'" class="text-primary-dark hover:underline" @click="router.push(`/sales/${column.id}`)">
						{{ column.code }}
					</button>
					<span v-else-if="row.field === 'address'" class="text-ink-muted">{{ column.address || '-' }}</span>
					<div v-else-if="row.field === 'action'" class="flex justify-end gap-1">
						<button class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill" @click="router.push(`/sales/${column.id}`)">
							<IconEye class="h-4 w-4" />
						</button>
						<button class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill" @click="router.push(`/sales/edit/${column.id}`)">
							<IconPencil class="h-4 w-4" />
						</button>
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
							@click="remove(column as unknown as Sales)"
						>
							<IconTrash class="h-4 w-4" />
						</button>
					</div>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>

			<div class="mt-3">
				<TablePagination :pagination="pagination" @page-to="pageTo" />
			</div>
		</Panel>
	</div>
</template>
