<script setup lang="ts">
// KPI tiles that double as a quick filter: each tile is a toggle button (one active at a time; click the active tile to clear).
// Presentation only — the page owns the filter state (see composables/useKpiTiles.ts).
//  - `tone` + `icon` colour the tile by meaning (warning = needs action, success = done, danger = problem, info = in progress);
//  - `attention` tiles also colour their number while count > 0;
//  - an empty tile (count 0) goes quiet: grey number + `emptyText` instead of an amount.
import type { Component } from 'vue'
import { IconX } from '@tabler/icons-vue'
import StatTile from './StatTile.vue'

export interface KpiItem {
	key: string
	label: string
	count?: number
	hint?: string
	icon?: Component
	tone?: 'success' | 'danger' | 'warning' | 'info'
	attention?: boolean
	emptyText?: string
}

defineProps<{ items: KpiItem[]; active: string | null }>()
defineEmits<{ select: [key: string | null] }>()

const isEmpty = (item: KpiItem) => item.count === 0
</script>

<template>
	<!-- tiles share the row evenly; on a phone they wrap to two per line -->
	<div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2">
		<button
			v-for="item in items"
			:key="item.key"
			type="button"
			:aria-pressed="active === item.key"
			:title="active === item.key ? 'Klik untuk melepas filter' : `Tampilkan: ${item.label}`"
			class="relative flex items-start overflow-hidden rounded-md text-left transition-colors"
			:class="active === item.key ? 'bg-primary/10' : 'bg-fill/60 hover:bg-fill'"
			@click="$emit('select', active === item.key ? null : item.key)"
		>
			<!-- active: accent bar on the left + a clear (x) affordance, so it reads as a filter that is switched on -->
			<span v-if="active === item.key" class="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
			<IconX v-if="active === item.key" class="absolute right-2 top-2 h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
			<StatTile
				class="w-full"
				:label="item.label"
				:value="item.count === undefined ? '–' : String(item.count)"
				:delta="isEmpty(item) ? item.emptyText : item.hint"
				:delta-tone="isEmpty(item) && item.attention ? 'success' : 'neutral'"
				:icon="item.icon"
				:icon-tone="isEmpty(item) ? 'muted' : item.tone"
				:value-tone="isEmpty(item) ? 'muted' : item.attention && (item.count ?? 0) > 0 ? item.tone : undefined"
			/>
		</button>
	</div>
</template>
