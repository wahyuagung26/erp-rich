<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconEye, IconPaperclip, IconPencil, IconPlus, IconTrash } from '@tabler/icons-vue'
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
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import { journalStatusLabel } from '@/views/cash-advance/schema'
import type { CashAdvance, JournalAttachment, JournalStatus, TableRow } from '@/utils/types'

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

function attachmentOf(column: Record<string, unknown>): JournalAttachment | null {
	return (column.attachment as JournalAttachment | null) ?? null
}

function remove(row: CashAdvance) {
	ask({ title: 'Hapus uang muka', message: `Hapus uang muka "${row.number}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/cash-advance/${row.id}`)
		toast.success('Uang muka operasional dihapus')
		fetchList()
	})
}

const rows: TableRow[] = [
	{ label: 'No', field: 'no', align: 'left' },
	{ label: 'Tanggal', field: 'date', align: 'left', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Departemen', field: 'department_name', align: 'left' },
	{ label: 'Penerima', field: 'recipient', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Keterangan', field: 'description', align: 'left' },
	{ label: 'Nilai', field: 'amount', align: 'right' },
	{ label: 'Penyelesaian', field: 'used', align: 'right' },
	{ label: 'Sisa', field: 'remaining', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: 'Status', field: 'status', align: 'left' },
	{ label: 'Lampiran', field: 'attachment', align: 'left' },
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
				<Input v-model="q" placeholder="Cari nomor / penerima / tanggal / keterangan…" class="!w-72" @update:model-value="runSearch" />
				<Select v-model="approved" class="!w-52" placeholder="Semua" :options="approvalOptions" @update:model-value="applyAll" />
			</FilterBar>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column, rowIndex }">
					<span v-if="row.field === 'no'" class="font-mono tnum text-ink-muted">
						{{ ((pagination?.page ?? 1) - 1) * (pagination?.per_page ?? 10) + rowIndex + 1 }}
					</span>
					<span v-else-if="row.field === 'date'" class="font-mono tnum text-ink-muted">{{ date(column.date as string) }}</span>
					<span v-else-if="row.field === 'number'" class="text-ink">{{ column.number }}</span>
					<span v-else-if="row.field === 'department_name'" class="text-ink">{{ column.department_code }} — {{ column.department_name }}</span>
					<span v-else-if="row.field === 'recipient'" class="text-ink">{{ column.recipient }}</span>
					<span v-else-if="row.field === 'description'" class="text-ink-muted">{{ column.description || '–' }}</span>
					<Amount v-else-if="row.field === 'amount'" :value="column.amount as number" />
					<Amount v-else-if="row.field === 'used'" :value="column.used as number" />
					<Amount v-else-if="row.field === 'remaining'" :value="column.remaining as number" />
					<Badge v-else-if="row.field === 'status'" :tone="statusTone[column.status as JournalStatus]" :title="column.rejection_reason as string">
						{{ journalStatusLabel[column.status as JournalStatus] ?? column.status }}
					</Badge>
					<a
						v-else-if="row.field === 'attachment' && attachmentOf(column)"
						:href="attachmentOf(column)!.data_url"
						:download="attachmentOf(column)!.name"
						target="_blank"
						class="inline-flex items-center gap-1 text-primary-dark hover:underline"
						@click.stop
					>
						<IconPaperclip class="h-4 w-4" /> Lihat
					</a>
					<span v-else-if="row.field === 'attachment'" class="text-ink-muted">–</span>
					<div v-else-if="row.field === 'action'" class="flex justify-end gap-1">
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
							title="Lihat detail"
							@click="router.push(`/cash-advance/${column.id}`)"
						>
							<IconEye class="h-4 w-4" />
						</button>
						<template v-if="(column.status as JournalStatus) === 'submitted'">
							<button
								class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
								title="Edit uang muka"
								@click="router.push(`/cash-advance/edit/${column.id}`)"
							>
								<IconPencil class="h-4 w-4" />
							</button>
							<button
								class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
								title="Hapus uang muka"
								@click="remove(column as unknown as CashAdvance)"
							>
								<IconTrash class="h-4 w-4" />
							</button>
						</template>
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
