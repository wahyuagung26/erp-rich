import { useModalStore } from '@/stores/modal'

// useConfirm().ask({ title, message }, async () => { ...run on confirm... })
export function useConfirm() {
	const store = useModalStore()
	return {
		ask(options: Parameters<typeof store.openConfirm>[0], onConfirm: () => unknown | Promise<unknown>) {
			store.openConfirm(options)
			store.handleConfirm(onConfirm)
		}
	}
}
