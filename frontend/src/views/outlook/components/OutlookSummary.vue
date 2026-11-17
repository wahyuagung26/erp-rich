<script setup lang="ts">
import { computed } from 'vue'
import { IconAlertTriangle, IconCircleCheck, IconMinus, IconChartLine, IconScale } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import StatTile from '@/components/base/StatTile.vue'
import Badge from '@/components/base/Badge.vue'
import HelpTip from '@/components/base/HelpTip.vue'
import { money } from '@/utils/format'
import { dmyFull } from '../grid'
import type { OutlookStateFull, RekonStatus } from '../types'

// Mini dashboard: Ringkasan (arus kas actual) next to the Saldo Kas/Bank balance check at month end.
const props = defineProps<{ state: OutlookStateFull }>()

const calc = computed(() => props.state.calc)
const rekon = computed(() => calc.value.rekon)
const surplus = computed(() => calc.value.totals.SURPLUS.actual_total)

const STATUS: Record<RekonStatus, { label: string; tone: 'success' | 'danger' | 'neutral'; icon: typeof IconMinus }> = {
	balance: { label: 'Balance', tone: 'success', icon: IconCircleCheck },
	tidak_balance: { label: 'Tidak balance', tone: 'danger', icon: IconAlertTriangle },
	belum_diisi: { label: 'Belum bisa dibandingkan', tone: 'neutral', icon: IconMinus },
	tidak_tersedia: { label: 'Saldo kas/bank tidak tersedia', tone: 'neutral', icon: IconMinus }
}
const NOTE: Record<RekonStatus, string> = {
	balance: 'Saldo akhir Outlook sama dengan Saldo Kas/Bank Harian. Saldo Kas/Bank berubah mengikuti transaksi, jadi status bisa berubah tanpa mengedit Outlook.',
	tidak_balance: 'Saldo akhir Outlook berbeda dengan Saldo Kas/Bank Harian. Closing periode di Posting ditolak sampai selisih nol; perbaiki Outlook Daily lebih dulu.',
	belum_diisi: 'Isi Saldo Awal Bank di baris Saldo Awal agar saldo akhir Outlook bisa dibandingkan.',
	tidak_tersedia: 'Saldo Kas/Bank Harian gagal dibaca; muat ulang halaman.'
}
const TONE = { success: 'bg-success-soft text-success', danger: 'bg-danger-soft text-danger', neutral: 'bg-fill text-ink-muted' }
const status = computed(() => STATUS[rekon.value.status])
</script>

<template>
	<Panel>
		<!-- plain divs, not <section>: the global "section + section" divider rule would add a top rule and 32px padding to the right column -->
		<div class="grid gap-8 lg:grid-cols-2">
			<div class="space-y-3">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h3 class="subhead flex items-center gap-1.5"><IconChartLine class="h-4 w-4" /> Ringkasan</h3>
					<Badge v-if="!calc.saldo_awal_set" tone="warning" class="gap-1">
						<IconAlertTriangle class="h-3.5 w-3.5" /> Saldo awal belum diisi
						<HelpTip text="Saldo awal bank belum diisi, jadi saldo berjalan dihitung dari 0." />
					</Badge>
				</div>
				<div class="grid grid-cols-2">
					<StatTile label="Total Cash In (actual)" :value="money(calc.totals.CASH_IN.actual_total)" value-tone="success" />
					<StatTile label="Total Cash Out (actual)" :value="money(calc.totals.CASH_OUT.actual_total)" value-tone="danger" />
					<StatTile label="Surplus (Defisit)" :value="money(surplus)" :value-tone="surplus < 0 ? 'danger' : 'success'" />
					<StatTile :label="`Saldo Akhir (${dmyFull(calc.saldo_akhir_date)})`" :value="money(calc.saldo_akhir)" />
				</div>
			</div>

			<div class="space-y-3 lg:border-l lg:border-hairline lg:pl-8">
				<h3 class="subhead flex items-center gap-1.5">
					<IconScale class="h-4 w-4" /> Saldo Kas/Bank Akhir Bulan <span class="text-s font-normal normal-case tracking-normal text-ink-muted">{{ dmyFull(rekon.date) }}</span>
				</h3>
				<div class="grid grid-cols-3">
					<StatTile label="Saldo Akhir Outlook" :value="money(rekon.outlook)" />
					<StatTile label="Saldo Kas/Bank Harian" :value="rekon.bank == null ? '-' : money(rekon.bank)" />
					<StatTile label="Selisih" :value="rekon.selisih == null ? '-' : money(rekon.selisih)" :value-tone="rekon.selisih ? 'danger' : undefined" />
				</div>
				<!-- the reconciliation result: status + what it means, tinted by tone (was a loose badge tile and a grey sentence) -->
				<div :class="['flex items-start gap-2 rounded-md px-3 py-2.5 text-s', TONE[status.tone]]" role="status">
					<component :is="status.icon" class="mt-0.5 h-4 w-4 shrink-0" />
					<p>
						<strong class="font-semibold">{{ status.label }}.</strong> {{ NOTE[rekon.status] }}
					</p>
				</div>
			</div>
		</div>
	</Panel>
</template>
