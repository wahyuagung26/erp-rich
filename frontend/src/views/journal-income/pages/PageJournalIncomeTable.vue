<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IconCheck, IconPlus, IconHistory } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useHistory } from '@/composables/useHistory'
import { useKpiTiles } from '@/composables/useKpiTiles'
import { journalKpiDefs } from '@/views/journal/kpi'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import DateRangePicker from '@/components/base/DateRangePicker.vue'
import Button from '@/components/base/Button.vue'
import ApprovalBadge from '@/components/common/ApprovalBadge.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import Modal from '@/components/base/Modal.vue'
import Table from '@/components/base/Table.vue'
import KpiFilter from '@/components/base/KpiFilter.vue'
import RowActions from '@/components/base/RowActions.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import { journalStatusLabel } from '@/views/journal-income/schema'
import type { JournalIncome, JournalStatus, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<JournalIncome>({ endpoint: '/journal-income' })
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()

const q = ref('')
const status = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const statusOptions = (Object.keys(journalStatusLabel) as JournalStatus[]).map((value) => ({ value, label: journalStatusLabel[value] }))

function applyAll() {
	applyFilters({ q: q.value, status: status.value, date_from: dateFrom.value, date_to: dateTo.value })
}
const runSearch = useDebounce(applyAll, 250)

// KPI tiles = presets of the status dropdown (docs/journal-income/list-journal-income.md).
const kpi = useKpiTiles(
	journalKpiDefs,
	{ status },
	computed(() => pagination.value?.summary),
	applyAll
)

// Opens the shared record-history modal for one row.
function openHistory(row: JournalIncome) {
	history.open({ kode: row.number, endpoint: `/journal-income/${row.id}/history` })
}

// Bulk approve — checkbox column, applies to submitted journals only.
const selected = ref<Set<number>>(new Set())
const bulkOpen = ref(false)
const bulkApproving = ref(false)

const submittableIds = computed(() => columns.value.filter((j) => j.status === 'submitted' && !j.locked).map((j) => j.id))
const allSelected = computed(() => submittableIds.value.length > 0 && submittableIds.value.every((id) => selected.value.has(id)))

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
		try {
			await api.patch(`/journal-income/${id}/status`, { status: 'approved' })
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

function remove(row: JournalIncome) {
	ask({ title: 'Hapus jurnal', message: `Hapus jurnal "${row.number}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/journal-income/${row.id}`)
		toast.success('Jurnal pemasukan dihapus')
		fetchList()
	})
}

const rows: TableRow[] = [
	{ label: '', field: 'select', align: 'left' },
	{ label: 'Tanggal', field: 'date', align: 'left', isSort: { activeSort: 'desc' } },
	{ label: 'Nomor', field: 'number', align: 'left' },
	{ label: 'Voucher', field: 'voucher', align: 'left' },
	{ label: 'Departemen', field: 'department_name', align: 'left' },
	{ label: 'Keterangan', field: 'description', align: 'left' },
	{ label: 'Status', field: 'status', align: 'left' },
	{ label: 'Nominal', field: 'cash_in', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Jurnal Pemasukan" subtitle="Cash receipt">
			<template #actions>
				<Button size="sm" @click="router.push('/journal-income/tambah')"> <IconPlus class="h-4 w-4" /> Buat Jurnal </Button>
			</template>
		</PageHeader>

		<Panel>
			<KpiFilter class="mb-3" :items="kpi.items.value" :active="kpi.active.value" @select="kpi.select" />
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Input v-model="q" placeholder="Cari nomor / keterangan…" class="!w-64" @update:model-value="runSearch" />
				<Select v-model="status" class="!w-52" placeholder="Semua status" :options="statusOptions" @update:model-value="applyAll" />
				<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="applyAll" />
			</FilterBar>

			<div v-if="submittableIds.length" class="mb-3 flex flex-wrap items-center gap-3">
				<Checkbox :model-value="allSelected" label="Pilih semua yang menunggu persetujuan" @update:model-value="toggleAll" />
				<Button v-if="selected.size" size="sm" @click="bulkOpen = true">
					<IconCheck class="h-4 w-4" /> Setujui Terpilih ({{ selected.size }})
				</Button>
			</div>

			<Table
				@row-dblclick="(r) => router.push(`/journal-income/${r.id}`)"
				:rows="rows"
				:columns="columns as unknown as Record<string, unknown>[]"
				:loading="loading"
				@handle-sort="handleSort"
			>
				<template #table-content="{ row, column }">
					<Checkbox
						v-if="row.field === 'select'"
						:model-value="selected.has(column.id as number)"
						:disabled="(column.status as JournalStatus) !== 'submitted' || !!column.locked"
						@update:model-value="(v) => toggleRow(column.id as number, v)"
					/>
					<span v-else-if="row.field === 'date'" class="tnum whitespace-nowrap text-ink-muted">{{ date(column.date as string) }}</span>
					<span v-else-if="row.field === 'number'" class="whitespace-nowrap text-ink">{{ column.number }}</span>
					<span v-else-if="row.field === 'voucher'" class="whitespace-nowrap text-ink">{{ column.voucher }}</span>
					<div v-else-if="row.field === 'department_name'" class="leading-snug">
						<p class="text-ink">{{ column.department_name }}</p>
						<p class="text-s text-ink-muted">{{ column.department_code }}</p>
					</div>
					<ApprovalBadge v-else-if="row.field === 'status'" :status="column.status as JournalStatus" :title="column.rejection_reason as string" />
					<Amount v-else-if="row.field === 'cash_in'" :value="column.cash_in as number" />
					<RowActions
						v-else-if="row.field === 'action'"
						:id="column.id as number"
						base="/journal-income"
						:actions="[{ label: 'Riwayat', icon: IconHistory, onClick: () => openHistory(column as unknown as JournalIncome) }]"
						:can-modify="(column.status as JournalStatus) === 'submitted' && !column.locked"
						@remove="remove(column as unknown as JournalIncome)"
					/>
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
