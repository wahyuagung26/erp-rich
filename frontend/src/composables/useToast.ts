import { useToastStore } from '@/stores/toast'
import type { ToastKind } from '@/stores/toast'

export function useToast() {
	const store = useToastStore()
	const toast = (kind: ToastKind, message: string) => store.push(kind, message)
	return {
		toast,
		success: (m: string) => store.push('success', m),
		error: (m: string) => store.push('danger', m),
		warning: (m: string) => store.push('warning', m),
		info: (m: string) => store.push('info', m)
	}
}
