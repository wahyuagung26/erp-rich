<script setup lang="ts">
defineProps<{ modelValue?: boolean; label?: string; disabled?: boolean }>()
defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
	<label class="inline-flex cursor-pointer select-none items-center gap-2 text-m text-ink">
		<input
			type="checkbox"
			:checked="modelValue"
			:disabled="disabled"
			class="h-4 w-4 rounded accent-primary disabled:opacity-50"
			@change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
		/>
		<span v-if="label">{{ label }}</span>
	</label>
</template>
