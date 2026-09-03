<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info' }>(), { tone: 'neutral' })

const tones: Record<string, string> = {
	neutral: 'bg-fill text-ink-muted',
	primary: 'bg-primary-soft text-primary-dark',
	success: 'bg-success-soft text-success',
	danger: 'bg-danger-soft text-danger',
	warning: 'bg-warning-soft text-warning',
	info: 'bg-info-soft text-info'
}
</script>

<template>
	<span :class="['inline-flex items-center rounded-chip px-1.5 py-0.5 text-s font-medium', tones[tone]]">
		<slot />
	</span>
</template>
