<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import Table from '@/components/base/Table.vue'
import TableLimitor from '@/components/base/TableLimitor.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import type { Supplier, TableRow } from '@/utils/types'

const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const { columns, pagination, loading, limit, fetchList, handleSort, pageTo, applyFilters } = useTableList<Supplier>({ endpoint: '/supplier' })

const q = ref('')
const pkp = ref('')
const runSearch = useDebounce(() => applyFilters({ q: q.value, pkp: pkp.value }), 250)

const rows: TableRow[] = [
	{ label: 'Kode', field: 'code', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Nama Supplier', field: 'name', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Kota', field: 'city', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Telepon', field: 'phone', align: 'left' },
	{ label: 'TOP', field: 'top_days', align: 'left' },
	{ label: 'PKP', field: 'pkp', align: 'center' },
	{ label: '', field: 'action', align: 'right' }
]

function remove(row: Supplier) {
	ask({ title: 'Hapus supplier', message: `Hapus "${row.code} — ${row.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/supplier/${row.id}`)
		toast.success('Supplier dihapus')
		fetchList()
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Supplier" subtitle="Master data vendor">
			<template #actions>
				<Button size="sm" @click="router.push('/supplier/tambah')"> <IconPlus class="h-4 w-4" /> Tambah Supplier </Button>
			</template>
		</PageHeader>

		<Panel>
			<FilterBar class="mb-3">
				<Input v-model="q" placeholder="Cari kode / nama / CP…" class="!w-64" @update:model-value="runSearch" />
				<Select
					v-model="pkp"
					class="!w-40"
					placeholder="Semua status"
					:options="[
						{ label: 'PKP', value: 'true' },
						{ label: 'Non-PKP', value: 'false' }
					]"
					@update:model-value="runSearch"
				/>
				<TableLimitor class="ml-auto" :default-limit="limit" @page-to="pageTo" />
			</FilterBar>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'code'" class="text-ink">{{ column.code }}</span>
					<span v-else-if="row.field === 'city'">{{ column.city || '-' }}</span>
					<span v-else-if="row.field === 'phone'" class="text-ink-muted">{{ column.phone || '-' }}</span>
					<span v-else-if="row.field === 'top_days'" class="text-ink-muted">
						{{ column.top_days === 0 ? 'Tunai' : `${column.top_days} hari` }}
					</span>
					<Badge v-else-if="row.field === 'pkp'" :tone="column.pkp ? 'success' : 'neutral'">
						{{ column.pkp ? 'PKP' : 'Non-PKP' }}
					</Badge>
					<div v-else-if="row.field === 'action'" class="flex justify-end gap-1">
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
							@click="router.push(`/supplier/edit/${column.id}`)"
						>
							<IconPencil class="h-4 w-4" />
						</button>
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
							@click="remove(column as unknown as Supplier)"
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
