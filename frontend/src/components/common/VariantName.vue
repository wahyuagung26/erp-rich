<script setup lang="ts">
// One look for a transaction line's product: name + variant chip (hidden for the default "Standar") + muted SKU · merk.
import Badge from '@/components/base/Badge.vue'

defineProps<{ name?: string; sku?: string; label?: string; brand?: string }>()
</script>

<template>
	<div class="leading-snug">
		<p class="flex flex-wrap items-center gap-1.5 text-ink">
			<span>{{ name }}</span>
			<Badge v-if="label && label !== 'Standar'" tone="primary" class="!py-0">{{ label }}</Badge>
		</p>
		<p class="text-s text-ink-muted">{{ [sku, brand].filter(Boolean).join(' · ') }}</p>
	</div>
</template>
