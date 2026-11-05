<script setup lang="ts">
// Shared record-history modal: a newest-first timeline of one document (who, when, what changed field by field).
// Mounted once in DefaultLayout and driven by the history store; it only needs an endpoint that follows the
// contract in docs/conventions.md, so any module can reuse it.
import { ref, watch } from 'vue'
import axios from 'axios'
import { storeToRefs } from 'pinia'
import { IconArrowRight } from '@tabler/icons-vue'
import api from '@/utils/api'
import { date } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import { useHistoryStore } from '@/stores/history'
import Modal from '@/components/base/Modal.vue'
import Button from '@/components/base/Button.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import type { HistoryEvent, HistoryKind } from '@/utils/types'

const store = useHistoryStore()
const { open, request } = storeToRefs(store)
const toast = useToast()
const loading = ref(false)
const events = ref<HistoryEvent[]>([])

const dot: Record<HistoryKind, string> = {
	created: 'bg-primary',
	updated: 'bg-info',
	approved: 'bg-success',
	rejected: 'bg-danger',
	info: 'bg-ink-subtle'
}

// Always read fresh when opening — the list/detail behind the modal may be stale.
watch(open, async (isOpen) => {
	if (!isOpen || !request.value) return
	loading.value = true
	events.value = []
	try {
		const res = await api.get<{ data: HistoryEvent[] }>(request.value.endpoint)
		events.value = res.data.data
	} catch (error) {
		toast.error(axios.isAxiosError(error) ? (error.response?.data?.message ?? 'Riwayat tidak dapat dimuat') : 'Riwayat tidak dapat dimuat')
		store.close()
	} finally {
		loading.value = false
	}
})
</script>

<template>
	<Modal :open="open" title="Riwayat" @close="store.close()">
		<p v-if="request?.kode" class="-mt-1 mb-4 text-s text-ink-muted">{{ request.kode }}</p>
		<Skeleton v-if="loading" :lines="5" />
		<EmptyState v-else-if="!events.length" title="Belum ada riwayat" description="Perubahan pada data ini akan tercatat di sini." />
		<ol v-else class="max-h-[60vh] overflow-y-auto pr-1">
			<li v-for="(event, index) in events" :key="event.id" class="relative flex gap-3 pb-5 last:pb-0">
				<!-- timeline rail: dot per event, hairline connector down to the next one -->
				<span v-if="index < events.length - 1" class="absolute bottom-0 left-[4px] top-3.5 w-px bg-hairline" />
				<span :class="['relative mt-[7px] h-[9px] w-[9px] shrink-0 rounded-full', dot[event.kind]]" />
				<div class="min-w-0 flex-1">
					<div class="flex items-baseline justify-between gap-3">
						<p class="text-m font-semibold text-ink">{{ event.title }}</p>
						<p class="tnum shrink-0 text-s text-ink-muted">{{ date(event.at, 'DD MMM YYYY HH:mm') }}</p>
					</div>
					<p class="text-s text-ink-muted">
						oleh {{ event.actor }}<template v-if="event.summary"> · {{ event.summary }}</template>
					</p>
					<ul v-if="event.changes.length" class="mt-2 space-y-2">
						<li v-for="(change, i) in event.changes" :key="i">
							<p class="text-s text-ink-muted">{{ change.label }}</p>
							<p class="flex flex-wrap items-center gap-x-1.5 text-m">
								<span class="text-ink-muted">{{ change.from }}</span>
								<IconArrowRight class="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
								<span class="text-ink">{{ change.to }}</span>
							</p>
						</li>
					</ul>
				</div>
			</li>
		</ol>
		<template #footer>
			<Button variant="secondary" size="sm" @click="store.close()">Tutup</Button>
		</template>
	</Modal>
</template>
