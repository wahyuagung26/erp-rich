<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { IconAlertTriangle } from '@tabler/icons-vue'
import Modal from './Modal.vue'
import Button from './Button.vue'
import { useModalStore } from '@/stores/modal'

// Mounted once in DefaultLayout. Driven entirely by the modal store.
const store = useModalStore()
const { confirmOpen, confirmOptions, confirmLoading } = storeToRefs(store)
</script>

<template>
	<Modal :open="confirmOpen" size="sm" @close="store.closeConfirm()">
		<div class="flex gap-3">
			<span
				class="grid h-9 w-9 shrink-0 place-items-center rounded-full"
				:class="confirmOptions.type === 'danger' ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning'"
			>
				<IconAlertTriangle class="h-5 w-5" />
			</span>
			<div>
				<h3 class="text-m font-semibold text-ink">{{ confirmOptions.title ?? 'Konfirmasi' }}</h3>
				<p class="mt-1 text-m text-ink-muted">{{ confirmOptions.message }}</p>
			</div>
		</div>
		<template #footer>
			<Button variant="secondary" size="sm" @click="store.closeConfirm()">{{ confirmOptions.cancelText }}</Button>
			<Button :variant="confirmOptions.type === 'danger' ? 'danger' : 'primary'" size="sm" :loading="confirmLoading" @click="store.runConfirm()">
				{{ confirmOptions.confirmText }}
			</Button>
		</template>
	</Modal>
</template>
