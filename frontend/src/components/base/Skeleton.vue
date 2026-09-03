<script setup lang="ts">
withDefaults(defineProps<{ lines?: number; width?: string }>(), { lines: 3, width: '100%' })
</script>

<template>
	<div class="space-y-2">
		<div v-for="n in lines" :key="n" class="h-3 animate-pulse rounded bg-fill" :style="{ width: n === lines ? '60%' : width }" />
	</div>
</template>
