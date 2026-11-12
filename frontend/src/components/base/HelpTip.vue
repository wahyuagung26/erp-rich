<script setup lang="ts">
import { IconHelpCircle } from '@tabler/icons-vue'

// CSS-only tooltip: shows on hover and on keyboard/tap focus (the icon is a focusable button).
defineProps<{ text: string }>()
</script>

<template>
	<span class="group relative inline-flex">
		<button type="button" class="flex rounded-full text-ink-subtle hover:text-ink-muted" aria-label="Bantuan">
			<IconHelpCircle class="h-4 w-4" />
		</button>
		<span
			role="tooltip"
			class="pointer-events-none invisible absolute left-0 top-full z-20 mt-1.5 w-max max-w-[260px] rounded-md bg-ink px-2.5 py-1.5 text-s font-normal leading-snug text-ink-invert opacity-0 shadow-overlay transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
		>
			{{ text }}
		</span>
	</span>
</template>
