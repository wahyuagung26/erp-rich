<script setup lang="ts">
import Input from '@/components/base/Input.vue'

// Colour picker with one-click presets: native picker + hex box + swatches, and a `#preview` slot for how it will look.
const props = defineProps<{ modelValue: string; swatches: string[]; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const same = (a: string) => a.toLowerCase() === props.modelValue.toLowerCase()
// Hex box: keep a leading "#", upper-case, at most 6 digits.
function onHex(value: string) {
	const digits = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
	emit('update:modelValue', ('#' + digits).toUpperCase())
}
</script>

<template>
	<div class="space-y-3">
		<div class="flex items-center gap-3">
			<input
				type="color"
				:value="modelValue"
				class="h-[38px] w-12 cursor-pointer rounded-md bg-fill p-0.5"
				aria-label="Pilih warna"
				@input="emit('update:modelValue', ($event.target as HTMLInputElement).value.toUpperCase())"
			/>
			<Input :model-value="modelValue" mono class="max-w-[140px]" :placeholder="placeholder" @update:model-value="onHex" />
		</div>
		<div class="flex flex-wrap gap-2" role="group" aria-label="Pilihan warna">
			<button
				v-for="color in swatches"
				:key="color"
				type="button"
				:title="color"
				:aria-label="`Warna ${color}`"
				:aria-pressed="same(color)"
				class="h-6 w-6 rounded-full ring-offset-2 ring-offset-panel transition-shadow hover:ring-2 hover:ring-ink-subtle/40"
				:class="same(color) && 'ring-2 ring-ink'"
				:style="{ backgroundColor: color }"
				@click="emit('update:modelValue', color)"
			/>
		</div>
		<div v-if="$slots.preview" class="flex flex-wrap items-center gap-3">
			<slot name="preview" />
		</div>
	</div>
</template>
