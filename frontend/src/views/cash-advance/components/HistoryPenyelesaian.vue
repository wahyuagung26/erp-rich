<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import { IconPaperclip, IconPencil, IconPlus, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { date, money } from '@/utils/format'
import { parseSettlement } from '@/views/cash-advance/schema'
import Panel from '@/components/base/Panel.vue'
import Table from '@/components/base/Table.vue'
import Button from '@/components/base/Button.vue'
import Amount from '@/components/base/Amount.vue'
import Modal from '@/components/base/Modal.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
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
	{ label: 'Lampiran', field: 'attachment', align: 'left' },
	{ label: 'Aksi', field: 'action', align: 'right' }
]

const MAX_ATTACHMENT = 5 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

const modalOpen = ref(false)
const editing = ref<CashAdvanceSettlement | null>(null)
const saving = ref(false)
const errors = ref<Record<string, string>>({})
const form = reactive<{ date: string; amount: number; attachment: CashAdvanceSettlement['attachment'] }>({
	date: '',
	amount: 0,
	attachment: null
})

function openAdd() {
	editing.value = null
	form.date = new Date().toISOString().slice(0, 10)
	form.amount = 0
	form.attachment = null
	errors.value = {}
	modalOpen.value = true
}

function openEdit(row: CashAdvanceSettlement) {
	editing.value = row
	form.date = row.date
	form.amount = row.amount
	form.attachment = row.attachment && { ...row.attachment }
	errors.value = {}
	modalOpen.value = true
}

function onAttachmentPick(event: Event) {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	if (!file) return
	if (!ALLOWED_TYPES.includes(file.type)) {
		toast.error('Lampiran harus berupa PDF, JPG, JPEG, atau PNG')
		input.value = ''
		return
	}
	if (file.size > MAX_ATTACHMENT) {
		toast.error('Ukuran lampiran maksimal 5 MB')
		input.value = ''
		return
	}
	const reader = new FileReader()
	reader.onload = () => {
		form.attachment = { name: file.name, type: file.type, size: file.size, data_url: String(reader.result) }
	}
	reader.onerror = () => toast.error('Lampiran tidak dapat dibaca')
	reader.readAsDataURL(file)
}
function removeAttachment() {
	form.attachment = null
}

const cap = computed(() => props.advance.remaining + (editing.value?.amount ?? 0))

async function save() {
	if (saving.value) return
	const parsed = parseSettlement(form, cap.value)
	errors.value = parsed.errors ?? {}
	if (!parsed.data) return
	saving.value = true
	try {
		if (editing.value) {
			await api.put(`/cash-advance/${props.advance.id}/settlement/${editing.value.id}`, parsed.data)
			toast.success('Penyelesaian uang muka diperbarui')
		} else {
			await api.post(`/cash-advance/${props.advance.id}/settlement`, parsed.data)
			toast.success('Penyelesaian uang muka ditambahkan')
		}
		modalOpen.value = false
		await load()
		emit('changed')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) {
			const serverErrors = err.response.data?.errors
			if (serverErrors) errors.value = Object.fromEntries(Object.entries(serverErrors).map(([key, messages]) => [key, (messages as string[])[0]]))
			else toast.error(err.response.data?.message ?? 'Penyelesaian tidak dapat disimpan')
		} else if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Penyelesaian tidak dapat disimpan')
		else throw err
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
					<span v-if="row.field === 'no'" class="font-mono tnum text-ink-muted">{{ rowIndex + 1 }}</span>
					<span v-else-if="row.field === 'date'" class="font-mono tnum text-ink-muted">{{ date(column.date as string) }}</span>
					<span v-else-if="row.field === 'number'" class="text-ink">{{ column.number }}</span>
					<Amount v-else-if="row.field === 'amount'" :value="column.amount as number" />
					<Amount v-else-if="row.field === 'remaining_after'" :value="column.remaining_after as number" />
					<a
						v-else-if="row.field === 'attachment' && (column.attachment as CashAdvanceSettlement['attachment'])"
						:href="(column.attachment as CashAdvanceSettlement['attachment'])!.data_url"
						:download="(column.attachment as CashAdvanceSettlement['attachment'])!.name"
						target="_blank"
						class="inline-flex items-center gap-1 text-primary-dark hover:underline"
					>
						<IconPaperclip class="h-4 w-4" /> Lihat
					</a>
					<span v-else-if="row.field === 'attachment'" class="text-ink-muted">–</span>
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

		<Modal :open="modalOpen" :title="editing ? 'Edit Penyelesaian' : 'Tambah Penyelesaian'" size="sm" @close="modalOpen = false">
			<div class="space-y-4">
				<FormField label="Tanggal" required :error="errors.date">
					<DatePicker v-model="form.date" />
				</FormField>
				<FormField label="Nilai" required :error="errors.amount" :hint="`Maksimal sisa saat ini: Rp ${money(cap)}`">
					<MoneyInput v-model="form.amount" />
				</FormField>
				<FormField label="Lampiran" required :error="errors.attachment" hint="PDF, JPG, JPEG, atau PNG. Maksimal 5 MB.">
					<div v-if="form.attachment" class="flex items-center gap-2 rounded-md bg-fill px-3 py-2 text-s">
						<IconPaperclip class="h-4 w-4 shrink-0 text-primary" />
						<span class="min-w-0 flex-1 truncate text-ink">{{ form.attachment.name }}</span>
						<button type="button" class="text-danger hover:underline" @click="removeAttachment">Hapus</button>
					</div>
					<input
						v-else
						type="file"
						accept="application/pdf,image/jpeg,image/png"
						class="block w-full text-s text-ink-muted file:mr-2 file:rounded-md file:border-0 file:bg-fill file:px-3 file:py-2 file:text-s file:text-ink"
						@change="onAttachmentPick"
					/>
				</FormField>
			</div>
			<template #footer>
				<Button variant="subtle" @click="modalOpen = false">Batal</Button>
				<Button :loading="saving" @click="save"><IconPlus v-if="!saving" class="h-4 w-4" /> Simpan</Button>
			</template>
		</Modal>
	</Panel>
</template>
