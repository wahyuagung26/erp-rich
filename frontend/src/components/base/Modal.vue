<script setup lang="ts">
import { watch } from 'vue'
import { IconX } from '@tabler/icons-vue'

const props = withDefaults(defineProps<{ open: boolean; title?: string; size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })
const emit = defineEmits<{ close: [] }>()

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

// lock scroll while open
watch(
	() => props.open,
	(v) => {
		document.body.style.overflow = v ? 'hidden' : ''
	}
)

function onKey(e: KeyboardEvent) {
	if (e.key === 'Escape') emit('close')
}
</script>

<template>
	<Teleport to="body">
		<Transition name="modal">
			<div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 pt-[10vh]" @keydown="onKey">
				<div class="absolute inset-0" @click="emit('close')" />
				<div :class="['relative w-full rounded-md bg-panel shadow-overlay', widths[size]]" role="dialog">
					<header v-if="title" class="flex items-center justify-between px-4 py-3">
						<h2 class="text-heading-s font-semibold text-ink">{{ title }}</h2>
						<button class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill" @click="emit('close')">
							<IconX class="h-4 w-4" />
						</button>
					</header>
					<div class="px-4 pb-4" :class="{ 'pt-1': title, 'pt-4': !title }">
						<slot />
					</div>
					<footer v-if="$slots.footer" class="flex justify-end gap-2 px-4 pb-4">
						<slot name="footer" />
					</footer>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
	transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
	opacity: 0;
}
</style>
