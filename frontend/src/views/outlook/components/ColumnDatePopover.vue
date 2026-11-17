<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { IconCheck, IconTrash, IconX } from '@tabler/icons-vue'
import dayjs from 'dayjs'
import Button from '@/components/base/Button.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import DateRangePicker from '@/components/base/DateRangePicker.vue'
import { EDGE_DAYS, RANGE_FIRST_SLOT, RANGE_MAX_DAYS, RANGE_WEEK, type OutlookWeek } from '../types'

// Sets / clears the date of one day column, in a small popover under the clicked header (no modal).
// A single date applies as soon as it is picked; week 5 columns 5–7 also take an end date (a range of up to 3 days = one
// column), so those show the shared <DateRangePicker inline> calendar and keep an explicit "Terapkan". Closed by Esc, a click outside, or scrolling.
const props = defineProps<{
	open: boolean
	anchor: DOMRect | null
	week: OutlookWeek | null
	slot: number
	year: number
	month: number
	saving?: boolean
}>()
const emit = defineEmits<{ close: []; apply: [{ start: string; end: string }]; clear: [] }>()

const start = ref('')
const end = ref('')
const card = ref<HTMLElement>()
const startInput = ref<{ $el: HTMLInputElement }>()
const pos = ref({ top: -9999, left: -9999 }) // off-screen until measured, so the card never flashes at 0,0

const isRange = computed(() => props.week?.week_no === RANGE_WEEK && props.slot >= RANGE_FIRST_SLOT)
const filled = computed(() => !!props.week?.slots[props.slot - 1])
const first = computed(() => dayjs(`${props.year}-${String(props.month).padStart(2, '0')}-01`))
const min = computed(() => first.value.subtract(EDGE_DAYS, 'day').format('YYYY-MM-DD'))
const max = computed(() => first.value.endOf('month').add(EDGE_DAYS, 'day').format('YYYY-MM-DD'))

const error = computed(() => {
	if (!start.value) return ''
	if (start.value < min.value || start.value > max.value) return 'Tanggal harus dalam bulan periode atau 7 hari sebelum/sesudahnya'
	return ''
})

const GAP = 6
const rangeLabel = computed(() => {
	const f = (d: string) => dayjs(d).format('DD/MM')
	return end.value && end.value !== start.value ? `${f(start.value)} – ${f(end.value)}` : f(start.value)
})

watch(
	() => props.open,
	async (isOpen) => {
		if (!isOpen || !props.week) return
		start.value = props.week.slots[props.slot - 1] ?? ''
		end.value = props.week.ends[props.slot - 1] || start.value // a one-day column reads as from = to in the range calendar
		pos.value = { top: -9999, left: -9999 }
		await nextTick()
		place()
		// open the native calendar right away; browsers without showPicker just get the focused field
		const input = startInput.value?.$el
		input?.focus()
		try {
			input?.showPicker?.()
		} catch {
			/* needs a user gesture in some browsers; the focused field is enough */
		}
	}
)

function place() {
	const a = props.anchor
	const el = card.value
	if (!a || !el) return
	const { offsetWidth: w, offsetHeight: h } = el
	const flip = a.bottom + GAP + h > window.innerHeight && a.top - GAP - h > 0
	pos.value = {
		left: Math.min(Math.max(8, a.left + a.width / 2 - w / 2), window.innerWidth - w - 8),
		top: flip ? a.top - GAP - h : a.bottom + GAP
	}
}

function apply() {
	if (props.saving || !start.value || error.value) return
	emit('apply', { start: start.value, end: isRange.value && end.value !== start.value ? end.value : '' })
}
// Single date: committing it (picked in the calendar, or typed and left) is the whole action. `change`, not `input`, so a date typed
// digit by digit is not applied half-way.
function onCommit() {
	if (!isRange.value) apply()
}

function onDocDown(e: Event) {
	if (props.open && !card.value?.contains(e.target as Node)) emit('close')
}
function onKey(e: KeyboardEvent) {
	if (props.open && e.key === 'Escape') emit('close')
}
document.addEventListener('pointerdown', onDocDown)
document.addEventListener('keydown', onKey)
window.addEventListener('scroll', onScroll, true)
function onScroll(e: Event) {
	if (props.open && !card.value?.contains(e.target as Node)) emit('close')
}
onBeforeUnmount(() => {
	document.removeEventListener('pointerdown', onDocDown)
	document.removeEventListener('keydown', onKey)
	window.removeEventListener('scroll', onScroll, true)
})
</script>

<template>
	<Teleport to="body">
		<div
			v-if="open"
			ref="card"
			role="dialog"
			:aria-label="`Tanggal kolom ${slot} minggu ${week?.week_no ?? ''}`"
			class="fixed z-[60] rounded-md bg-panel p-3 shadow-overlay"
			:class="isRange ? 'w-[280px]' : 'w-64'"
			:style="{ top: `${pos.top}px`, left: `${pos.left}px` }"
		>
			<div class="mb-2 flex items-center justify-between gap-2">
				<p class="text-s font-medium text-ink">
					Kolom {{ slot }} · Minggu {{ week?.week_no ?? '' }}<template v-if="isRange && start"> · {{ rangeLabel }}</template>
				</p>
				<button type="button" aria-label="Tutup" class="rounded p-0.5 text-ink-subtle hover:bg-fill hover:text-ink" @click="emit('close')">
					<IconX class="h-4 w-4" />
				</button>
			</div>
			<DateRangePicker
				v-if="isRange"
				inline
				:presets="false"
				:min="min"
				:max="max"
				:max-days="RANGE_MAX_DAYS"
				:initial-month="first.format('YYYY-MM-DD')"
				:disabled="saving"
				v-model:from="start"
				v-model:to="end"
			/>
			<div v-else class="space-y-2">
				<DatePicker ref="startInput" v-model="start" :min="min" :max="max" :disabled="saving" @change="onCommit" />
				<p v-if="error" class="text-s text-danger">{{ error }}</p>
			</div>
			<div v-if="filled || isRange" class="mt-3 flex items-center justify-between gap-2">
				<Button v-if="filled" variant="subtle" size="sm" :loading="saving" class="text-danger" @click="emit('clear')"
					><IconTrash class="h-4 w-4" /> Kosongkan</Button
				>
				<span v-else />
				<Button v-if="isRange" size="sm" :loading="saving" :disabled="!start || !!error" @click="apply"
					><IconCheck class="h-4 w-4" /> Terapkan</Button
				>
			</div>
		</div>
	</Teleport>
</template>
