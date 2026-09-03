<script setup lang="ts">
defineProps<{ label?: string; hint?: string; error?: string; required?: boolean }>()
</script>

<template>
	<div class="space-y-1">
		<label v-if="label" class="block text-s font-medium text-ink-muted">
			{{ label }}
			<span v-if="required" class="text-danger">*</span>
		</label>
		<slot />
		<p v-if="error" class="text-s text-danger">{{ error }}</p>
		<p v-else-if="hint" class="text-s text-ink-subtle">{{ hint }}</p>
	</div>
</template>
