<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { useIsMobile } from '@/composables/useIsMobile'
import { errorMessage } from '@/utils/errorMessage'
import { date as fmtDate } from '@/utils/format'
import Modal from '@/components/base/Modal.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Amount from '@/components/base/Amount.vue'
import Button from '@/components/base/Button.vue'
import type { CashPositionDifference, CashPositionDifferenceRow } from '@/utils/types'

const props = defineProps<{ open: boolean; dateTo: string }>()
const emit = defineEmits<{ close: [] }>()

const toast = useToast()
const isMobile = useIsMobile()
const data = ref<CashPositionDifference>()
const loading = ref(false)
const collapsed = ref(new Set<string>())

async function load() {
	loading.value = true
	data.value = undefined
	collapsed.value = new Set()
	try {
		const res = await api.get<{ data: CashPositionDifference }>('/cash-position/difference', { params: { date_to: props.dateTo || undefined } })
		data.value = res.data.data
	} catch (err) {
		toast.error(errorMessage(err, 'Rincian selisih tidak dapat dimuat'))
		emit('close')
	} finally {
		loading.value = false
	}
}

watch(
	() => props.open,
	(v) => v && load()
)

// Standalone rows first, then each group under its own collapsible header (legacy layout).
const sections = computed(() => {
	if (!data.value) return []
	const { rows, groups } = data.value
	const out: { key: string | null; label?: string; action?: string; selisih: number; rows: CashPositionDifferenceRow[] }[] = []
	const loose = rows.filter((r) => !r.group)
	if (loose.length) out.push({ key: null, selisih: 0, rows: loose })
	for (const g of groups) {
		const mine = rows.filter((r) => r.group === g.key)
		if (mine.length) out.push({ ...g, selisih: mine.reduce((s, r) => s + r.selisih, 0), rows: mine })
	}
	return out
})

function toggle(key: string) {
	const next = new Set(collapsed.value)
	if (!next.delete(key)) next.add(key)
	collapsed.value = next
}
const rowKey = (r: CashPositionDifferenceRow) => `${r.source}-${r.id}`
</script>

<template>
	<Modal :open="open" title="Rincian Selisih Saldo Kas" size="xl" @close="emit('close')">
		<p class="mb-3 text-s text-ink-muted">
			Dokumen yang nilainya di saldo kas/bank berbeda dengan di Laporan Arus Kas, kumulatif sampai
			<strong class="text-ink">{{ fmtDate(data?.date_to ?? dateTo) }}</strong
			>. Selisih = Saldo Kas - Arus Kas.
		</p>
		<Skeleton v-if="loading || !data" :lines="4" />
		<p v-else-if="!data.rows.length" class="py-6 text-center text-s text-ink-muted">Tidak ada dokumen penyebab selisih.</p>

		<div v-else-if="isMobile" class="divide-y divide-hairline">
			<template v-for="sec in sections" :key="sec.key ?? 'loose'">
				<button v-if="sec.key" type="button" class="w-full space-y-1 py-3 text-left" @click="toggle(sec.key)">
					<span class="flex items-start justify-between gap-3 font-semibold text-ink">
						<span class="flex items-center gap-1">
							<component :is="collapsed.has(sec.key) ? IconChevronRight : IconChevronDown" class="h-4 w-4 shrink-0" />
							{{ sec.label }} ({{ sec.rows.length }} jurnal)
						</span>
						<Amount :value="sec.selisih" class="shrink-0" />
					</span>
					<span class="block text-s font-semibold text-ink">{{ sec.action }}</span>
				</button>
				<template v-if="!sec.key || !collapsed.has(sec.key)">
					<div v-for="r in sec.rows" :key="rowKey(r)" class="space-y-1 py-3">
						<div class="flex items-start justify-between gap-3">
							<RouterLink :to="`/${r.source}/${r.id}`" class="text-m text-primary hover:underline" target="_blank" rel="noopener">{{
								r.number
							}}</RouterLink>
							<Amount :value="r.selisih" class="shrink-0 font-semibold" />
						</div>
						<p class="text-s text-ink-muted">{{ fmtDate(r.date) }} · {{ r.source_label }}</p>
						<div class="grid grid-cols-2 gap-2 text-s">
							<div>
								<p class="text-xs text-ink-muted">Saldo Kas</p>
								<Amount :value="r.saldo_kas" />
							</div>
							<div class="text-right">
								<p class="text-xs text-ink-muted">Arus Kas</p>
								<Amount :value="r.arus_kas" />
							</div>
						</div>
						<p class="text-s text-ink">{{ r.cause }}</p>
					</div>
				</template>
			</template>
			<div class="flex items-center justify-between pt-3 font-semibold">
				<span class="text-ink">Total Selisih</span>
				<Amount :value="data.total.selisih" />
			</div>
		</div>

		<div v-else class="max-h-[60vh] overflow-auto">
			<table class="w-full whitespace-nowrap text-m">
				<thead>
					<tr class="border-b border-hairline text-left text-s text-ink-muted">
						<th class="px-3 py-2">Tanggal</th>
						<th class="px-3 py-2">Sumber</th>
						<th class="px-3 py-2">No. Dokumen</th>
						<th class="px-3 py-2 text-right">Saldo Kas</th>
						<th class="px-3 py-2 text-right">Arus Kas</th>
						<th class="px-3 py-2 text-right">Selisih</th>
						<th class="px-3 py-2">Penyebab</th>
					</tr>
				</thead>
				<tbody>
					<template v-for="sec in sections" :key="sec.key ?? 'loose'">
						<tr v-if="sec.key" class="cursor-pointer border-b border-hairline bg-fill font-semibold text-ink" @click="toggle(sec.key)">
							<td class="px-3 py-2" colspan="5">
								<span class="flex items-center gap-1">
									<component :is="collapsed.has(sec.key) ? IconChevronRight : IconChevronDown" class="h-4 w-4 shrink-0" />
									{{ sec.label }} ({{ sec.rows.length }} jurnal)
								</span>
							</td>
							<td class="px-3 py-2 text-right"><Amount :value="sec.selisih" /></td>
							<td class="min-w-[16rem] whitespace-normal px-3 py-2">{{ sec.action }}</td>
						</tr>
						<template v-if="!sec.key || !collapsed.has(sec.key)">
							<tr v-for="r in sec.rows" :key="rowKey(r)" class="border-b border-hairline align-top">
								<td class="px-3 py-2 text-ink">{{ fmtDate(r.date) }}</td>
								<td class="px-3 py-2 text-ink">{{ r.source_label }}</td>
								<td class="px-3 py-2">
									<RouterLink :to="`/${r.source}/${r.id}`" class="text-primary hover:underline" target="_blank" rel="noopener">{{
										r.number
									}}</RouterLink>
								</td>
								<td class="px-3 py-2 text-right"><Amount :value="r.saldo_kas" /></td>
								<td class="px-3 py-2 text-right"><Amount :value="r.arus_kas" /></td>
								<td class="px-3 py-2 text-right"><Amount :value="r.selisih" /></td>
								<td class="whitespace-normal px-3 py-2 text-ink">{{ r.cause }}</td>
							</tr>
						</template>
					</template>
				</tbody>
				<tfoot>
					<tr class="font-semibold">
						<td class="px-3 py-3 text-ink" colspan="3">Total</td>
						<td class="px-3 py-3 text-right"><Amount :value="data.total.saldo_kas" /></td>
						<td class="px-3 py-3 text-right"><Amount :value="data.total.arus_kas" /></td>
						<td class="px-3 py-3 text-right"><Amount :value="data.total.selisih" /></td>
						<td />
					</tr>
				</tfoot>
			</table>
		</div>

		<template #footer>
			<Button variant="secondary" @click="emit('close')">Tutup</Button>
		</template>
	</Modal>
</template>
