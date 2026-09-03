<script setup lang="ts">
import { computed } from 'vue'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'
import type { Pagination } from '@/utils/types'

const props = defineProps<{ pagination?: Pagination }>()
const emit = defineEmits<{ pageTo: [{ page: number }] }>()

const page = computed(() => props.pagination?.page ?? 1)
const lastPage = computed(() => props.pagination?.last_page ?? 1)

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
	<div class="flex items-center justify-between text-s text-ink-muted">
		<span class="tnum">{{ range.from }}–{{ range.to }} dari {{ range.total }}</span>
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
