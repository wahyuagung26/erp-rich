<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IconChevronRight } from '@tabler/icons-vue'

// Builds a trail from matched routes' meta.breadcrumb.
const route = useRoute()

const crumbs = computed(() => route.matched.filter((r) => r.meta?.breadcrumb).map((r) => ({ label: r.meta.breadcrumb as string, to: r.path })))
</script>

<template>
	<nav v-if="crumbs.length" class="flex items-center gap-1 text-s text-ink-muted">
		<template v-for="(c, i) in crumbs" :key="c.to">
			<IconChevronRight v-if="i > 0" class="h-3.5 w-3.5 text-ink-subtle" />
			<RouterLink :to="c.to" class="hover:text-ink" :class="{ 'text-ink': i === crumbs.length - 1 }">{{ c.label }}</RouterLink>
		</template>
	</nav>
</template>
