<script setup lang="ts">
import { computed, ref, nextTick, watch, onBeforeUnmount } from 'vue'
import { IconHelpCircle, IconX } from '@tabler/icons-vue'

// Click-to-open info popover: a light card with an optional `title`, a `text` body and labelled bullet `sections`.
// Closed by its X, Escape, a click outside, or scrolling. Teleported to <body> and `fixed` so a table/modal's overflow never
// clips it (same approach as RowActions). `text` alone still works — FormField's `help` uses exactly that.
// More than one point (a `text` array, a section's items) always renders as a numbered <ol> (owner rule 2026-11-15).
//   <HelpTip title="Delivered: pekerjaan selesai" :text="['…', '…']" :sections="[{ label: 'Sumber data', items: ['…', '…'] }]" />
const props = defineProps<{ text?: string | string[]; title?: string; sections?: { label: string; items: string[] }[] }>()
const points = computed(() => (Array.isArray(props.text) ? props.text : [props.text]).filter((t): t is string => !!t))

const GAP = 8 // px between the trigger and the card, and the minimum distance to the viewport edge
const open = ref(false)
const trigger = ref<HTMLElement>()
const card = ref<HTMLElement>()
const pos = ref({ top: -9999, left: -9999 }) // off-screen until measured, so the card never flashes at 0,0

async function toggle() {
	if (open.value) return close()
	const r = trigger.value!.getBoundingClientRect()
	pos.value = { top: -9999, left: -9999 }
	open.value = true
	await nextTick()
	const { offsetWidth: w, offsetHeight: h } = card.value!
	const flip = r.bottom + GAP + h > window.innerHeight && r.top - GAP - h > 0 // open upward near the viewport bottom
	pos.value = { left: Math.min(Math.max(GAP, r.left - GAP), window.innerWidth - w - GAP), top: flip ? r.top - GAP - h : r.bottom + GAP }
}
function close() {
	open.value = false
}

function onDocDown(e: Event) {
	const t = e.target as Node
	if (!trigger.value?.contains(t) && !card.value?.contains(t)) close()
}
function onKey(e: KeyboardEvent) {
	if (e.key !== 'Escape') return
	close()
	trigger.value?.focus()
}
watch(open, (isOpen) => {
	const op = isOpen ? 'addEventListener' : 'removeEventListener'
	document[op]('pointerdown', onDocDown)
	document[op]('keydown', onKey as EventListener)
	window[op]('scroll', close, true) // a fixed card would drift away from its trigger
	window[op]('resize', close)
})
onBeforeUnmount(() => (open.value = false))
</script>

<template>
	<span class="inline-flex">
		<button
			ref="trigger"
			type="button"
			aria-label="Bantuan"
			aria-haspopup="dialog"
			:aria-expanded="open"
			class="flex rounded-full text-ink-subtle hover:text-ink-muted"
			:class="{ 'text-ink-muted': open }"
			@click.stop="toggle"
		>
			<IconHelpCircle class="h-4 w-4" />
		</button>
		<Teleport to="body">
			<div
				v-if="open"
				ref="card"
				role="dialog"
				:aria-label="title ?? 'Bantuan'"
				class="fixed z-[60] w-max min-w-[220px] rounded-md bg-panel p-4 text-left shadow-overlay"
				:style="{ top: pos.top + 'px', left: pos.left + 'px', maxWidth: 'min(360px, calc(100vw - 16px))' }"
			>
				<button
					type="button"
					aria-label="Tutup"
					class="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-md text-ink-muted hover:bg-fill"
					@click="close"
				>
					<IconX class="h-4 w-4" />
				</button>
				<h4 v-if="title" class="pr-7 text-m font-semibold text-ink">{{ title }}</h4>
				<ol v-if="points.length > 1" class="list-decimal space-y-1 pl-5 text-m text-ink" :class="title ? 'mt-2' : 'pr-7'">
					<li v-for="point in points" :key="point">{{ point }}</li>
				</ol>
				<p v-else-if="points.length" class="text-m text-ink" :class="title ? 'mt-2' : 'pr-7'">{{ points[0] }}</p>
				<div v-for="s in sections" :key="s.label" class="mt-3 border-t border-hairline pt-3">
					<p class="text-xs font-medium uppercase tracking-wide text-ink-subtle">{{ s.label }}</p>
					<ol v-if="s.items.length > 1" class="mt-1.5 list-decimal space-y-1 pl-5 text-m text-ink">
						<li v-for="item in s.items" :key="item">{{ item }}</li>
					</ol>
					<p v-else class="mt-1.5 text-m text-ink">{{ s.items[0] }}</p>
				</div>
			</div>
		</Teleport>
	</span>
</template>
