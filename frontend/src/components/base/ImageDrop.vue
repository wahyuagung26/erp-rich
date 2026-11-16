<script setup lang="ts">
// Square image tile: click or drop a picture (emits `pick` with the File; the parent validates and stores it),
// shows the current `src` with Ganti / Hapus. Compact sibling of FileDrop for product photos, logos.
import { ref } from 'vue'
import { IconPhotoPlus, IconRefresh, IconTrash } from '@tabler/icons-vue'

withDefaults(defineProps<{ src?: string; accept?: string; alt?: string; size?: number; label?: string }>(), {
	accept: 'image/*',
	alt: 'Gambar',
	size: 120,
	label: 'Unggah foto'
})
const emit = defineEmits<{ pick: [File]; remove: [] }>()

const input = ref<HTMLInputElement>()
const over = ref(false)

function onChange(event: Event) {
	const el = event.target as HTMLInputElement
	const file = el.files?.[0]
	if (file) emit('pick', file)
	el.value = '' // allow picking the same file again
}
function onDrop(event: DragEvent) {
	over.value = false
	const file = event.dataTransfer?.files?.[0]
	if (file) emit('pick', file)
}
</script>

<template>
	<div
		class="group relative shrink-0 overflow-hidden rounded-md"
		:style="{ width: size + 'px', height: size + 'px' }"
		@dragover.prevent="over = true"
		@dragleave="over = false"
		@drop.prevent="onDrop"
	>
		<input ref="input" type="file" :accept="accept" class="hidden" @change="onChange" />
		<template v-if="src">
			<img :src="src" :alt="alt" class="h-full w-full bg-fill object-contain" />
			<!-- Actions show on hover / keyboard focus, and always while a file is dragged over. -->
			<div
				class="absolute inset-x-0 bottom-0 flex justify-around bg-black/45 px-0.5 py-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
				:class="{ 'opacity-100': over }"
			>
				<button type="button" class="flex items-center gap-0.5 rounded px-1 py-0.5 text-xs text-white hover:bg-white/20" @click="input?.click()">
					<IconRefresh class="h-3.5 w-3.5" /> Ganti
				</button>
				<button type="button" class="flex items-center gap-0.5 rounded px-1 py-0.5 text-xs text-white hover:bg-white/20" @click="emit('remove')">
					<IconTrash class="h-3.5 w-3.5" /> Hapus
				</button>
			</div>
		</template>
		<button
			v-else
			type="button"
			class="flex h-full w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-ink-muted transition-colors"
			:class="over ? 'border-primary bg-primary/5 text-primary-dark' : 'border-ink-subtle/30 bg-fill/40 hover:bg-fill hover:text-ink'"
			@click="input?.click()"
		>
			<IconPhotoPlus class="h-7 w-7" />
			<span class="text-s font-medium">{{ label }}</span>
		</button>
	</div>
</template>
