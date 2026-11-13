<script setup lang="ts">
import { computed } from 'vue'
import { IconAlertTriangle, IconCircleCheck, IconMinus, IconChartLine, IconScale } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import StatTile from '@/components/base/StatTile.vue'
import Badge from '@/components/base/Badge.vue'
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
const status = computed(() => STATUS[rekon.value.status])
</script>

<template>
	<Panel>
		<div class="grid gap-8 lg:grid-cols-2">
			<section class="space-y-2">
				<h3 class="subhead flex items-center gap-1.5"><IconChartLine class="h-4 w-4" /> Ringkasan</h3>
				<div class="grid grid-cols-2">
					<StatTile label="Total Cash In (actual)" :value="money(calc.totals.CASH_IN.actual_total)" value-tone="success" />
					<StatTile label="Total Cash Out (actual)" :value="money(calc.totals.CASH_OUT.actual_total)" value-tone="danger" />
					<StatTile label="Surplus (Defisit)" :value="money(surplus)" :value-tone="surplus < 0 ? 'danger' : 'success'" />
					<StatTile :label="`Saldo Akhir (${dmyFull(calc.saldo_akhir_date)})`" :value="money(calc.saldo_akhir)" />
				</div>
				<p v-if="!calc.saldo_awal_set" class="px-4 text-s text-ink-subtle">Saldo awal bank belum diisi; saldo berjalan dihitung dari 0.</p>
			</section>

			<section class="space-y-2">
				<h3 class="subhead flex items-center gap-1.5"><IconScale class="h-4 w-4" /> Saldo Kas/Bank pada Akhir Bulan ({{ dmyFull(rekon.date) }})</h3>
				<div class="grid grid-cols-2">
					<StatTile label="Saldo Akhir Outlook" :value="money(rekon.outlook)" />
					<StatTile label="Saldo Kas/Bank Harian" :value="rekon.bank == null ? '-' : money(rekon.bank)" />
					<StatTile label="Selisih (Outlook - Kas/Bank)" :value="rekon.selisih == null ? '-' : money(rekon.selisih)" :value-tone="rekon.selisih ? 'danger' : undefined" />
					<div class="px-4 py-3">
						<p class="text-s text-ink-muted">Status</p>
						<Badge :tone="status.tone" class="mt-1.5 gap-1 text-m"><component :is="status.icon" class="h-4 w-4" /> {{ status.label }}</Badge>
					</div>
				</div>
				<p class="px-4 text-s text-ink-subtle">{{ NOTE[rekon.status] }}</p>
			</section>
		</div>
	</Panel>
</template>
