<script setup lang="ts">
import { ref } from 'vue'
import { IconAdjustmentsHorizontal } from '@tabler/icons-vue'
import Button from '@/components/base/Button.vue'
import Drawer from '@/components/base/Drawer.vue'

// "Filter Lanjutan": the filters a list page does not keep in its toolbar (owner rule 2026-11-16: at most 3 controls in the
// toolbar, search included). Put it inside <FilterBar> after the toolbar controls. The drawer controls bind to the page's own
// filter refs and apply at once, like the toolbar — so KPI tiles that preset those refs keep working. `count` = how many of
// the drawer's filters are active (shown as a badge on the button); `@reset` clears them.
defineProps<{ count: number }>()
defineEmits<{ reset: [] }>()
const open = ref(false)
</script>

<template>
	<Button variant="outline" class="!h-auto min-h-[38px]" @click="open = true">
		<IconAdjustmentsHorizontal class="h-4 w-4" />
		Filter Lanjutan
		<span v-if="count" class="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-medium text-ink-invert">{{ count }}</span>
	</Button>
	<Drawer :open="open" title="Filter Lanjutan" @close="open = false">
		<div class="space-y-4"><slot /></div>
		<template #footer>
			<Button variant="secondary" :disabled="!count" @click="$emit('reset')">Reset</Button>
			<Button @click="open = false">Selesai</Button>
		</template>
	</Drawer>
</template>
