<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 20 })
</script>

<template>
	<span
		class="inline-block animate-spin rounded-full border-2 border-primary/25 border-t-primary"
		:style="{ width: `${size}px`, height: `${size}px` }"
	/>
</template>
