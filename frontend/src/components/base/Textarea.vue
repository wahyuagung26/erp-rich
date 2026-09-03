<script setup lang="ts">
defineProps<{ modelValue?: string; placeholder?: string; rows?: number; disabled?: boolean }>()
defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
	<textarea
		:value="modelValue"
		:placeholder="placeholder"
		:rows="rows ?? 3"
		:disabled="disabled"
		class="w-full resize-y rounded-md bg-fill px-3 py-2 text-m text-ink placeholder:text-ink-subtle disabled:opacity-50"
		@input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
	/>
</template>
