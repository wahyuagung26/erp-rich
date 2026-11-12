import { defineStore } from 'pinia'
import { useToastStore } from '@/stores/toast'
import { errorMessage } from '@/utils/errorMessage'

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
			} catch (err) {
				// A failed confirm action (e.g. delete) must tell the user why — then close so a stale dialog can't be retried
				useToastStore().push('danger', errorMessage(err))
			} finally {
				this.closeConfirm()
				this.confirmLoading = false
			}
		},
		closeConfirm() {
			this.confirmOpen = false
			this.onConfirm = null
		}
	}
})
