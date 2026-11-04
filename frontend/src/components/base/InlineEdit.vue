<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { IconPencil, IconCheck } from '@tabler/icons-vue'
import Input from './Input.vue'
import MoneyInput from './MoneyInput.vue'

// Click-to-edit cell for tables where each value saves on its own (Harga Produk): shows the value
// with a pencil; click → input + ✓. Enter/✓ emits `save`, Esc/blur cancels. The value is only
// replaced when the parent updates `modelValue` (after its API call) — nothing is committed here.
// The default slot formats the read-only display (e.g. <Amount>). Not for form-submitted grids.
const props = withDefaults(defineProps<{ modelValue: number | string; kind?: 'money' | 'number' | 'text'; label?: string; disabled?: boolean }>(), {
	kind: 'text'
})
const emit = defineEmits<{ save: [value: number | string] }>()

const editing = ref(false)
const draft = ref<number | string>(props.modelValue)
const root = ref<HTMLElement>()

async function start() {
	if (props.disabled) return
	draft.value = props.modelValue
	editing.value = true
	await nextTick()
	root.value?.querySelector('input')?.select()
}
function cancel() {
	editing.value = false
}
function commit() {
	if (!editing.value) return
	editing.value = false
	if (draft.value !== props.modelValue) emit('save', draft.value)
}
</script>

<template>
	<div v-if="editing" ref="root" class="flex items-center justify-end gap-1" @keydown.esc="cancel">
		<div class="w-44">
			<MoneyInput v-if="kind === 'money'" v-model="draft as number" :aria-label="label" @keydown.enter="commit" @blur="cancel" />
			<Input
				v-else
				v-model="draft"
				:type="kind === 'number' ? 'number' : 'text'"
				:align="kind === 'number' ? 'right' : 'left'"
				:aria-label="label"
				@keydown.enter="commit"
				@blur="cancel"
			/>
		</div>
		<!-- mousedown.prevent keeps the input focused so the blur-cancel doesn't swallow this click -->
		<button
			type="button"
			aria-label="Simpan"
			title="Simpan"
			class="shrink-0 rounded-md p-1.5 text-success hover:bg-success-soft"
			@mousedown.prevent
			@click="commit"
		>
			<IconCheck class="h-4 w-4" />
		</button>
	</div>
	<button
		v-else
		type="button"
		:disabled="disabled"
		:aria-label="label ? `Ubah ${label}` : 'Ubah'"
		class="group -mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-fill"
		@click="start"
	>
		<slot>{{ modelValue }}</slot>
		<IconPencil class="h-3.5 w-3.5 text-ink-subtle group-hover:text-ink" />
	</button>
</template>
