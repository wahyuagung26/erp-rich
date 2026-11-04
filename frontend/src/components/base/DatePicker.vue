<script setup lang="ts">
// Native date input, styled to match the design system. Swap for a library
// only if range selection or locale-heavy formatting is needed.
// For a from–to pair use <DateRangePicker>.
defineProps<{ modelValue?: string; disabled?: boolean; min?: string; max?: string }>()
defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
	<input
		type="date"
		:value="modelValue"
		:disabled="disabled"
		:min="min || undefined"
		:max="max || undefined"
		class="h-[38px] w-full rounded-md border border-ink-subtle/30 bg-panel px-3 py-2 text-m tnum text-ink disabled:bg-fill disabled:opacity-50"
		@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
	/>
</template>
