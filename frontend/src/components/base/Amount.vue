<script setup lang="ts">
import { computed } from 'vue'
import { money, isNegative } from '@/utils/format'

// The numeric spine: every monetary value renders here — tabular mono,
// right-aligned by default, negatives in danger + parentheses.
const props = withDefaults(defineProps<{ value: number | null | undefined; muted?: boolean }>(), {})

const text = computed(() => money(props.value))
const negative = computed(() => isNegative(props.value))
</script>

<template>
	<span class="font-mono tnum tabular-nums" :class="[negative ? 'text-danger' : muted ? 'text-ink-subtle' : 'text-ink']">
		{{ text }}
	</span>
</template>
