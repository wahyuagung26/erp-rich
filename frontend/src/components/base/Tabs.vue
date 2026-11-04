<script setup lang="ts">
interface Tab {
	label: string
	value: string
}

// `pill` = compact toggle for a sub-section nested under page-level (underline) tabs.
withDefaults(defineProps<{ modelValue: string; tabs: Tab[]; variant?: 'underline' | 'pill' }>(), { variant: 'underline' })
defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
	<div class="flex gap-1" :class="{ 'border-b border-hairline': variant === 'underline' }">
		<button
			v-for="tab in tabs"
			:key="tab.value"
			class="text-m font-medium transition-colors"
			:class="
				variant === 'pill'
					? ['rounded-md px-3 py-1', modelValue === tab.value ? 'bg-primary-soft text-primary-dark' : 'text-ink-muted hover:bg-fill hover:text-ink']
					: ['-mb-px border-b-2 px-3 py-2', modelValue === tab.value ? 'border-primary text-ink' : 'border-transparent text-ink-muted hover:text-ink']
			"
			@click="$emit('update:modelValue', tab.value)"
		>
			{{ tab.label }}
		</button>
	</div>
</template>
