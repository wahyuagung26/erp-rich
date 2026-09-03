<script setup lang="ts">
import { computed } from 'vue'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'
import type { Pagination } from '@/utils/types'

// Table footer: rows-per-page + range + page nav. Rendered once under every list
// (via useTableList). Emits `pageTo` with `{ limit }` or `{ page }` — both handled
// by useTableList.pageTo.
const props = withDefaults(defineProps<{ pagination?: Pagination; limitOptions?: number[] }>(), {
	limitOptions: () => [10, 25, 50, 100]
})
const emit = defineEmits<{ pageTo: [{ page?: number; limit?: number }] }>()

const page = computed(() => props.pagination?.page ?? 1)
const lastPage = computed(() => props.pagination?.last_page ?? 1)
const perPage = computed(() => props.pagination?.per_page ?? props.limitOptions[0])

const range = computed(() => {
	const total = props.pagination?.total ?? 0
	const per = props.pagination?.per_page ?? 0
	const from = total === 0 ? 0 : (page.value - 1) * per + 1
	const to = Math.min(page.value * per, total)
	return { from, to, total }
})

function go(p: number) {
	if (p >= 1 && p <= lastPage.value && p !== page.value) emit('pageTo', { page: p })
}
</script>

<template>
	<div class="flex flex-wrap items-center justify-between gap-3 text-s text-ink-muted">
		<div class="flex items-center gap-4">
			<label class="inline-flex items-center gap-2">
				<span>Tampilkan</span>
				<select
					:value="perPage"
					class="rounded-md bg-fill px-2 py-1 text-m text-ink"
					@change="emit('pageTo', { limit: Number(($event.target as HTMLSelectElement).value) })"
				>
					<option v-for="n in limitOptions" :key="n" :value="n">{{ n }}</option>
				</select>
				<span>baris</span>
			</label>
			<span class="tnum">{{ range.from }}–{{ range.to }} dari {{ range.total }}</span>
		</div>
		<div class="flex items-center gap-1">
			<button class="grid h-7 w-7 place-items-center rounded-md hover:bg-fill disabled:opacity-40" :disabled="page <= 1" @click="go(page - 1)">
				<IconChevronLeft class="h-4 w-4" />
			</button>
			<span class="tnum px-2">{{ page }} / {{ lastPage }}</span>
			<button class="grid h-7 w-7 place-items-center rounded-md hover:bg-fill disabled:opacity-40" :disabled="page >= lastPage" @click="go(page + 1)">
				<IconChevronRight class="h-4 w-4" />
			</button>
		</div>
	</div>
</template>
