<script setup lang="ts">
import { IconSnowflake, IconSun } from '@tabler/icons-vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
	<div class="flex rounded-md bg-fill p-0.5">
		<button
			class="grid h-7 w-7 place-items-center rounded"
			:class="ui.feel === 'cold' ? 'bg-panel text-ink' : 'text-ink-subtle'"
			title="Nuansa dingin"
			@click="ui.setFeel('cold')"
		>
			<IconSnowflake class="h-4 w-4" />
		</button>
		<button
			class="grid h-7 w-7 place-items-center rounded"
			:class="ui.feel === 'warm' ? 'bg-panel text-ink' : 'text-ink-subtle'"
			title="Nuansa hangat"
			@click="ui.setFeel('warm')"
		>
			<IconSun class="h-4 w-4" />
		</button>
	</div>
</template>
