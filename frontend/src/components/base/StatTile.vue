<script setup lang="ts">
// Flat KPI tile — no border, no shadow. Sits directly on the panel,
// separated from siblings by a hairline divider only.
import type { Component } from 'vue'

// Optional `icon` renders a soft tinted chip (no border) on the right, coloured by `iconTone`.
defineProps<{
	label: string
	value: string
	delta?: string
	deltaTone?: 'success' | 'danger' | 'neutral'
	icon?: Component
	iconTone?: 'primary' | 'success' | 'danger'
}>()
</script>

<template>
	<div class="flex items-center justify-between gap-3 px-4 py-3">
		<div class="min-w-0">
			<p class="text-s text-ink-muted">{{ label }}</p>
			<p class="mt-1 text-heading-m tnum text-ink">{{ value }}</p>
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
		<span
			v-if="icon"
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
			:class="{
				'bg-primary/10 text-primary': !iconTone || iconTone === 'primary',
				'bg-success-soft text-success': iconTone === 'success',
				'bg-danger-soft text-danger': iconTone === 'danger'
			}"
		>
			<component :is="icon" class="h-5 w-5" />
		</span>
	</div>
</template>
