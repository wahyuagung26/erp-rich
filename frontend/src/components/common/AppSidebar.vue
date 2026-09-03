<script setup lang="ts">
import { IconChevronsLeft } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { NAV } from '@/constant/nav'
import { useUiStore } from '@/stores/ui'

// Borderless left rail: no divider to the content — the canvas gap separates
// them. Collapses to icons.
const ui = useUiStore()
const { railCollapsed } = storeToRefs(ui)
</script>

<template>
	<aside class="flex shrink-0 flex-col bg-panel py-3 transition-[width] duration-200" :class="railCollapsed ? 'w-14' : 'w-56'">
		<div class="flex items-center gap-2 px-4 pb-3" :class="{ 'justify-center px-0': railCollapsed }">
			<span class="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary font-mono text-l font-bold text-ink-invert">F</span>
			<span v-if="!railCollapsed" class="text-m font-semibold text-ink">ERP Finance</span>
		</div>

		<nav class="flex-1 space-y-0.5 px-2">
			<RouterLink
				v-for="item in NAV"
				:key="item.to"
				:to="item.to"
				class="flex items-center gap-3 rounded-md px-2.5 py-2 text-m text-ink-muted transition-colors hover:bg-fill hover:text-ink"
				active-class="bg-primary-soft !text-primary-dark font-medium"
				:title="railCollapsed ? item.label : undefined"
			>
				<component :is="item.icon" class="h-[18px] w-[18px] shrink-0" />
				<span v-if="!railCollapsed" class="truncate">{{ item.label }}</span>
			</RouterLink>
		</nav>

		<button class="mx-2 flex items-center gap-3 rounded-md px-2.5 py-2 text-s text-ink-subtle hover:bg-fill hover:text-ink" @click="ui.toggleRail()">
			<IconChevronsLeft class="h-[18px] w-[18px] shrink-0 transition-transform" :class="{ 'rotate-180': railCollapsed }" />
			<span v-if="!railCollapsed">Ciutkan</span>
		</button>
	</aside>
</template>
