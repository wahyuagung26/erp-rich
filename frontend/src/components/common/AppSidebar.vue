<script setup lang="ts">
import { ref } from 'vue'
import { IconChevronsLeft, IconChevronRight } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { NAV } from '@/constant/nav'
import { useUiStore } from '@/stores/ui'

// Borderless left rail: no divider to the content — the canvas gap separates
// them. Collapses to icons. One level of collapsible groups (e.g. "Master").
const ui = useUiStore()
const { railCollapsed } = storeToRefs(ui)
const route = useRoute()

const linkClass = 'flex items-center gap-3 rounded-md px-2.5 py-2 text-m text-ink-muted transition-colors hover:bg-fill hover:text-ink'
const activeClass = 'bg-primary-soft !text-primary-dark font-medium'

// A group starts open if it holds the active route; click toggles it.
const open = ref<Record<string, boolean>>(
	Object.fromEntries(NAV.filter((i) => i.children).map((i) => [i.label, i.children!.some((c) => route.path.startsWith(c.to!))]))
)
</script>

<template>
	<aside class="flex shrink-0 flex-col bg-panel py-3 transition-[width] duration-200" :class="railCollapsed ? 'w-14' : 'w-56'">
		<div class="flex items-center gap-2 px-4 pb-3" :class="{ 'justify-center px-0': railCollapsed }">
			<span class="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary font-mono text-l font-bold text-ink-invert">F</span>
			<span v-if="!railCollapsed" class="text-m font-semibold text-ink">ERP Finance</span>
		</div>

		<nav class="flex-1 space-y-0.5 overflow-y-auto px-2">
			<template v-for="item in NAV" :key="item.label">
				<!-- leaf -->
				<RouterLink
					v-if="item.to"
					:to="item.to"
					:class="linkClass"
					:active-class="activeClass"
					:title="railCollapsed ? item.label : undefined"
				>
					<component :is="item.icon" class="h-[18px] w-[18px] shrink-0" />
					<span v-if="!railCollapsed" class="truncate">{{ item.label }}</span>
				</RouterLink>

				<!-- group -->
				<template v-else>
					<button v-if="!railCollapsed" type="button" :class="[linkClass, 'w-full']" @click="open[item.label] = !open[item.label]">
						<component :is="item.icon" class="h-[18px] w-[18px] shrink-0" />
						<span class="flex-1 truncate text-left">{{ item.label }}</span>
						<IconChevronRight class="h-4 w-4 shrink-0 transition-transform" :class="{ 'rotate-90': open[item.label] }" />
					</button>
					<div v-if="railCollapsed || open[item.label]" class="space-y-0.5">
						<RouterLink
							v-for="child in item.children"
							:key="child.to"
							:to="child.to!"
							:class="[linkClass, { 'pl-9': !railCollapsed }]"
							:active-class="activeClass"
							:title="railCollapsed ? child.label : undefined"
						>
							<component :is="child.icon" class="h-[18px] w-[18px] shrink-0" />
							<span v-if="!railCollapsed" class="truncate">{{ child.label }}</span>
						</RouterLink>
					</div>
				</template>
			</template>
		</nav>

		<button class="mx-2 flex items-center gap-3 rounded-md px-2.5 py-2 text-s text-ink-subtle hover:bg-fill hover:text-ink" @click="ui.toggleRail()">
			<IconChevronsLeft class="h-[18px] w-[18px] shrink-0 transition-transform" :class="{ 'rotate-180': railCollapsed }" />
			<span v-if="!railCollapsed">Ciutkan</span>
		</button>
	</aside>
</template>
