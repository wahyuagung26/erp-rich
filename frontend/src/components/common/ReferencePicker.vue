<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { IconSearch, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import { date as formatDate } from '@/utils/format'
import { useDebounce } from '@/composables/useDebounce'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import Modal from '@/components/base/Modal.vue'
import Input from '@/components/base/Input.vue'
import Table from '@/components/base/Table.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import Badge from '@/components/base/Badge.vue'
import type { ApiList, Pagination, PickerColumn, TableRow } from '@/utils/types'

// Picks a PREVIOUS TRANSACTION (PO, penerimaan, invoice, SO…) in a modal with a detail table, instead of a one-line dropdown.
// Same contract as <AsyncSelect> (v-model id, `initialLabel`, `@select` with the row, clearable, `disabled`) against a list
// endpoint (q/page/per_page), so a form swaps the tag and adds `columns` — its `apply…` logic stays as is.
// Master data (supplier, gudang, akun…) stays on <AsyncSelect>.
type Row = Record<string, unknown>

const PER_PAGE = 10
const props = withDefaults(
	defineProps<{
		modelValue?: number | string | null
		endpoint: string
		columns: PickerColumn[] // first column is the keyboard-focusable pick button; keep it the document number
		optionLabel: (item: Row) => string // trigger text once picked
		title: string
		initialLabel?: string // pass the denormalized label on edit — avoids a resolve-by-id fetch
		placeholder?: string
		searchPlaceholder?: string
		disabled?: boolean
		params?: Record<string, string | number>
		resetWarning?: string // set only while the form holds data copied from the current reference; changing it then asks to confirm
	}>(),
	{ placeholder: 'Pilih…', searchPlaceholder: 'Cari nomor, pihak terkait…' }
)

const emit = defineEmits<{ 'update:modelValue': [number | string | null]; select: [item: Row | null] }>()

const toast = useToast()
const confirm = useConfirm()
const open = ref(false)
const query = ref('')
const rows = shallowRef<Row[]>([])
const pagination = ref<Pagination>()
const loading = ref(false)
const searchWrap = ref<HTMLElement>()
const selectedLabel = ref(props.initialLabel ?? '')

// Follow external changes: parent clears the value (form reset) or loads another record (edit).
watch(
	() => [props.modelValue, props.initialLabel] as const,
	([value, label]) => {
		if (!value) selectedLabel.value = ''
		else if (label) selectedLabel.value = label
	}
)

const tableRows = computed<TableRow[]>(() =>
	props.columns.map((c) => ({ label: c.label, field: c.field, align: c.kind === 'money' ? 'right' : c.align }))
)
const columnOf = (field: string) => props.columns.find((c) => c.field === field)

// The selected reference is marked and listed first. `selectedRow` is the row picked in this session — it lets the selection
// show on page 1 even when the server's ordering would put it elsewhere; on later pages or while searching it is only marked.
const selectedRow = shallowRef<Row | null>(null)
const isSelected = (item: Row) => !!props.modelValue && String(item.id as number | string) === String(props.modelValue)
const shownRows = computed(() => {
	if (!props.modelValue || (pagination.value?.page ?? 1) > 1) return rows.value
	const top = rows.value.find(isSelected) ?? (query.value ? null : selectedRow.value)
	return top && isSelected(top) ? [top, ...rows.value.filter((row) => !isSelected(row))] : rows.value
})

// Only the newest request may write results — a slow earlier search must not overwrite a later one.
let seq = 0
async function load(page = 1) {
	const id = ++seq
	loading.value = true
	try {
		const res = await api.get<ApiList<Row>>(props.endpoint, { params: { ...props.params, q: query.value || undefined, page, per_page: PER_PAGE } })
		if (id !== seq) return
		rows.value = res.data.data ?? []
		pagination.value = res.data.meta
	} catch {
		if (id === seq) toast.error('Data tidak dapat dimuat')
	} finally {
		if (id === seq) loading.value = false
	}
}
const runSearch = useDebounce(() => load(1))

async function onOpen() {
	if (props.disabled) return
	query.value = ''
	rows.value = []
	pagination.value = undefined
	open.value = true
	void load(1)
	await nextTick()
	searchWrap.value?.querySelector('input')?.focus() // Esc closes the modal only while focus is inside it
}

function onClose() {
	open.value = false
	seq++ // drop any in-flight response
}

// Changing or clearing the reference replaces whatever the form copied from the old one. With `resetWarning` set, ask first;
// nothing is emitted until the user agrees, so Batal leaves the old value untouched.
function guarded(run: () => void) {
	if (!props.resetWarning) return run()
	confirm.ask({ title: 'Ubah referensi?', message: props.resetWarning, confirmText: 'Ya, ubah' }, run)
}

// The list stays open while the confirm shows, so Batal lets the user pick another reference right away.
function pick(item: Row) {
	if (isSelected(item)) return onClose() // same reference: nothing to replace
	guarded(() => {
		selectedRow.value = item
		selectedLabel.value = props.optionLabel(item)
		emit('update:modelValue', item.id as number | string)
		emit('select', item)
		onClose()
	})
}

function clear() {
	guarded(() => {
		selectedRow.value = null
		selectedLabel.value = ''
		emit('update:modelValue', null)
		emit('select', null)
	})
}

function cell(field: string, item: Row): string {
	const column = columnOf(field)
	if (column?.format) return column.format(item)
	const value = item[field]
	return value === null || value === undefined || value === '' ? '–' : String(value)
}
</script>

<template>
	<div>
		<div class="relative">
			<button
				type="button"
				:disabled="disabled"
				class="flex w-full items-center justify-between gap-2 rounded-md border border-ink-subtle/30 bg-panel px-3 py-2 text-left text-m text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:bg-fill disabled:opacity-50"
				@click="onOpen"
			>
				<span :class="['truncate', !selectedLabel && 'text-ink-subtle']">{{ selectedLabel || placeholder }}</span>
				<IconSearch class="h-4 w-4 shrink-0 text-ink-subtle" :class="{ 'mr-6': selectedLabel && !disabled }" />
			</button>
			<!-- sibling of the trigger (not inside it): a button must not nest another interactive control -->
			<button
				v-if="selectedLabel && !disabled"
				type="button"
				aria-label="Kosongkan"
				class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
				@click="clear"
			>
				<IconX class="h-4 w-4" />
			</button>
		</div>

		<Modal :open="open" :title="title" size="xl" @close="onClose">
			<div class="space-y-3">
				<div ref="searchWrap">
					<Input v-model="query" :placeholder="searchPlaceholder" @update:model-value="runSearch">
						<template #suffix><IconSearch class="h-4 w-4" /></template>
					</Input>
				</div>
				<Table :rows="tableRows" :columns="shownRows" :loading="loading" empty-text="Tidak ada hasil" @row-click="pick">
					<template #table-content="{ row, column }">
						<template v-if="row.field === columns[0].field">
							<button type="button" class="text-left font-medium text-primary-dark hover:underline" @click="pick(column)">
								{{ cell(row.field, column) }}
							</button>
							<Badge v-if="isSelected(column)" tone="primary" class="ml-2 align-middle">Dipilih</Badge>
						</template>
						<Amount v-else-if="columnOf(row.field)?.kind === 'money'" :value="column[row.field] as number" />
						<span v-else-if="columnOf(row.field)?.kind === 'date'" class="tnum">{{ formatDate(column[row.field] as string) }}</span>
						<span v-else>{{ cell(row.field, column) }}</span>
					</template>
				</Table>
				<TablePagination :pagination="pagination" :show-limit="false" @page-to="({ page }) => load(page ?? 1)" />
			</div>
		</Modal>
	</div>
</template>
