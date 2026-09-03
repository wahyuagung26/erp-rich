<script setup lang="ts">
import { IconInbox } from '@tabler/icons-vue'
defineProps<{ title?: string; description?: string }>()
</script>

<template>
	<div class="flex flex-col items-center gap-1 py-6 text-center">
		<IconInbox class="h-7 w-7 text-ink-subtle" />
		<p class="text-m font-medium text-ink-muted">{{ title ?? 'Belum ada data' }}</p>
		<p v-if="description" class="text-s text-ink-subtle">{{ description }}</p>
		<slot />
	</div>
</template>
