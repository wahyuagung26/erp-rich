<script setup lang="ts">
// Inline filter row. Controls sit close together (Law of Proximity); the row
// has no border — it reads as one group through the shared baseline + gap.
// Bind @refresh to the page's filter-apply fn and a trailing reload button
// appears (owners expect an explicit "apply filter & reload" affordance on lists).
import { useAttrs } from 'vue'
import { IconRefresh } from '@tabler/icons-vue'
import Button from './Button.vue'

defineProps<{ loading?: boolean }>()

const onRefresh = useAttrs().onRefresh as (() => void) | undefined
</script>

<template>
	<div class="flex flex-wrap items-center gap-2">
		<slot />
		<!-- same outline + height as the inputs beside it; the icon itself spins while loading (no layout shift) -->
		<Button
			v-if="onRefresh"
			variant="outline"
			class="!h-auto !px-2.5 self-stretch"
			aria-label="Muat ulang"
			:disabled="loading"
			title="Terapkan filter & muat ulang data"
			@click="onRefresh"
		>
			<IconRefresh :class="['h-4 w-4', loading && 'animate-spin']" />
		</Button>
	</div>
</template>
