<script setup lang="ts">
// Date range with a popover calendar + presets. Dates are 'YYYY-MM-DD' strings.
// Two v-models: <DateRangePicker v-model:from="a" v-model:to="b" @change="refetch" />
// Click a day to start, click another to finish (order doesn't matter); presets apply at once.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/id'
import { IconCalendar, IconChevronDown, IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'

// Optional third v-model for pages that filter by one of several dates ("Tanggal Invoice" / "Jatuh Tempo"):
// <DateRangePicker v-model:from v-model:to v-model:field="dateField" :field-options="dateFieldOptions" @change="refetch" />
// Changing the field also emits `change`, so one handler refetches for both.
const props = defineProps<{ from?: string; to?: string; disabled?: boolean; field?: string; fieldOptions?: { label: string; value: string }[] }>()
const emit = defineEmits<{ 'update:from': [string]; 'update:to': [string]; 'update:field': [string]; change: [] }>()

function onField(value: string) {
	emit('update:field', value)
	emit('change')
}

const FMT = 'YYYY-MM-DD'
const root = ref<HTMLElement>()
const open = ref(false)
const month = ref(dayjs().startOf('month')) // month shown in the calendar
const anchor = ref<string>() // first click of an in-progress range
const hover = ref<string>()

const label = computed(() => {
	if (!props.from && !props.to) return ''
	const f = (d?: string) => (d ? dayjs(d).locale('id').format('DD MMM YYYY') : '…')
	return `${f(props.from)} – ${f(props.to)}`
})

// Monday-first 6x7 grid covering the shown month.
const days = computed(() => {
	const start = month.value.startOf('month')
	const offset = (start.day() + 6) % 7
	return Array.from({ length: 42 }, (_, i) => start.subtract(offset, 'day').add(i, 'day'))
})

// While picking, the range is anchor↔hover; otherwise it is the committed from↔to.
const range = computed<[string, string] | null>(() => {
	if (anchor.value) {
		const b = hover.value ?? anchor.value
		return anchor.value <= b ? [anchor.value, b] : [b, anchor.value]
	}
	return props.from && props.to ? [props.from, props.to] : null
})

function state(d: Dayjs) {
	const s = d.format(FMT)
	const r = range.value
	return {
		edge: !!r && (s === r[0] || s === r[1]),
		between: !!r && s > r[0] && s < r[1],
		outside: d.month() !== month.value.month(),
		today: s === dayjs().format(FMT)
	}
}

function commit(from: string, to: string) {
	emit('update:from', from)
	emit('update:to', to)
	emit('change')
	anchor.value = hover.value = undefined
	open.value = false
}

function pick(d: Dayjs) {
	const s = d.format(FMT)
	if (!anchor.value) {
		anchor.value = s
		return
	}
	commit(...((anchor.value <= s ? [anchor.value, s] : [s, anchor.value]) as [string, string]))
}

const presets = [
	{ label: 'Hari ini', get: () => [dayjs(), dayjs()] },
	{ label: '7 hari terakhir', get: () => [dayjs().subtract(6, 'day'), dayjs()] },
	{ label: '30 hari terakhir', get: () => [dayjs().subtract(29, 'day'), dayjs()] },
	{ label: 'Bulan ini', get: () => [dayjs().startOf('month'), dayjs().endOf('month')] },
	{ label: 'Bulan lalu', get: () => [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] }
]
function applyPreset(get: () => Dayjs[]) {
	const [a, b] = get()
	commit(a.format(FMT), b.format(FMT))
}

function toggle() {
	if (props.disabled) return
	open.value = !open.value
}

// Reopen on the selected range's month; drop any half-finished pick.
watch(open, (v) => {
	anchor.value = hover.value = undefined
	if (v) month.value = dayjs(props.from || undefined).startOf('month')
	document[v ? 'addEventListener' : 'removeEventListener']('mousedown', onDocDown)
	document[v ? 'addEventListener' : 'removeEventListener']('keydown', onKey)
})
function onDocDown(e: Event) {
	if (!root.value?.contains(e.target as Node)) open.value = false
}
function onKey(e: Event) {
	if ((e as KeyboardEvent).key === 'Escape') open.value = false
}
onBeforeUnmount(() => {
	document.removeEventListener('mousedown', onDocDown)
	document.removeEventListener('keydown', onKey)
})
</script>

<template>
	<div ref="root" class="relative w-full sm:w-auto">
		<!-- one bordered box: with `fieldOptions` the "which date" select sits left of the range, so the two read as a single filter -->
		<div
			class="flex h-[38px] w-full items-stretch rounded-md border border-ink-subtle/30 bg-panel text-m text-ink"
			:class="[fieldOptions ? 'sm:w-[440px]' : 'sm:w-[280px]', disabled && 'bg-fill opacity-50']"
		>
			<div v-if="fieldOptions" class="relative w-36 shrink-0 border-r border-hairline">
				<select
					:value="field"
					:disabled="disabled"
					aria-label="Tanggal berdasarkan"
					class="h-full w-full appearance-none rounded-l-md bg-transparent pl-3 pr-7 text-m text-ink"
					@change="onField(($event.target as HTMLSelectElement).value)"
				>
					<option v-for="opt in fieldOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
				</select>
				<IconChevronDown class="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
			</div>
			<button type="button" :disabled="disabled" class="flex min-w-0 flex-1 items-center gap-2 px-3 text-left" @click="toggle">
				<IconCalendar class="h-4 w-4 shrink-0 text-ink-subtle" />
				<span class="tnum truncate" :class="{ 'text-ink-subtle': !label }">{{ label || 'Pilih rentang tanggal' }}</span>
			</button>
		</div>

		<div
			v-if="open"
			class="absolute left-0 top-full z-30 mt-1 flex max-w-[calc(100vw-2rem)] flex-col rounded-md bg-panel p-3 shadow-overlay sm:flex-row sm:gap-4"
		>
			<ul class="mb-3 flex shrink-0 flex-wrap gap-1 sm:mb-0 sm:w-36 sm:flex-col">
				<li v-for="p in presets" :key="p.label">
					<button type="button" class="w-full rounded-md px-2 py-1.5 text-left text-m text-ink hover:bg-fill" @click="applyPreset(p.get)">
						{{ p.label }}
					</button>
				</li>
				<li>
					<button type="button" class="w-full rounded-md px-2 py-1.5 text-left text-m text-ink-muted hover:bg-fill" @click="commit('', '')">
						Reset
					</button>
				</li>
			</ul>

			<div class="w-[252px] shrink-0 self-center sm:self-start" @mouseleave="hover = undefined">
				<div class="mb-2 flex items-center justify-between">
					<button
						type="button"
						class="rounded-md p-1 text-ink-muted hover:bg-fill"
						aria-label="Bulan sebelumnya"
						@click="month = month.subtract(1, 'month')"
					>
						<IconChevronLeft class="h-4 w-4" />
					</button>
					<span class="text-m font-semibold text-ink">{{ month.locale('id').format('MMMM YYYY') }}</span>
					<button
						type="button"
						class="rounded-md p-1 text-ink-muted hover:bg-fill"
						aria-label="Bulan berikutnya"
						@click="month = month.add(1, 'month')"
					>
						<IconChevronRight class="h-4 w-4" />
					</button>
				</div>
				<div class="grid grid-cols-7 text-center text-xs text-ink-subtle">
					<span v-for="d in ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']" :key="d" class="py-1">{{ d }}</span>
				</div>
				<div class="grid grid-cols-7">
					<button
						v-for="d in days"
						:key="d.format(FMT)"
						type="button"
						class="tnum h-9 text-m"
						:class="[
							state(d).edge ? 'rounded-md bg-primary text-white' : state(d).between ? 'bg-primary/10 text-ink' : 'rounded-md hover:bg-fill',
							!state(d).edge && state(d).outside ? 'text-ink-subtle/60' : '',
							!state(d).edge && !state(d).between && !state(d).outside ? 'text-ink' : '',
							state(d).today && !state(d).edge ? 'font-semibold text-primary' : ''
						]"
						@click="pick(d)"
						@mouseenter="anchor && (hover = d.format(FMT))"
					>
						{{ d.date() }}
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
