import { defineStore } from 'pinia'

export type ConfirmType = 'warning' | 'danger' | 'info'

interface ConfirmOptions {
	title?: string
	message?: string
	type?: ConfirmType
	confirmText?: string
	cancelText?: string
}

// Deferred-callback confirm dialog (RICH modal-store pattern):
//   openModalConfirm({ ... }); handleConfirm(async () => { ... })
export const useModalStore = defineStore('modal', {
	state: () => ({
		confirmOpen: false,
		confirmOptions: {} as ConfirmOptions,
		confirmLoading: false,
		onConfirm: null as null | (() => unknown | Promise<unknown>)
	}),
	actions: {
		openConfirm(options: ConfirmOptions) {
			this.confirmOptions = { type: 'warning', confirmText: 'Ya', cancelText: 'Batal', ...options }
			this.confirmOpen = true
		},
		handleConfirm(cb: () => unknown | Promise<unknown>) {
			this.onConfirm = cb
		},
		async runConfirm() {
			if (!this.onConfirm) return this.closeConfirm()
			this.confirmLoading = true
			try {
				await this.onConfirm()
				this.closeConfirm()
			} finally {
				this.confirmLoading = false
			}
		},
		closeConfirm() {
			this.confirmOpen = false
			this.onConfirm = null
		}
	}
})
