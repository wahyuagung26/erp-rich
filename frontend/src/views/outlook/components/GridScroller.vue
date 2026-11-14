<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { IconArrowsHorizontal, IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'
import Tabs from '@/components/base/Tabs.vue'
import Button from '@/components/base/Button.vue'

// Horizontal scroller for the wide Outlook grids + the "Gulir ke" bar (jump to a week block, step week by week).
// Week header cells must carry data-wn; `frozen` = total width of the sticky left columns (a jump aligns the week right after them).
const props = defineProps<{ weeks: number[]; frozen: number }>()

const box = ref<HTMLElement>()
const active = ref('0')
const tabs = computed(() => [{ label: 'Awal', value: '0' }, ...props.weeks.map((w) => ({ label: `Minggu ${w}`, value: String(w) }))])

const lefts = () =>
	props.weeks.map((w) => {
		const th = box.value?.querySelector<HTMLElement>(`th[data-wn="${w}"]`)
		if (!th || !box.value) return 0
		return Math.max(0, Math.round(th.getBoundingClientRect().left - box.value.getBoundingClientRect().left + box.value.scrollLeft - props.frozen))
	})

function scrollTo(left: number) {
	box.value?.scrollTo({ left: Math.max(0, Math.round(left)), behavior: 'smooth' })
}
function jump(v: string) {
	active.value = v
	scrollTo(v === '0' ? 0 : (lefts()[props.weeks.indexOf(Number(v))] ?? 0))
}
// Arrows hop to the previous/next week block (from mid-week, back goes to that week's start first).
function step(dir: 1 | -1) {
	const pos = box.value?.scrollLeft ?? 0
	const l = lefts()
	const target = dir > 0 ? l.find((x) => x > pos + 4) : [...l].reverse().find((x) => x < pos - 4)
	scrollTo(target ?? (dir > 0 ? (box.value?.scrollWidth ?? 0) : 0))
}
function mark() {
	const el = box.value
	if (!el) return
	const l = lefts()
	let now = '0'
	l.forEach((x, i) => {
		if (x <= el.scrollLeft + 4 && el.scrollLeft > 4) now = String(props.weeks[i])
	})
	if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 && props.weeks.length) now = String(props.weeks[props.weeks.length - 1])
	active.value = now
}

onMounted(() => nextTick(mark))
watch(() => props.weeks.join(), () => nextTick(mark))
</script>

<template>
	<div>
		<div class="mb-2 flex flex-wrap items-center gap-2">
			<span class="inline-flex items-center gap-1 text-s text-ink-muted"><IconArrowsHorizontal class="h-4 w-4" /> Gulir ke</span>
			<Tabs :model-value="active" :tabs="tabs" variant="pill" @update:model-value="jump" />
			<Button variant="outline" size="sm" aria-label="Geser ke minggu sebelumnya" @click="step(-1)"><IconChevronLeft class="h-4 w-4" /></Button>
			<Button variant="outline" size="sm" aria-label="Geser ke minggu berikutnya" @click="step(1)"><IconChevronRight class="h-4 w-4" /></Button>
			<span class="text-s text-ink-subtle">atau geser scrollbar di bawah tabel, atau tahan Shift sambil memutar roda mouse</span>
		</div>
		<div ref="box" class="outlook-scroll max-h-[72vh] overflow-auto rounded-md" @scroll.passive="mark">
			<slot />
		</div>
	</div>
</template>

<style scoped>
/* keep the scrollbar visible (macOS hides it until you scroll, so people think the grid cannot scroll) */
.outlook-scroll::-webkit-scrollbar {
	height: 14px;
	width: 14px;
}
.outlook-scroll::-webkit-scrollbar-track {
	background: rgb(var(--c-fill));
}
.outlook-scroll::-webkit-scrollbar-thumb {
	background: rgb(var(--c-ink-subtle));
	border-radius: 7px;
	border: 3px solid rgb(var(--c-fill));
}
</style>
