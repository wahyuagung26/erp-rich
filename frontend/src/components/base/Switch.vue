<script setup lang="ts">
defineProps<{ modelValue?: boolean; label?: string }>()
defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
	<label class="inline-flex cursor-pointer select-none items-center gap-2 text-m text-ink">
		<button
			type="button"
			role="switch"
			:aria-checked="modelValue"
			:class="['relative h-5 w-9 rounded-full transition-colors', modelValue ? 'bg-primary' : 'bg-hairline']"
			@click="$emit('update:modelValue', !modelValue)"
		>
			<span :class="['absolute top-0.5 h-4 w-4 rounded-full bg-panel transition-all', modelValue ? 'left-[1.125rem]' : 'left-0.5']" />
		</button>
		<span v-if="label">{{ label }}</span>
	</label>
</template>
