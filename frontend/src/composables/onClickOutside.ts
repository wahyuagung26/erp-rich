import { onBeforeUnmount, onMounted, type Ref } from 'vue'

// Minimal click-outside. Fires `handler` on a pointerdown outside `el`.
export function onClickOutside(el: Ref<HTMLElement | undefined>, handler: () => void) {
	const listener = (e: PointerEvent) => {
		if (el.value && !el.value.contains(e.target as Node)) handler()
	}
	onMounted(() => document.addEventListener('pointerdown', listener))
	onBeforeUnmount(() => document.removeEventListener('pointerdown', listener))
}
