<script setup lang="ts">
interface Tab {
	label: string
	value: string
}

defineProps<{ modelValue: string; tabs: Tab[] }>()
defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
	<div class="flex gap-1 border-b border-hairline">
		<button
			v-for="tab in tabs"
			:key="tab.value"
			class="-mb-px border-b-2 px-3 py-2 text-m font-medium transition-colors"
			:class="modelValue === tab.value ? 'border-primary text-ink' : 'border-transparent text-ink-muted hover:text-ink'"
			@click="$emit('update:modelValue', tab.value)"
		>
			{{ tab.label }}
		</button>
	</div>
</template>
