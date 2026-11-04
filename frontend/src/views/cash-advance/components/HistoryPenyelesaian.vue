<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { IconPaperclip, IconPencil, IconPlus, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { date } from '@/utils/format'
import FormPenyelesaian from '@/views/cash-advance/components/FormPenyelesaian.vue'
import type { SettlementRequest } from '@/views/cash-advance/schema'
import Panel from '@/components/base/Panel.vue'
import Table from '@/components/base/Table.vue'
import Button from '@/components/base/Button.vue'
import Amount from '@/components/base/Amount.vue'
import Modal from '@/components/base/Modal.vue'
import type { CashAdvance, CashAdvanceSettlement, TableRow } from '@/utils/types'

const props = defineProps<{ advance: CashAdvance }>()
const emit = defineEmits<{ changed: [] }>()

const { ask } = useConfirm()
const toast = useToast()

const rows = ref<CashAdvanceSettlement[]>([])
const loading = ref(true)

async function load() {
	loading.value = true
	try {
		const res = await api.get<{ data: CashAdvanceSettlement[] }>(`/cash-advance/${props.advance.id}/settlement`)
		rows.value = res.data.data
	} finally {
		loading.value = false
	}
}
onMounted(load)

const canAdd = computed(() => props.advance.status === 'approved' && props.advance.remaining > 0)
const canManage = computed(() => props.advance.status === 'approved')

const columns: TableRow[] = [
	{ label: 'No', field: 'no', align: 'left' },
	{ label: 'Tanggal', field: 'date', align: 'left' },
	{ label: 'Nomor Penyelesaian', field: 'number', align: 'left' },
	{ label: 'Nilai', field: 'amount', align: 'right' },
	{ label: 'Sisa Setelah', field: 'remaining_after', align: 'right' },
	{ label: 'Lampiran', field: 'attachments', align: 'left' },
	{ label: 'Aksi', field: 'action', align: 'right' }
]

const modalOpen = ref(false)
const editing = ref<CashAdvanceSettlement | null>(null)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormPenyelesaian>>()
// Remaining of the advance before this settlement (Legacy "Sisa Sebelum").
const cap = computed(() => props.advance.remaining + (editing.value?.amount ?? 0))

function openAdd() {
	editing.value = null
	modalOpen.value = true
}

function openEdit(row: CashAdvanceSettlement) {
	editing.value = row
	modalOpen.value = true
}

async function save(payload: SettlementRequest) {
	if (saving.value) return
	saving.value = true
	try {
		if (editing.value) {
			await api.put(`/cash-advance/${props.advance.id}/settlement/${editing.value.id}`, payload)
			toast.success('Penyelesaian uang muka diperbarui')
		} else {
			await api.post(`/cash-advance/${props.advance.id}/settlement`, payload)
			toast.success('Penyelesaian uang muka ditambahkan')
		}
		modalOpen.value = false
		await load()
		emit('changed')
	} catch (err) {
		if (axios.isAxiosError(err)) {
			const serverErrors = err.response?.data?.errors
			if (err.response?.status === 422 && serverErrors) formRef.value?.setServerErrors(serverErrors)
			else toast.error(err.response?.data?.message ?? 'Penyelesaian tidak dapat disimpan')
		} else throw err
	} finally {
		saving.value = false
	}
}

function remove(row: CashAdvanceSettlement) {
	ask({ title: 'Hapus penyelesaian', message: `Hapus penyelesaian "${row.number}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/cash-advance/${props.advance.id}/settlement/${row.id}`)
			toast.success('Penyelesaian uang muka dihapus')
			await load()
			emit('changed')
		} catch (err) {
			if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Penyelesaian tidak dapat dihapus')
		}
	})
}
</script>

<template>
	<Panel>
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<h3 class="subhead">Riwayat Penyelesaian</h3>
				<Button v-if="canAdd" size="sm" @click="openAdd"><IconPlus class="h-4 w-4" /> Tambah Penyelesaian</Button>
			</div>

			<Table :rows="columns" :columns="rows as unknown as Record<string, unknown>[]" :loading="loading" empty-text="Belum ada penyelesaian">
				<template #table-content="{ row, column, rowIndex }">
					<span v-if="row.field === 'no'" class="tnum text-ink-muted">{{ rowIndex + 1 }}</span>
					<span v-else-if="row.field === 'date'" class="tnum text-ink-muted">{{ date(column.date as string) }}</span>
					<span v-else-if="row.field === 'number'" class="text-ink">{{ column.number }}</span>
					<Amount v-else-if="row.field === 'amount'" :value="column.amount as number" />
					<Amount v-else-if="row.field === 'remaining_after'" :value="column.remaining_after as number" />
					<span
						v-else-if="row.field === 'attachments' && (column.attachments as CashAdvanceSettlement['attachments']).length"
						class="inline-flex flex-col gap-0.5"
					>
						<a
							v-for="(file, index) in column.attachments as CashAdvanceSettlement['attachments']"
							:key="file.name + index"
							:href="file.data_url"
							:download="file.name"
							target="_blank"
							class="inline-flex items-center gap-1 text-primary-dark hover:underline"
						>
							<IconPaperclip class="h-4 w-4" /> {{ file.name }}
						</a>
					</span>
					<span v-else-if="row.field === 'attachments'" class="text-ink-muted">–</span>
					<div v-else-if="row.field === 'action'" class="flex justify-end gap-1">
						<template v-if="canManage">
							<button
								class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
								title="Edit penyelesaian"
								@click="openEdit(column as unknown as CashAdvanceSettlement)"
							>
								<IconPencil class="h-4 w-4" />
							</button>
							<button
								class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
								title="Hapus penyelesaian"
								@click="remove(column as unknown as CashAdvanceSettlement)"
							>
								<IconTrash class="h-4 w-4" />
							</button>
						</template>
						<span v-else class="text-ink-subtle">–</span>
					</div>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
		</div>

		<Modal
			:open="modalOpen"
			:title="editing ? 'Edit Penyelesaian Uang Muka' : 'Penyelesaian Uang Muka Operasional'"
			size="xl"
			@close="modalOpen = false"
		>
			<FormPenyelesaian
				v-if="modalOpen"
				ref="formRef"
				:advance="advance"
				:cap="cap"
				:editing="editing"
				:loading="saving"
				@submit="save"
				@cancel="modalOpen = false"
			/>
		</Modal>
	</Panel>
</template>
