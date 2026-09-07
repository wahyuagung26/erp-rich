<script setup lang="ts">
import { ref, shallowRef, nextTick } from 'vue'
import { IconChevronDown, IconSearch, IconX, IconLoader2 } from '@tabler/icons-vue'
import api from '@/utils/api'
import { onClickOutside } from '@/composables/onClickOutside'
import { useDebounce } from '@/composables/useDebounce'
import type { ApiList } from '@/utils/types'

// Single-select async combobox: search-as-you-type + infinite-scroll pagination
// against a real list endpoint (q/page/per_page — same contract useTableList
// uses). For the eager "fetch <=100 rows once" case (small master data — Merk,
// Satuan, etc.) plain <Select> is still the right, simpler choice; reach for
// this when a list can realistically outgrow one page (Produk, Supplier, Customer).
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

const emit = defineEmits<{ 'update:modelValue': [number | string | null] }>()

const root = ref<HTMLElement>()
const searchInput = ref<HTMLInputElement>()
const open = ref(false)
const query = ref('')
const options = shallowRef<Row[]>([])
const page = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const selectedLabel = ref(props.initialLabel ?? '')

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

async function onOpen() {
	if (props.disabled) return
	open.value = true
	if (!options.value.length) fetchOptions(true)
	await nextTick()
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
	onClose()
}

function clear() {
	selectedLabel.value = ''
	emit('update:modelValue', null)
}

onClickOutside(root, onClose)
</script>

<template>
	<div ref="root" class="relative">
		<button
			type="button"
			:disabled="disabled"
			class="flex w-full items-center justify-between gap-2 rounded-md bg-fill px-3 py-2 text-left text-m text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
			@click="open ? onClose() : onOpen()"
		>
			<span :class="['truncate', !selectedLabel && 'text-ink-subtle']">{{ selectedLabel || placeholder }}</span>
			<span class="flex shrink-0 items-center gap-1">
				<IconX v-if="selectedLabel" class="h-4 w-4 text-ink-subtle hover:text-ink" @click.stop="clear" />
				<IconChevronDown class="h-4 w-4 text-ink-subtle" />
			</span>
		</button>

		<div v-if="open" class="absolute left-0 z-20 mt-1 w-full rounded-md bg-panel shadow-overlay">
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
	</div>
</template>
