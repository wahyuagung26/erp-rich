<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { IconX } from '@tabler/icons-vue'

// Right-side panel over a scrim: close with X, Esc or a click on the scrim. Use for secondary controls (advanced filters),
// not for forms that need the user's full attention — those stay in a centered <Modal>.
const props = defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement>()

// Focus the panel on open so Esc works at once (keydown only reaches an element that holds focus).
watch(
	() => props.open,
	async (isOpen) => {
		document.body.style.overflow = isOpen ? 'hidden' : ''
		if (isOpen) {
			await nextTick()
			panel.value?.focus()
		}
	}
)
</script>

<template>
	<Teleport to="body">
		<Transition name="drawer">
			<div v-if="open" class="fixed inset-0 z-50 flex justify-end bg-ink/40" @keydown.esc="emit('close')">
				<div class="absolute inset-0" @click="emit('close')" />
				<aside
					ref="panel"
					tabindex="-1"
					role="dialog"
					class="relative flex h-full w-full max-w-sm flex-col bg-panel shadow-overlay focus:outline-none"
				>
					<header class="flex items-center justify-between px-4 py-3">
						<h2 class="text-heading-s font-semibold text-ink">{{ title }}</h2>
						<button
							type="button"
							aria-label="Tutup"
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
							@click="emit('close')"
						>
							<IconX class="h-4 w-4" />
						</button>
					</header>
					<div class="flex-1 overflow-y-auto px-4 py-2"><slot /></div>
					<footer v-if="$slots.footer" class="flex justify-end gap-2 px-4 py-3"><slot name="footer" /></footer>
				</aside>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
	transition: opacity 0.2s ease;
}
.drawer-enter-active aside,
.drawer-leave-active aside {
	transition: transform 0.2s ease;
}
.drawer-enter-from,
.drawer-leave-to {
	opacity: 0;
}
.drawer-enter-from aside,
.drawer-leave-to aside {
	transform: translateX(100%);
}
</style>
