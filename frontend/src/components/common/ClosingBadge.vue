<script setup lang="ts">
// Marks a record whose date falls in a closed period (locked: no edit / delete / cancel approval).
// One look everywhere; pass `title` to explain what exactly is locked.
import { IconLock } from '@tabler/icons-vue'
</script>

<template>
	<span class="inline-flex items-center gap-1 whitespace-nowrap text-s text-ink-muted" title="Periode sudah closing">
		<IconLock class="h-4 w-4" /> Closing
	</span>
</template>
