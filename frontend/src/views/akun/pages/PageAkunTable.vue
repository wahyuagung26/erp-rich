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
import { AKUN_TYPES } from '@/views/akun/schema'
import type { Akun, TableRow } from '@/utils/types'

const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const { columns, pagination, loading, limit, fetchList, handleSort, pageTo, applyFilters } = useTableList<Akun>({ endpoint: '/akun' })

const q = ref('')
const type = ref('')
const runSearch = useDebounce(() => applyFilters({ q: q.value, type: type.value }), 250)

const rows: TableRow[] = [
	{ label: 'Kode', field: 'code', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Nama Akun', field: 'name', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Tipe', field: 'type', align: 'left' },
	{ label: 'Saldo Normal', field: 'normal_balance', align: 'left' },
	{ label: 'Status', field: 'active', align: 'center' },
	{ label: '', field: 'action', align: 'right' }
]

const typeLabel = (v: string) => AKUN_TYPES.find((t) => t.value === v)?.label ?? v

function remove(row: Akun) {
	ask({ title: 'Hapus akun', message: `Hapus "${row.code} — ${row.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/akun/${row.id}`)
		toast.success('Akun dihapus')
		fetchList()
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Bagan Akun" subtitle="Chart of accounts">
			<template #actions>
				<Button size="sm" @click="router.push('/akun/tambah')"> <IconPlus class="h-4 w-4" /> Tambah Akun </Button>
			</template>
		</PageHeader>

		<Panel>
			<FilterBar class="mb-3">
				<Input v-model="q" placeholder="Cari kode / nama…" class="!w-56" @update:model-value="runSearch" />
				<Select v-model="type" class="!w-40" placeholder="Semua tipe" :options="[...AKUN_TYPES]" @update:model-value="runSearch" />
				<TableLimitor class="ml-auto" :default-limit="limit" @page-to="pageTo" />
			</FilterBar>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'code'" class="text-ink">{{ column.code }}</span>
					<span v-else-if="row.field === 'type'">{{ typeLabel(column.type as string) }}</span>
					<span v-else-if="row.field === 'normal_balance'" class="text-ink-muted">{{ column.normal_balance === 'debit' ? 'Debit' : 'Kredit' }}</span>
					<Badge v-else-if="row.field === 'active'" :tone="column.active ? 'success' : 'neutral'">
						{{ column.active ? 'Aktif' : 'Nonaktif' }}
					</Badge>
					<div v-else-if="row.field === 'action'" class="flex justify-end gap-1">
						<button class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill" @click="router.push(`/akun/edit/${column.id}`)">
							<IconPencil class="h-4 w-4" />
						</button>
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
							@click="remove(column as unknown as Akun)"
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
