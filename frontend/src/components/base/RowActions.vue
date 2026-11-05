<script setup lang="ts">
import { ref, nextTick, watch, onBeforeUnmount, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { IconDotsVertical, IconEye, IconPencil, IconTrash } from '@tabler/icons-vue'

// Row action menu for list tables: one kebab button instead of a column of icons, so the
// action column stays one icon wide however many actions a row has. The menu is teleported to
// <body> and positioned with `fixed` because <Table> clips overflow (overflow-x-auto).
// Routes follow the module convention: `${base}/${id}` (detail) and `${base}/edit/${id}`.
// Extra items go between Edit and Hapus (shown even when `canModify` is false): `:actions="[{ label: 'Setujui', icon: IconCheck, onClick: () => approve(row) }]"`.
// `hidden` drops an item per row (e.g. by status); `danger` tints it red like Hapus.
interface RowAction {
	label: string
	icon?: Component
	onClick: () => void
	danger?: boolean
	hidden?: boolean
}
const props = withDefaults(defineProps<{ base: string; id: number | string; canModify?: boolean; actions?: RowAction[] }>(), {
	canModify: true,
	actions: () => []
})
const emit = defineEmits<{ remove: [] }>()

const router = useRouter()
const open = ref(false)
const trigger = ref<HTMLElement>()
const menu = ref<HTMLElement>()
const pos = ref({ top: 0, left: 0 })

async function toggle() {
	if (open.value) return close()
	const r = trigger.value!.getBoundingClientRect()
	open.value = true
	await nextTick()
	const { offsetWidth: w, offsetHeight: h } = menu.value!
	const flip = r.bottom + 4 + h > window.innerHeight // open upward near the viewport bottom
	pos.value = { left: Math.max(8, r.right - w), top: flip ? r.top - h - 4 : r.bottom + 4 }
}
function close() {
	open.value = false
}
function go(path: string) {
	close()
	router.push(path)
}
function run(fn: () => void) {
	close()
	fn()
}
function remove() {
	close()
	emit('remove')
}

function onDocDown(e: Event) {
	const t = e.target as Node
	if (!trigger.value?.contains(t) && !menu.value?.contains(t)) close()
}
function onKey(e: KeyboardEvent) {
	if (e.key === 'Escape') close()
}
watch(open, (isOpen) => {
	const op = isOpen ? 'addEventListener' : 'removeEventListener'
	document[op]('mousedown', onDocDown)
	document[op]('keydown', onKey as EventListener)
	window[op]('scroll', close, true) // a fixed menu would drift away from its row
	window[op]('resize', close)
})
onBeforeUnmount(() => (open.value = false))

const item = 'flex w-full items-center gap-2.5 px-3 py-2 text-left text-m hover:bg-fill'
</script>

<template>
	<div class="flex justify-end">
		<button
			ref="trigger"
			type="button"
			title="Aksi"
			aria-label="Aksi"
			aria-haspopup="menu"
			:aria-expanded="open"
			class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
			:class="{ 'bg-fill text-ink': open }"
			@click="toggle"
		>
			<IconDotsVertical class="h-4 w-4" />
		</button>
		<Teleport to="body">
			<div
				v-if="open"
				ref="menu"
				role="menu"
				class="fixed z-50 min-w-[160px] rounded-md bg-panel py-1 shadow-overlay"
				:style="{ top: pos.top + 'px', left: pos.left + 'px' }"
			>
				<button type="button" role="menuitem" :class="[item, 'text-ink']" @click="go(`${props.base}/${props.id}`)">
					<IconEye class="h-4 w-4 text-ink-muted" /> Detail
				</button>
				<button v-if="canModify" type="button" role="menuitem" :class="[item, 'text-ink']" @click="go(`${props.base}/edit/${props.id}`)">
					<IconPencil class="h-4 w-4 text-ink-muted" /> Edit
				</button>
				<template v-for="a in actions.filter((x) => !x.hidden)" :key="a.label">
					<button type="button" role="menuitem" :class="[item, a.danger ? 'text-danger hover:bg-danger-soft' : 'text-ink']" @click="run(a.onClick)">
						<component :is="a.icon" v-if="a.icon" :class="['h-4 w-4', !a.danger && 'text-ink-muted']" /> {{ a.label }}
					</button>
				</template>
				<button v-if="canModify" type="button" role="menuitem" :class="[item, 'text-danger hover:bg-danger-soft']" @click="remove">
					<IconTrash class="h-4 w-4" /> Hapus
				</button>
			</div>
		</Teleport>
	</div>
</template>
