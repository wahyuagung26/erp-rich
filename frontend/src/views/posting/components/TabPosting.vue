<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { date } from '@/utils/format'
import FormField from '@/components/base/FormField.vue'
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import type { ApiItem, ClosingStatus, PostingRun } from '@/utils/types'
import { addMonths, periodLabel } from '../format'

const toast = useToast()
const runs = ref<PostingRun[]>([])
const status = ref<ClosingStatus>()
const period = ref('')
const error = ref('')
const loading = ref(true)
const posting = ref(false)

// Unlocked periods only: after the closing boundary, up to the running month.
const options = computed(() => {
	if (!status.value) return []
	const out: { label: string; value: string }[] = []
	for (let p = addMonths(status.value.closed_until ?? '2026-05', 1); p <= status.value.current_period; p = addMonths(p, 1))
		out.unshift({ label: periodLabel(p), value: p })
	return out
})
const lastRun = computed(() => runs.value.find((r) => r.period === period.value))

async function load() {
	loading.value = true
	try {
		const [r, s] = await Promise.all([api.get<{ data: PostingRun[] }>('/posting'), api.get<ApiItem<ClosingStatus>>('/posting/closing')])
		runs.value = r.data.data
		status.value = s.data.data
		if (!options.value.some((o) => o.value === period.value)) period.value = status.value.next_period
	} finally {
		loading.value = false
	}
}

async function run() {
	error.value = ''
	posting.value = true
	try {
		const res = await api.post<{ message: string }>('/posting', { period: period.value })
		toast.success(res.data.message)
		await load()
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) error.value = err.response.data?.errors?.period?.[0] ?? err.response.data?.message
		else throw err
	} finally {
		posting.value = false
	}
}

onMounted(load)
</script>

<template>
	<Skeleton v-if="loading" :lines="4" />
	<div v-else class="space-y-8">
		<section class="space-y-3">
			<h3 class="subhead">Posting Periode</h3>
			<div class="flex flex-wrap items-end gap-3">
				<FormField label="Periode" :error="error" class="w-full sm:w-64">
					<Select v-model="period" :options="options" />
				</FormField>
				<Button :loading="posting" :disabled="!period" @click="run">Posting Periode</Button>
			</div>
			<p class="text-s text-ink-subtle">
				{{
					lastRun
						? `Terakhir diposting ${date(lastRun.posted_at, 'DD MMM YYYY HH:mm')} oleh ${lastRun.posted_by}.`
						: 'Periode ini belum pernah diposting.'
				}}
				Periode yang sudah ditutup tidak bisa diposting.
			</p>
		</section>

		<section class="space-y-3">
			<h3 class="subhead">Riwayat Posting</h3>
			<EmptyState v-if="!runs.length" title="Belum ada posting" />
			<div v-else class="overflow-x-auto">
				<table class="w-full min-w-[480px] text-m">
					<thead>
						<tr class="border-b border-hairline text-left text-s text-ink-muted">
							<th class="px-3 py-2">Periode</th>
							<th class="px-3 py-2">Diposting Oleh</th>
							<th class="px-3 py-2">Waktu</th>
							<th class="px-3 py-2">Status</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="r in runs" :key="r.period" class="border-b border-hairline last:border-0">
							<td class="px-3 py-3 text-ink">{{ periodLabel(r.period) }}</td>
							<td class="px-3 py-3 text-ink">{{ r.posted_by }}</td>
							<td class="tnum px-3 py-3 text-ink">{{ date(r.posted_at, 'DD MMM YYYY HH:mm') }}</td>
							<td class="px-3 py-3">
								<Badge v-if="status?.closed_until && r.period <= status.closed_until" tone="neutral">Terkunci</Badge>
								<Badge v-else tone="success">Diposting</Badge>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	</div>
</template>
