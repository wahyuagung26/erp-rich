<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconPlus } from '@tabler/icons-vue'
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
import RowActions from '@/components/base/RowActions.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import type { BankAccount, TableRow } from '@/utils/types'

const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<BankAccount>({
	endpoint: '/bank-account',
	scopedToCompany: true
})

const q = ref('')
const runSearch = useDebounce(() => applyFilters({ q: q.value }), 250)

const rows: TableRow[] = [
	{ label: 'Kode Bank', field: 'bank_code', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Nama Bank', field: 'bank_name', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Rekening', field: 'account_number', align: 'left' },
	{ label: 'Atas Nama', field: 'account_holder', align: 'left' },
	{ label: 'Akun Perkiraan', field: 'account_name', align: 'left' },
	{ label: '', field: 'action', align: 'right' }
]

function remove(row: BankAccount) {
	ask({ title: 'Hapus rekening bank', message: `Hapus "${row.bank_code} — ${row.bank_name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/bank-account/${row.id}`)
		toast.success('Rekening bank dihapus')
		fetchList()
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Daftar Rekening Bank" subtitle="Master data rekening bank">
			<template #actions>
				<Button size="sm" @click="router.push('/bank-account/tambah')"> <IconPlus class="h-4 w-4" /> Tambah Rekening Bank </Button>
			</template>
		</PageHeader>

		<Panel>
			<FilterBar class="mb-3" :loading="loading" @refresh="runSearch">
				<Input v-model="q" placeholder="Cari kode / nama bank / rekening…" class="!w-64" @update:model-value="runSearch" />
			</FilterBar>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column }">
					<button v-if="row.field === 'bank_code'" class="text-primary-dark hover:underline" @click="router.push(`/bank-account/${column.id}`)">
						{{ column.bank_code }}
					</button>
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/bank-account"
						@remove="remove(column as unknown as BankAccount)"
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
