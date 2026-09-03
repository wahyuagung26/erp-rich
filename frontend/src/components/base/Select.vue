<script setup lang="ts">
import { IconChevronDown } from '@tabler/icons-vue'

interface Option {
	label: string
	value: string | number
}

defineProps<{
	modelValue?: string | number
	options: Option[]
	placeholder?: string
	disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
	<div class="relative w-full">
		<select
			:value="modelValue"
			:disabled="disabled"
			class="w-full appearance-none rounded-md bg-fill py-2 pl-3 pr-8 text-m text-ink disabled:opacity-50"
			@change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
		>
			<option v-if="placeholder" value="">{{ placeholder }}</option>
			<option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
		</select>
		<IconChevronDown class="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
	</div>
</template>
