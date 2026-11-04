import { onBeforeUnmount, ref } from 'vue'

// True below Tailwind `sm` (640px). A page renders ONE variant on it (v-if / v-else), never both with one hidden by CSS.
export function useIsMobile(query = '(max-width: 639px)') {
	const mq = window.matchMedia(query)
	const mobile = ref(mq.matches)
	const sync = () => (mobile.value = mq.matches)
	mq.addEventListener('change', sync)
	onBeforeUnmount(() => mq.removeEventListener('change', sync))
	return mobile
}
