import { defineStore } from 'pinia'

export type ToastKind = 'success' | 'danger' | 'warning' | 'info'

export interface Toast {
	id: number
	kind: ToastKind
	message: string
}

let seq = 0

export const useToastStore = defineStore('toast', {
	state: () => ({ items: [] as Toast[] }),
	actions: {
		push(kind: ToastKind, message: string) {
			const id = ++seq
			this.items.push({ id, kind, message })
			setTimeout(() => this.dismiss(id), 3500)
		},
		dismiss(id: number) {
			this.items = this.items.filter((t) => t.id !== id)
		}
	}
})
