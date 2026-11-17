<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { IconCalendarEvent } from '@tabler/icons-vue'
import { useCompanyStore } from '@/stores/company'
import { usePeriodStore } from '@/stores/period'
import { periodLabel } from '@/views/posting/format'

// Active financial period of the active company (read-only; closing happens in Posting).
const period = usePeriodStore()
const company = useCompanyStore()

// A failed load just leaves the placeholder.
const load = () => period.load().catch(() => (period.status = null))
onMounted(load)
watch(() => company.activeId, load)
</script>

<template>
	<div
		class="flex items-center gap-2 text-m"
		:title="period.status?.closed_until ? `Closing terakhir: ${periodLabel(period.status.closed_until)}` : 'Belum ada periode yang ditutup'"
	>
		<IconCalendarEvent class="h-4 w-4 text-ink-subtle" />
		<span class="hidden text-ink-subtle sm:inline">Periode Keuangan</span>
		<span class="font-medium text-ink">{{ periodLabel(period.status?.next_period) }}</span>
	</div>
</template>
