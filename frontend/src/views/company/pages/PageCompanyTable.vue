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
import { companyTypeLabel } from '@/views/company/schema'
import type { Company, TableRow } from '@/utils/types'

const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<Company>({ endpoint: '/company' })

const q = ref('')
const runSearch = useDebounce(() => applyFilters({ q: q.value }), 250)

const rows: TableRow[] = [
	{ label: 'Kode', field: 'code', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Nama Pendek', field: 'short_name', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Nama Legal', field: 'legal_name', align: 'left' },
	{ label: 'Tipe', field: 'company_type', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'NPWP', field: 'npwp', align: 'left' },
	{ label: '', field: 'action', align: 'right' }
]

function remove(row: Company) {
	ask({ title: 'Hapus perusahaan', message: `Hapus "${row.code} — ${row.short_name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/company/${row.id}`)
		toast.success('Perusahaan dihapus')
		fetchList()
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Perusahaan" subtitle="Master data perusahaan / badan usaha">
			<template #actions>
				<Button size="sm" @click="router.push('/company/tambah')"> <IconPlus class="h-4 w-4" /> Tambah Perusahaan </Button>
			</template>
		</PageHeader>

		<Panel>
			<FilterBar class="mb-3">
				<Input v-model="q" placeholder="Cari kode / nama…" class="!w-64" @update:model-value="runSearch" />
			</FilterBar>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column }">
					<button v-if="row.field === 'code'" class="text-primary-dark hover:underline" @click="router.push(`/company/${column.id}`)">
						{{ column.code }}
					</button>
					<span v-else-if="row.field === 'legal_name'">{{ column.legal_name || '-' }}</span>
					<span v-else-if="row.field === 'company_type'" class="text-ink-muted">{{ companyTypeLabel(String(column.company_type)) }}</span>
					<span v-else-if="row.field === 'npwp'">{{ column.npwp || '-' }}</span>
					<div v-else-if="row.field === 'action'" class="flex justify-end gap-1">
						<button class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill" @click="router.push(`/company/${column.id}`)">
							<IconEye class="h-4 w-4" />
						</button>
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
							@click="router.push(`/company/edit/${column.id}`)"
						>
							<IconPencil class="h-4 w-4" />
						</button>
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
							@click="remove(column as unknown as Company)"
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
