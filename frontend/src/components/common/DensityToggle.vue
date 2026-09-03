<script setup lang="ts">
import { IconLayoutRows, IconLayoutList } from '@tabler/icons-vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
	<div class="flex rounded-md bg-fill p-0.5">
		<button
			class="grid h-7 w-7 place-items-center rounded"
			:class="ui.density === 'comfortable' ? 'bg-panel text-ink' : 'text-ink-subtle'"
			title="Renggang"
			@click="ui.setDensity('comfortable')"
		>
			<IconLayoutRows class="h-4 w-4" />
		</button>
		<button
			class="grid h-7 w-7 place-items-center rounded"
			:class="ui.density === 'compact' ? 'bg-panel text-ink' : 'text-ink-subtle'"
			title="Rapat"
			@click="ui.setDensity('compact')"
		>
			<IconLayoutList class="h-4 w-4" />
		</button>
	</div>
</template>
