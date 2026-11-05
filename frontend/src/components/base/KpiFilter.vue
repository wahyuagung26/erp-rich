<script setup lang="ts">
// KPI tiles that double as a quick filter: each tile is a toggle button (one active at a time; click the active tile to clear).
// Presentation only — the page owns the filter state (see composables/useKpiTiles.ts).
import StatTile from './StatTile.vue'

export interface KpiItem {
	key: string
	label: string
	count?: number
	hint?: string
}

defineProps<{ items: KpiItem[]; active: string | null }>()
defineEmits<{ select: [key: string | null] }>()
</script>

<template>
	<!-- tiles share the row evenly; on a phone they wrap to two per line -->
	<div class="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2">
		<button
			v-for="item in items"
			:key="item.key"
			type="button"
			:aria-pressed="active === item.key"
			class="flex items-start rounded-md text-left transition-colors"
			:class="active === item.key ? 'bg-primary/10' : 'bg-fill/60 hover:bg-fill'"
			@click="$emit('select', active === item.key ? null : item.key)"
		>
			<StatTile class="w-full" :label="item.label" :value="item.count === undefined ? '–' : String(item.count)" :delta="item.hint" />
		</button>
	</div>
</template>
