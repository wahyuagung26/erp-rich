<script setup lang="ts">
interface Option {
	label: string
	value: string
}

defineProps<{ modelValue?: string; options: Option[]; inline?: boolean }>()
defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
	<div :class="inline ? 'flex flex-wrap gap-x-5 gap-y-2' : 'space-y-2'">
		<label v-for="opt in options" :key="opt.value" class="inline-flex cursor-pointer select-none items-center gap-2 text-m text-ink">
			<input
				type="radio"
				:value="opt.value"
				:checked="modelValue === opt.value"
				class="h-4 w-4 accent-primary"
				@change="$emit('update:modelValue', opt.value)"
			/>
			<span>{{ opt.label }}</span>
		</label>
	</div>
</template>
