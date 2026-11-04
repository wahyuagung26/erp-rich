<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { IconChevronsLeft, IconChevronRight } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { NAV } from '@/constant/nav'
import { useUiStore } from '@/stores/ui'

// Brand rail: deep-green gradient, light text. One-off brand surface (like the
// auth navy panel) — allowed to sit outside the closed palette. Collapses to
// icons. One level of collapsible groups (e.g. "Master").
const ui = useUiStore()
const { railCollapsed: railPref, mobileNavOpen } = storeToRefs(ui)
const route = useRoute()

// Below lg the rail becomes an off-canvas drawer: always expanded, closes on navigation.
const desktop = window.matchMedia('(min-width: 1024px)')
const isDesktop = ref(desktop.matches)
const onMq = () => (isDesktop.value = desktop.matches)
onMounted(() => desktop.addEventListener('change', onMq))
onUnmounted(() => desktop.removeEventListener('change', onMq))
const railCollapsed = computed(() => railPref.value && isDesktop.value)
watch(
	() => route.path,
	() => ui.toggleMobileNav(false)
)

const linkClass = 'flex items-center gap-3 rounded-md px-2.5 py-2 text-m text-ink-invert/75 transition-colors hover:bg-white/10 hover:text-ink-invert'
const activeClass = 'bg-white/15 !text-ink-invert font-medium'

// A group starts open if it holds the active route; click toggles it.
const open = ref<Record<string, boolean>>(
	Object.fromEntries(NAV.filter((i) => i.children).map((i) => [i.label, i.children!.some((c) => route.path.startsWith(c.to!))]))
)
</script>

<template>
	<aside
		class="fixed inset-y-0 left-0 z-40 flex w-56 shrink-0 flex-col bg-gradient-to-b from-primary to-primary-dark py-3 text-ink-invert transition-transform duration-200 lg:static lg:translate-x-0 lg:transition-[width]"
		:class="[railCollapsed ? 'lg:w-14' : 'lg:w-56', mobileNavOpen ? 'translate-x-0' : '-translate-x-full']"
	>
		<div class="flex items-center gap-2 px-4 pb-3" :class="{ 'justify-center px-0': railCollapsed }">
			<span class="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/15 font-mono text-l font-bold text-ink-invert">F</span>
			<span v-if="!railCollapsed" class="text-m font-semibold text-ink-invert">ERP Finance</span>
		</div>

		<p v-if="!railCollapsed" class="px-3.5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-ink-invert/45">Navigasi</p>

		<nav class="flex-1 space-y-0.5 overflow-y-auto px-2">
			<template v-for="item in NAV" :key="item.label">
				<!-- leaf -->
				<RouterLink v-if="item.to" :to="item.to" :class="linkClass" :active-class="activeClass" :title="railCollapsed ? item.label : undefined">
					<component :is="item.icon" class="h-[18px] w-[18px] shrink-0" />
					<span v-if="!railCollapsed" class="truncate">{{ item.label }}</span>
				</RouterLink>

				<!-- group -->
				<template v-else>
					<button
						v-if="!railCollapsed"
						type="button"
						:class="[linkClass, 'w-full', { 'bg-white/10 text-ink-invert': open[item.label] }]"
						@click="open[item.label] = !open[item.label]"
					>
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

		<button
			class="mx-2 hidden items-center gap-3 rounded-md px-2.5 py-2 text-s text-ink-invert/60 hover:bg-white/10 hover:text-ink-invert lg:flex"
			@click="ui.toggleRail()"
		>
			<IconChevronsLeft class="h-[18px] w-[18px] shrink-0 transition-transform" :class="{ 'rotate-180': railCollapsed }" />
			<span v-if="!railCollapsed">Ciutkan</span>
		</button>
	</aside>
</template>
