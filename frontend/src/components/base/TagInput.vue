<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { IconX } from '@tabler/icons-vue'

// Chip list input: Enter / comma / Tab adds the typed value (case-insensitive unique), Backspace on empty removes the last chip.
// `suggestions` feed a native datalist (values already used elsewhere); picked ones are left out.
const props = defineProps<{ modelValue: string[]; placeholder?: string; disabled?: boolean; suggestions?: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const text = ref('')
const listId = useId()
const open = computed(() => (props.suggestions ?? []).filter((v) => !props.modelValue.some((x) => x.toLowerCase() === v.toLowerCase())))
const input = ref<HTMLInputElement>()

function commit() {
	const values = text.value
		.split(',')
		.map((v) => v.trim())
		.filter(Boolean)
	text.value = ''
	const next = [...props.modelValue]
	for (const v of values) if (!next.some((x) => x.toLowerCase() === v.toLowerCase())) next.push(v)
	if (next.length !== props.modelValue.length) emit('update:modelValue', next)
}

function onKey(e: KeyboardEvent) {
	if (e.key === 'Enter' || e.key === ',' || (e.key === 'Tab' && text.value.trim())) {
		e.preventDefault()
		commit()
	} else if (e.key === 'Backspace' && !text.value && props.modelValue.length) {
		emit('update:modelValue', props.modelValue.slice(0, -1))
	}
}

const remove = (index: number) =>
	emit(
		'update:modelValue',
		props.modelValue.filter((_, i) => i !== index)
	)
</script>

<template>
	<div
		:class="[
			'flex min-h-[38px] w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-ink-subtle/30 bg-panel px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/40',
			disabled && 'pointer-events-none bg-fill opacity-50'
		]"
		@click="input?.focus()"
	>
		<span
			v-for="(tag, index) in modelValue"
			:key="tag"
			class="inline-flex items-center gap-1 rounded-chip bg-primary-soft py-0.5 pl-2 pr-1 text-s text-primary-dark"
		>
			{{ tag }}
			<button type="button" class="rounded-chip p-0.5 hover:bg-primary/15" :title="`Hapus ${tag}`" @click.stop="remove(index)">
				<IconX class="h-3 w-3" />
			</button>
		</span>
		<input
			ref="input"
			:list="open.length ? listId : undefined"
			v-model="text"
			:disabled="disabled"
			:placeholder="modelValue.length ? '' : placeholder"
			class="min-w-[120px] flex-1 bg-transparent py-0.5 text-m text-ink placeholder:text-ink-subtle focus:outline-none"
			@keydown="onKey"
			@blur="commit"
		/>
		<datalist v-if="open.length" :id="listId">
			<option v-for="value in open" :key="value" :value="value" />
		</datalist>
	</div>
</template>
