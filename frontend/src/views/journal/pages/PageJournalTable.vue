<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IconCheck, IconEye, IconPencil, IconPlus, IconTrash } from '@tabler/icons-vue'
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
import DatePicker from '@/components/base/DatePicker.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import Modal from '@/components/base/Modal.vue'
import Table from '@/components/base/Table.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import { journalStatusLabel } from '@/views/journal/schema'
import type { Journal, JournalStatus, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<Journal>({ endpoint: '/journal' })
const { ask } = useConfirm()
const toast = useToast()

const q = ref('')
const status = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const statusOptions = (Object.keys(journalStatusLabel) as JournalStatus[]).map((value) => ({ value, label: journalStatusLabel[value] }))

function applyAll() {
	applyFilters({ q: q.value, status: status.value, date_from: dateFrom.value, date_to: dateTo.value })
}
const runSearch = useDebounce(applyAll, 250)

// Bulk approve — checkbox column, applies to submitted journals only.
const selected = ref<Set<number>>(new Set())
const bulkOpen = ref(false)
const bulkApproving = ref(false)

const submittableIds = computed(() => columns.value.filter((j) => j.status === 'submitted').map((j) => j.id))
const allSelected = computed(() => submittableIds.value.length > 0 && submittableIds.value.every((id) => selected.value.has(id)))

// Any list reload (page / sort / filter) drops a now-stale selection.
watch(columns, () => (selected.value = new Set()))

function toggleAll(checked: boolean) {
	selected.value = checked ? new Set(submittableIds.value) : new Set()
}
function toggleRow(id: number, checked: boolean) {
	const next = new Set(selected.value)
	checked ? next.add(id) : next.delete(id)
	selected.value = next
}

async function confirmBulkApprove() {
	const ids = [...selected.value]
	bulkApproving.value = true
	let ok = 0
	for (const id of ids) {
		// No `date` sent → the mock keeps each journal's original date.
		try {
			await api.patch(`/journal/${id}/status`, { status: 'approved' })
			ok++
		} catch {
			// Collected into the summary toast below.
		}
	}
	bulkApproving.value = false
	bulkOpen.value = false
	if (ok) toast.success(`${ok} jurnal disetujui`)
	if (ok < ids.length) toast.error(`${ids.length - ok} jurnal gagal disetujui`)
	fetchList()
}

const statusLabel: Record<JournalStatus, string> = {
	submitted: 'Menunggu Persetujuan',
	approved: 'Disetujui',
	rejected: 'Ditolak'
}
const statusTone: Record<JournalStatus, 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info'> = {
	submitted: 'warning',
	approved: 'success',
	rejected: 'danger'
}

function remove(row: Journal) {
	ask({ title: 'Hapus jurnal', message: `Hapus jurnal "${row.number}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/journal/${row.id}`)
		toast.success('Jurnal dihapus')
		fetchList()
	})
}

const rows: TableRow[] = [
	{ label: '', field: 'select', align: 'left' },
	{ label: 'Tanggal', field: 'date', align: 'left', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number', align: 'left' },
	{ label: 'Voucher', field: 'voucher', align: 'left' },
	{ label: 'Keterangan', field: 'description', align: 'left' },
	{ label: 'Status', field: 'status', align: 'left' },
	{ label: 'Nilai (Rp)', field: 'total', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Jurnal Umum" subtitle="Journal entries">
			<template #actions>
				<Button size="sm" @click="router.push('/journal/tambah')"> <IconPlus class="h-4 w-4" /> Buat Jurnal </Button>
			</template>
		</PageHeader>

		<Panel>
			<FilterBar class="mb-3">
				<Input v-model="q" placeholder="Cari nomor / keterangan…" class="!w-64" @update:model-value="runSearch" />
				<Select v-model="status" class="!w-52" placeholder="Semua status" :options="statusOptions" @update:model-value="applyAll" />
				<DatePicker v-model="dateFrom" class="!w-40" @update:model-value="applyAll" />
				<span class="text-s text-ink-subtle">s/d</span>
				<DatePicker v-model="dateTo" class="!w-40" @update:model-value="applyAll" />
			</FilterBar>

			<div v-if="submittableIds.length" class="mb-3 flex flex-wrap items-center gap-3">
				<Checkbox :model-value="allSelected" label="Pilih semua yang menunggu persetujuan" @update:model-value="toggleAll" />
				<Button v-if="selected.size" size="sm" @click="bulkOpen = true">
					<IconCheck class="h-4 w-4" /> Setujui Terpilih ({{ selected.size }})
				</Button>
			</div>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column }">
					<Checkbox
						v-if="row.field === 'select'"
						:model-value="selected.has(column.id as number)"
						:disabled="(column.status as JournalStatus) !== 'submitted'"
						@update:model-value="(v) => toggleRow(column.id as number, v)"
					/>
					<span v-else-if="row.field === 'date'" class="font-mono tnum text-ink-muted">{{ date(column.date as string) }}</span>
					<span v-else-if="row.field === 'number'" class="text-ink">{{ column.number }}</span>
					<span v-else-if="row.field === 'voucher'" class="text-ink">{{ column.voucher }}</span>
					<Badge v-else-if="row.field === 'status'" :tone="statusTone[column.status as JournalStatus]" :title="column.rejection_reason as string">
						{{ statusLabel[column.status as JournalStatus] ?? column.status }}
					</Badge>
					<Amount v-else-if="row.field === 'total'" :value="column.total as number" />
					<div v-else-if="row.field === 'action'" class="flex justify-end gap-1">
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
							title="Lihat detail"
							@click="router.push(`/journal/${column.id}`)"
						>
							<IconEye class="h-4 w-4" />
						</button>
						<template v-if="(column.status as JournalStatus) === 'submitted'">
							<button
								class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
								title="Edit jurnal"
								@click="router.push(`/journal/edit/${column.id}`)"
							>
								<IconPencil class="h-4 w-4" />
							</button>
							<button
								class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
								title="Hapus jurnal"
								@click="remove(column as unknown as Journal)"
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

		<Modal :open="bulkOpen" title="Setujui Jurnal Terpilih" size="sm" @close="bulkOpen = false">
			<p class="text-s text-ink-muted">
				<span class="text-ink">{{ selected.size }}</span> jurnal akan disetujui. Tanggal tiap jurnal tetap memakai tanggal aslinya.
			</p>
			<template #footer>
				<Button variant="subtle" @click="bulkOpen = false">Batal</Button>
				<Button :loading="bulkApproving" @click="confirmBulkApprove"> <IconCheck v-if="!bulkApproving" class="h-4 w-4" /> Setujui </Button>
			</template>
		</Modal>
	</div>
</template>
