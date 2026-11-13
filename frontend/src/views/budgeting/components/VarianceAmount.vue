<script setup lang="ts">
import { money } from '@/utils/format'
defineProps<{ value: number }>()
</script>
<template>
	<span class="tnum" :class="value > 0 ? 'text-success' : value < 0 ? 'text-danger' : 'text-ink'">{{ money(value) }}</span>
</template>
