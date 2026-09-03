<script setup lang="ts">
// Native date input, styled to match the design system. Swap for a library
// only if range selection or locale-heavy formatting is needed.
defineProps<{ modelValue?: string; disabled?: boolean }>()
defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
	<input
		type="date"
		:value="modelValue"
		:disabled="disabled"
		class="w-full rounded-md bg-fill px-3 py-2 font-mono text-m tnum text-ink disabled:opacity-50"
		@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
	/>
</template>
