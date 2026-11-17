<script setup lang="ts">
import { date } from '@/utils/format'

// "Dibuat" list column: creator name over the creation date + time.
defineProps<{ by?: string; at?: string }>()
</script>

<template>
	<div class="whitespace-nowrap leading-tight">
		<div class="text-ink">{{ by || '-' }}</div>
		<div class="tnum text-xs text-ink-muted">{{ date(at, 'DD MMM YYYY HH:mm') }}</div>
	</div>
</template>
