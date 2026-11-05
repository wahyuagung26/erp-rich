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
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import Table from '@/components/base/Table.vue'
import RowActions from '@/components/base/RowActions.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import { journalStatusLabel } from '@/views/cash-advance/schema'
import type { CashAdvance, JournalStatus, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<CashAdvance>({ endpoint: '/cash-advance' })
const { ask } = useConfirm()
const toast = useToast()

const q = ref('')
const approved = ref('')

const approvalOptions = [
	{ value: 'true', label: 'Sudah Disetujui' },
	{ value: 'false', label: 'Belum Disetujui' }
]

function applyAll() {
	applyFilters({ q: q.value, approved: approved.value })
}
const runSearch = useDebounce(applyAll, 250)

const statusTone: Record<JournalStatus, 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info'> = {
	submitted: 'warning',
	approved: 'success',
	rejected: 'danger'
}

function remove(row: CashAdvance) {
	ask({ title: 'Hapus uang muka', message: `Hapus uang muka "${row.number}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/cash-advance/${row.id}`)
		toast.success('Uang muka operasional dihapus')
		fetchList()
	})
}

const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'date', align: 'left', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Voucher', field: 'voucher', align: 'left' },
	{ label: 'Departemen', field: 'department_name', align: 'left' },
	{ label: 'Penerima', field: 'recipient', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Nominal', field: 'amount', align: 'right' },
	{ label: 'Penyelesaian', field: 'used', align: 'right' },
	{ label: 'Sisa', field: 'remaining', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: 'Status', field: 'status', align: 'left' },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Uang Muka Operasional" subtitle="Akuntansi">
			<template #actions>
				<Button size="sm" @click="router.push('/cash-advance/tambah')"> <IconPlus class="h-4 w-4" /> Tambah </Button>
			</template>
		</PageHeader>

		<Panel>
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / voucher / penerima / keterangan…" class="!w-72" @update:model-value="runSearch" />
				<Select v-model="approved" class="!w-52" placeholder="Semua" :options="approvalOptions" @update:model-value="applyAll" />
			</FilterBar>

			<Table
				@row-dblclick="(r) => router.push(`/cash-advance/${r.id}`)"
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'date'" class="tnum text-ink-muted">{{ date(column.date as string) }}</span>
					<span v-else-if="row.field === 'number'" class="whitespace-nowrap text-ink">{{ column.number }}</span>
					<span v-else-if="row.field === 'voucher'" class="whitespace-nowrap text-ink">{{ column.voucher }}</span>
					<div v-else-if="row.field === 'department_name'" class="leading-snug">
						<p class="text-ink">{{ column.department_name }}</p>
						<p class="text-s text-ink-muted">{{ column.department_code }}</p>
					</div>
					<span v-else-if="row.field === 'recipient'" class="text-ink">{{ column.recipient }}</span>
					<Amount v-else-if="row.field === 'amount'" :value="column.amount as number" />
					<Amount v-else-if="row.field === 'used'" :value="column.used as number" />
					<Amount v-else-if="row.field === 'remaining'" :value="column.remaining as number" />
					<Badge v-else-if="row.field === 'status'" :tone="statusTone[column.status as JournalStatus]" :title="column.rejection_reason as string">
						{{ journalStatusLabel[column.status as JournalStatus] ?? column.status }}
					</Badge>
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/cash-advance"
						:can-modify="(column.status as JournalStatus) === 'submitted'"
						@remove="remove(column as unknown as CashAdvance)"
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
