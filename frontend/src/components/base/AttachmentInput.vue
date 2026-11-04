<script setup lang="ts">
// Multi-file attachment picker: PDF/JPG/PNG, max `maxSize` per file, up to `maxFiles` files.
// v-model is the list of picked files; the parent shows validation via <FormField :error>.
import { ref } from 'vue'
import { IconPaperclip, IconPlus } from '@tabler/icons-vue'
import { useToast } from '@/composables/useToast'
import Button from './Button.vue'
import type { JournalAttachment } from '@/utils/types'

const props = withDefaults(defineProps<{ modelValue: JournalAttachment[]; maxFiles?: number; maxSize?: number }>(), {
	maxFiles: 5,
	maxSize: 5 * 1024 * 1024
})
const emit = defineEmits<{ 'update:modelValue': [JournalAttachment[]] }>()

const toast = useToast()
const input = ref<HTMLInputElement>()
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

const readFile = (file: File) =>
	new Promise<JournalAttachment>((resolve, reject) => {
		const reader = new FileReader()
		// ponytail: keep prototype attachments as data URLs; switch to multipart upload when the backend exists.
		reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data_url: String(reader.result) })
		reader.onerror = () => reject(new Error(file.name))
		reader.readAsDataURL(file)
	})

async function onPick(event: Event) {
	const el = event.target as HTMLInputElement
	const picked = Array.from(el.files ?? [])
	el.value = '' // allow picking the same file again after removing it
	const next = [...props.modelValue]
	for (const file of picked) {
		if (next.length >= props.maxFiles) {
			toast.error(`Maksimal ${props.maxFiles} lampiran`)
			break
		}
		if (!ALLOWED_TYPES.includes(file.type)) {
			toast.error(`${file.name}: lampiran harus berupa PDF, JPG, atau PNG`)
			continue
		}
		if (file.size > props.maxSize) {
			toast.error(`${file.name}: ukuran maksimal ${props.maxSize / 1024 / 1024} MB`)
			continue
		}
		try {
			next.push(await readFile(file))
		} catch {
			toast.error(`${file.name}: lampiran tidak dapat dibaca`)
		}
	}
	emit('update:modelValue', next)
}
</script>

<template>
	<div class="space-y-1.5">
		<div
			v-for="(file, index) in modelValue"
			:key="file.name + index"
			class="flex items-center gap-2 rounded-md border border-ink-subtle/30 bg-panel px-3 py-2 text-m"
		>
			<IconPaperclip class="h-4 w-4 shrink-0 text-primary" />
			<span class="min-w-0 flex-1 truncate text-ink">{{ file.name }}</span>
			<button
				type="button"
				class="shrink-0 text-s text-danger hover:underline"
				@click="
					emit(
						'update:modelValue',
						modelValue.filter((_, i) => i !== index)
					)
				"
			>
				Hapus
			</button>
		</div>
		<input ref="input" type="file" multiple accept="application/pdf,image/jpeg,image/png" class="hidden" @change="onPick" />
		<Button v-if="modelValue.length < maxFiles" type="button" variant="outline" block class="!justify-start" @click="input?.click()">
			<IconPlus class="h-4 w-4" /> {{ modelValue.length ? 'Tambah file…' : 'Pilih file…' }}
		</Button>
	</div>
</template>
