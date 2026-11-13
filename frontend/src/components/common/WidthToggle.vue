<script setup lang="ts">
import { IconViewportNarrow, IconViewportWide } from '@tabler/icons-vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
	<div class="flex rounded-md bg-fill p-0.5">
		<button
			class="grid h-7 w-7 place-items-center rounded"
			:class="ui.contentWidth === 'narrow' ? 'bg-panel text-ink' : 'text-ink-subtle'"
			title="Konten sempit"
			@click="ui.setContentWidth('narrow')"
		>
			<IconViewportNarrow class="h-4 w-4" />
		</button>
		<button
			class="grid h-7 w-7 place-items-center rounded"
			:class="ui.contentWidth === 'full' ? 'bg-panel text-ink' : 'text-ink-subtle'"
			title="Konten penuh"
			@click="ui.setContentWidth('full')"
		>
			<IconViewportWide class="h-4 w-4" />
		</button>
	</div>
</template>
