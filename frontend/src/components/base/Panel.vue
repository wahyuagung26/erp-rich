<script setup lang="ts">
// Borderless section container: white on canvas, no border, no shadow.
// Optional title row uses spacing (not a divider) to separate from content.
defineProps<{ title?: string; description?: string }>()
</script>

<template>
	<section class="rounded-md bg-panel p-4">
		<header v-if="title || $slots.actions" class="mb-3 flex items-start justify-between gap-3">
			<div>
				<h2 v-if="title" class="text-heading-s font-semibold text-ink">{{ title }}</h2>
				<p v-if="description" class="text-s text-ink-muted">{{ description }}</p>
			</div>
			<slot name="actions" />
		</header>
		<slot />
	</section>
</template>
