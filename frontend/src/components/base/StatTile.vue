<script setup lang="ts">
// Flat KPI tile — no border, no shadow. Sits directly on the panel,
// separated from siblings by a hairline divider only.
defineProps<{ label: string; value: string; delta?: string; deltaTone?: 'success' | 'danger' | 'neutral' }>()
</script>

<template>
	<div class="px-4 py-3">
		<p class="text-s text-ink-muted">{{ label }}</p>
		<p class="mt-1 font-mono text-heading-m tnum text-ink">{{ value }}</p>
		<p
			v-if="delta"
			class="mt-0.5 text-s"
			:class="{
				'text-success': deltaTone === 'success',
				'text-danger': deltaTone === 'danger',
				'text-ink-subtle': !deltaTone || deltaTone === 'neutral'
			}"
		>
			{{ delta }}
		</p>
	</div>
</template>
