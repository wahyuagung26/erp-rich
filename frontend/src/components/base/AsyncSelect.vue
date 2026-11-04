<script setup lang="ts">
import { ref, shallowRef, nextTick, watch, onBeforeUnmount } from 'vue'
import { IconChevronDown, IconSearch, IconX, IconLoader2 } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useDebounce } from '@/composables/useDebounce'
import type { ApiList } from '@/utils/types'

// Single-select async combobox: search-as-you-type + infinite-scroll pagination
// against a real list endpoint (q/page/per_page — same contract useTableList
// uses). RULE: any dropdown whose options come from another menu's data (Merk,
// Cabang, Akun, Sub Akun, ...) uses this, never an eager-fetch <Select>. Plain
// <Select> is only for fixed picklists (enums like status/type). Pass the already-
// denormalized code/name as `initialLabel` on edit; use `@select` to read other
// fields of the picked row (e.g. its `code`).
//
// Not a generic SFC: Vue's template type inference can't pin a generic from a
// callback prop alone (no typed `items` prop to anchor it, and `endpoint` is
// just a string with no compile-time link to a type anyway), so it's not worth
// the friction. Consumers type their own optionLabel/optionValue callbacks —
// see FormProduct.vue's brandLabel()-style helpers for the pattern.
type Row = Record<string, unknown>

const props = withDefaults(
	defineProps<{
		modelValue?: number | string | null
		endpoint: string
		optionLabel: (item: Row) => string
		optionValue?: (item: Row) => number | string
		initialLabel?: string // avoids a resolve-by-id fetch — pass the already-denormalized code/name
		placeholder?: string
		perPage?: number
		disabled?: boolean
		params?: Record<string, string | number> // extra query params merged into every request, e.g. { type: 'cash_bank' }
	}>(),
	{ perPage: 20, placeholder: 'Pilih…' }
)

const emit = defineEmits<{ 'update:modelValue': [number | string | null]; select: [item: Row | null] }>()

const root = ref<HTMLElement>()
const menuEl = ref<HTMLElement>()
const pos = ref({ top: 0, left: 0, width: 0 })
const searchInput = ref<HTMLInputElement>()
const open = ref(false)
const query = ref('')
const options = shallowRef<Row[]>([])
const page = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const selectedLabel = ref(props.initialLabel ?? '')
// Follow external changes: parent clears the value (form reset) or loads another record (edit a row).
watch(
	() => [props.modelValue, props.initialLabel] as const,
	([value, label]) => {
		if (!value) selectedLabel.value = ''
		else if (label) selectedLabel.value = label
	}
)

function valueOf(item: Row): number | string {
	return props.optionValue ? props.optionValue(item) : (item.id as number | string)
}

async function fetchOptions(reset: boolean) {
	if (loading.value) return
	loading.value = true
	try {
		if (reset) page.value = 1
		const res = await api.get<ApiList<Row>>(props.endpoint, {
			params: { ...props.params, q: query.value || undefined, page: page.value, per_page: props.perPage }
		})
		lastPage.value = res.data.meta.last_page
		options.value = reset ? res.data.data : [...options.value, ...res.data.data]
	} finally {
		loading.value = false
	}
}

const runSearch = useDebounce(() => fetchOptions(true), 250)

// The menu is teleported + fixed so it isn't clipped by overflow containers (tables, modals).
function place() {
	const r = root.value!.getBoundingClientRect()
	const h = menuEl.value?.offsetHeight ?? 0
	const flip = h > 0 && r.bottom + 4 + h > window.innerHeight && r.top > h // open upward when there's no room below
	pos.value = { left: r.left, width: r.width, top: flip ? r.top - h - 4 : r.bottom + 4 }
}
async function onOpen() {
	if (props.disabled) return
	open.value = true
	place()
	if (!options.value.length) fetchOptions(true)
	await nextTick()
	place()
	searchInput.value?.focus()
}

function onClose() {
	open.value = false
	query.value = ''
	options.value = []
}

function onScroll(e: Event) {
	const el = e.target as HTMLElement
	const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
	if (nearBottom && page.value < lastPage.value && !loading.value) {
		page.value += 1
		fetchOptions(false)
	}
}

function pick(item: Row) {
	selectedLabel.value = props.optionLabel(item)
	emit('update:modelValue', valueOf(item))
	emit('select', item)
	onClose()
}

function clear() {
	selectedLabel.value = ''
	emit('update:modelValue', null)
	emit('select', null)
}

function onDocDown(e: Event) {
	const t = e.target as Node
	if (!root.value?.contains(t) && !menuEl.value?.contains(t)) onClose()
}
function onAnyScroll(e: Event) {
	if (!menuEl.value?.contains(e.target as Node)) onClose() // the menu's own list scrolls for infinite loading
}
watch(open, (isOpen) => {
	const op = isOpen ? 'addEventListener' : 'removeEventListener'
	document[op]('pointerdown', onDocDown)
	window[op]('scroll', onAnyScroll, true)
	window[op]('resize', onClose)
})
onBeforeUnmount(() => {
	open.value = false
})
</script>

<template>
	<div ref="root" class="relative">
		<button
			type="button"
			:disabled="disabled"
			class="flex w-full items-center justify-between gap-2 rounded-md border border-ink-subtle/30 bg-panel px-3 py-2 text-left text-m text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:bg-fill disabled:opacity-50"
			@click="open ? onClose() : onOpen()"
		>
			<span :class="['truncate', !selectedLabel && 'text-ink-subtle']">{{ selectedLabel || placeholder }}</span>
			<span class="flex shrink-0 items-center gap-1">
				<IconX v-if="selectedLabel" class="h-4 w-4 text-ink-subtle hover:text-ink" @click.stop="clear" />
				<IconChevronDown class="h-4 w-4 text-ink-subtle" />
			</span>
		</button>

		<Teleport to="body">
			<div
				v-if="open"
				ref="menuEl"
				class="fixed z-[60] min-w-[240px] rounded-md bg-panel shadow-overlay"
				:style="{ top: pos.top + 'px', left: pos.left + 'px', width: pos.width + 'px' }"
			>
				<div class="flex items-center gap-2 border-b border-hairline px-2.5 py-2">
					<IconSearch class="h-4 w-4 shrink-0 text-ink-subtle" />
					<input
						ref="searchInput"
						v-model="query"
						type="text"
						placeholder="Cari…"
						class="w-full bg-transparent text-m text-ink placeholder:text-ink-subtle focus:outline-none"
						@input="runSearch"
					/>
					<IconLoader2 v-if="loading" class="h-4 w-4 shrink-0 animate-spin text-ink-subtle" />
				</div>
				<div class="max-h-64 overflow-y-auto p-1" @scroll="onScroll">
					<button
						v-for="item in options"
						:key="valueOf(item)"
						type="button"
						class="block w-full truncate rounded px-2.5 py-2 text-left text-m text-ink hover:bg-fill"
						@click="pick(item)"
					>
						{{ optionLabel(item) }}
					</button>
					<p v-if="!loading && !options.length" class="px-2.5 py-2 text-s text-ink-subtle">Tidak ada hasil</p>
				</div>
			</div>
		</Teleport>
	</div>
</template>
