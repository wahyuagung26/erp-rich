<script setup lang="ts">
// Page title + primary action. No divider under it — whitespace carries the
// separation to the content below (Functional Minimalism).
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-heading-m font-semibold text-ink">{{ title }}</h1>
			<p v-if="subtitle" class="text-s text-ink-muted">{{ subtitle }}</p>
		</div>
		<slot name="actions" />
	</div>
</template>
