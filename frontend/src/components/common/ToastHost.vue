<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-vue'
import { useToastStore } from '@/stores/toast'

const store = useToastStore()
const { items } = storeToRefs(store)

const icons = { success: IconCheck, danger: IconX, warning: IconAlertTriangle, info: IconInfoCircle }
const tones = {
	success: 'text-success',
	danger: 'text-danger',
	warning: 'text-warning',
	info: 'text-info'
}
</script>

<template>
	<Teleport to="body">
		<div class="fixed right-4 top-4 z-[60] flex w-72 flex-col-reverse gap-2">
			<TransitionGroup name="toast">
				<div v-for="t in items" :key="t.id" class="flex items-start gap-2 rounded-md bg-panel p-3 text-m shadow-overlay" @click="store.dismiss(t.id)">
					<component :is="icons[t.kind]" class="mt-0.5 h-4 w-4 shrink-0" :class="tones[t.kind]" />
					<span class="text-ink">{{ t.message }}</span>
				</div>
			</TransitionGroup>
		</div>
	</Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
	transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
	opacity: 0;
	transform: translateX(1rem);
}
</style>
