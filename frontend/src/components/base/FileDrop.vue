<script setup lang="ts">
// Single-file picker with drag & drop. v-model = the picked File; the parent validates it and shows the message via `error`.
import { ref } from 'vue'
import { IconCloudUpload, IconFile, IconX } from '@tabler/icons-vue'

defineProps<{ modelValue?: File; accept?: string; hint?: string; error?: string }>()
const emit = defineEmits<{ 'update:modelValue': [File | undefined] }>()

const input = ref<HTMLInputElement>()
const over = ref(false)

function onChange(event: Event) {
	const el = event.target as HTMLInputElement
	emit('update:modelValue', el.files?.[0])
	el.value = '' // allow picking the same file again after removing it
}
function onDrop(event: DragEvent) {
	over.value = false
	const file = event.dataTransfer?.files?.[0]
	if (file) emit('update:modelValue', file)
}
const size = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)
</script>

<template>
	<div>
		<input ref="input" type="file" :accept="accept" class="hidden" @change="onChange" />
		<div v-if="modelValue" class="flex items-center gap-3 rounded-md border border-ink-subtle/30 bg-panel px-3 py-2.5">
			<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><IconFile class="h-5 w-5" /></span>
			<div class="min-w-0 flex-1">
				<p class="truncate text-m text-ink">{{ modelValue.name }}</p>
				<p class="text-s text-ink-muted">{{ size(modelValue.size) }}</p>
			</div>
			<button
				type="button"
				class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-fill hover:text-ink"
				title="Hapus file"
				@click="emit('update:modelValue', undefined)"
			>
				<IconX class="h-4 w-4" />
			</button>
		</div>
		<div
			v-else
			role="button"
			tabindex="0"
			class="flex cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors"
			:class="over ? 'border-primary bg-primary/5' : error ? 'border-danger/50 bg-danger-soft/30' : 'border-ink-subtle/30 bg-fill/40 hover:bg-fill'"
			@click="input?.click()"
			@keydown.enter.prevent="input?.click()"
			@keydown.space.prevent="input?.click()"
			@dragover.prevent="over = true"
			@dragleave="over = false"
			@drop.prevent="onDrop"
		>
			<IconCloudUpload class="h-8 w-8 text-ink-subtle" />
			<p class="text-m text-ink">Tarik file ke sini atau <span class="font-medium text-primary-dark">pilih dari komputer</span></p>
			<p v-if="hint" class="text-s text-ink-muted">{{ hint }}</p>
		</div>
	</div>
</template>
