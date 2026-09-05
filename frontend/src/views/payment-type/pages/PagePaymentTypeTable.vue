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
import { TRANSACTION_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/views/payment-type/schema'
import type { PaymentType, TableRow } from '@/utils/types'

const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<PaymentType>({
	endpoint: '/payment-type',
	scopedToCompany: true
})

const q = ref('')
const runSearch = useDebounce(() => applyFilters({ q: q.value }), 250)

const rows: TableRow[] = [
	{ label: 'Kode', field: 'code', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Nama', field: 'name', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Akun Perkiraan', field: 'account_name', align: 'left' },
	{ label: 'Transaksi', field: 'transaction_type', align: 'left' },
	{ label: 'Jenis', field: 'method', align: 'left' },
	{ label: '', field: 'action', align: 'right' }
]

const transactionTypeLabel = (v: string) => TRANSACTION_TYPE_OPTIONS.find((t) => t.value === v)?.label ?? v
const methodLabel = (v: string) => PAYMENT_METHOD_OPTIONS.find((j) => j.value === v)?.label ?? v

function remove(row: PaymentType) {
	ask({ title: 'Hapus tipe pembayaran', message: `Hapus "${row.code} — ${row.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/payment-type/${row.id}`)
		toast.success('Tipe pembayaran dihapus')
		fetchList()
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Tipe Pembayaran" subtitle="Master data tipe pembayaran">
			<template #actions>
				<Button size="sm" @click="router.push('/payment-type/tambah')"> <IconPlus class="h-4 w-4" /> Tambah Tipe Pembayaran </Button>
			</template>
		</PageHeader>

		<Panel>
			<FilterBar class="mb-3">
				<Input v-model="q" placeholder="Cari kode / nama…" class="!w-64" @update:model-value="runSearch" />
			</FilterBar>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column }">
					<button v-if="row.field === 'code'" class="text-primary-dark hover:underline" @click="router.push(`/payment-type/${column.id}`)">
						{{ column.code }}
					</button>
					<span v-else-if="row.field === 'transaction_type'">{{ transactionTypeLabel(column.transaction_type as string) }}</span>
					<span v-else-if="row.field === 'method'">{{ methodLabel(column.method as string) }}</span>
					<div v-else-if="row.field === 'action'" class="flex justify-end gap-1">
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
							@click="router.push(`/payment-type/${column.id}`)"
						>
							<IconEye class="h-4 w-4" />
						</button>
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
							@click="router.push(`/payment-type/edit/${column.id}`)"
						>
							<IconPencil class="h-4 w-4" />
						</button>
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
							@click="remove(column as unknown as PaymentType)"
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
