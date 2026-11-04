<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { IconArrowDownLeft, IconArrowUpRight, IconBuildingBank, IconFileSpreadsheet, IconRefresh } from '@tabler/icons-vue'
import axios from 'axios'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import { useToast } from '@/composables/useToast'
import { useIsMobile } from '@/composables/useIsMobile'
import { money } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import DateRangePicker from '@/components/base/DateRangePicker.vue'
import StatTile from '@/components/base/StatTile.vue'
import Amount from '@/components/base/Amount.vue'
import type { CashPosition } from '@/utils/types'

const companyStore = useCompanyStore()
const toast = useToast()
const isMobile = useIsMobile()
const today = new Date().toISOString().slice(0, 10)
const dateFrom = ref(today)
const dateTo = ref(today)
const report = ref<CashPosition>()
const loading = ref(true)

async function load() {
	loading.value = true
	try {
		const res = await api.get<{ data: CashPosition }>('/cash-position', {
			params: { date_from: dateFrom.value || undefined, date_to: dateTo.value || undefined }
		})
		report.value = res.data.data
	} catch (err) {
		if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Posisi kas tidak dapat dimuat')
		else toast.error('Posisi kas tidak dapat dimuat')
	} finally {
		loading.value = false
	}
}

onMounted(load)
// Refetch once the active company resolves on cold start, and on company switch.
watch(() => companyStore.activeId, load)

// ponytail: placeholder — wire to a real /cash-position/export (xlsx) once the backend exists.
function exportReport() {
	toast.info('Export Excel akan tersedia setelah backend siap.')
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Posisi Kas & Bank" subtitle="Ringkasan saldo akun bertipe kas berdasarkan jurnal yang sudah disetujui.">
			<template #actions>
				<div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
					<DateRangePicker v-model:from="dateFrom" v-model:to="dateTo" @change="load" />
					<Button variant="secondary" class="max-sm:flex-1" :loading="loading" @click="load"><IconRefresh class="h-4 w-4" /> Refresh</Button>
					<Button class="max-sm:flex-1" :disabled="loading || !report?.rows.length" @click="exportReport"
						><IconFileSpreadsheet class="h-4 w-4" /> Export Excel</Button
					>
				</div>
			</template>
		</PageHeader>

		<Panel>
			<Skeleton v-if="loading || !report" :lines="4" />
			<template v-else>
				<div class="grid grid-cols-1 divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
					<StatTile label="Akun Kas & Bank Aktif" :value="`${report.rows.length} Akun`" :icon="IconBuildingBank" />
					<StatTile label="Total Uang Masuk" :value="`Rp ${money(report.total.cash_in)}`" :icon="IconArrowDownLeft" icon-tone="success" />
					<StatTile label="Total Uang Keluar" :value="`Rp ${money(report.total.cash_out)}`" :icon="IconArrowUpRight" icon-tone="danger" />
				</div>

				<!-- phone renders the account cards, everything else the table — never both -->
				<div v-if="isMobile" class="mt-4">
					<p v-if="!report.rows.length" class="py-6 text-center text-s text-ink-muted">Belum ada akun kas/bank untuk perusahaan ini.</p>
					<div v-for="row in report.rows" :key="row.account_id" class="space-y-2 border-b border-hairline py-3">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate text-m text-ink">{{ row.account_name }}</p>
								<p class="text-s text-ink-muted">{{ row.account_code }}</p>
							</div>
							<div class="shrink-0 text-right">
								<p class="text-xs text-ink-muted">Saldo Akhir</p>
								<Amount :value="row.closing" class="font-semibold" />
							</div>
						</div>
						<div class="grid grid-cols-3 gap-2 text-s">
							<div>
								<p class="text-xs text-ink-muted">Saldo Awal</p>
								<Amount :value="row.opening" />
							</div>
							<div class="text-center">
								<p class="text-xs text-ink-muted">Masuk</p>
								<Amount :value="row.cash_in" />
							</div>
							<div class="text-right">
								<p class="text-xs text-ink-muted">Keluar</p>
								<Amount :value="row.cash_out" />
							</div>
						</div>
					</div>
					<dl v-if="report.rows.length" class="space-y-2 pt-3 text-m">
						<div class="flex items-center justify-between gap-3 font-semibold">
							<dt class="text-ink">Total Saldo Akhir</dt>
							<dd><Amount :value="report.total.closing" /></dd>
						</div>
						<div class="flex items-center justify-between gap-3">
							<dt class="text-ink-muted">Saldo Kas Akhir Laporan Arus Kas</dt>
							<dd><Amount :value="report.cash_flow_closing" /></dd>
						</div>
						<div class="flex items-center justify-between gap-3">
							<dt class="text-ink-muted">Selisih</dt>
							<dd><Amount :value="report.difference" /></dd>
						</div>
					</dl>
				</div>

				<div v-else class="mt-4 overflow-x-auto">
					<table class="w-full min-w-[720px] text-m">
						<thead>
							<tr class="border-b border-hairline text-left text-s text-ink-muted">
								<th class="px-3 py-2">Kode</th>
								<th class="px-3 py-2">Akun Kas / Bank</th>
								<th class="px-3 py-2 text-right">Saldo Awal</th>
								<th class="px-3 py-2 text-right">Uang Masuk</th>
								<th class="px-3 py-2 text-right">Uang Keluar</th>
								<th class="px-3 py-2 text-right">Saldo Akhir</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="row in report.rows" :key="row.account_id" class="border-b border-hairline last:border-0">
								<td class="px-3 py-3 text-ink">{{ row.account_code }}</td>
								<td class="px-3 py-3 text-ink">{{ row.account_name }}</td>
								<td class="px-3 py-3 text-right"><Amount :value="row.opening" /></td>
								<td class="px-3 py-3 text-right"><Amount :value="row.cash_in" /></td>
								<td class="px-3 py-3 text-right"><Amount :value="row.cash_out" /></td>
								<td class="px-3 py-3 text-right font-semibold"><Amount :value="row.closing" /></td>
							</tr>
							<tr v-if="!report.rows.length">
								<td class="px-3 py-6 text-center text-s text-ink-muted" colspan="6">Belum ada akun kas/bank untuk perusahaan ini.</td>
							</tr>
						</tbody>
						<tfoot v-if="report.rows.length">
							<tr class="border-t border-hairline font-semibold">
								<td class="px-3 py-3 text-ink" colspan="2">Total</td>
								<td class="px-3 py-3 text-right"><Amount :value="report.total.opening" /></td>
								<td class="px-3 py-3 text-right"><Amount :value="report.total.cash_in" /></td>
								<td class="px-3 py-3 text-right"><Amount :value="report.total.cash_out" /></td>
								<td class="px-3 py-3 text-right"><Amount :value="report.total.closing" /></td>
							</tr>
							<tr class="border-t border-hairline">
								<td class="px-3 py-3 text-right font-semibold text-ink" colspan="5">Saldo Kas Akhir Laporan Arus Kas</td>
								<td class="px-3 py-3 text-right"><Amount :value="report.cash_flow_closing" /></td>
							</tr>
							<tr class="border-t border-hairline">
								<td class="px-3 py-3 text-right font-semibold text-ink" colspan="5">Selisih (Saldo Akhir - Saldo Kas Akhir)</td>
								<td class="px-3 py-3 text-right"><Amount :value="report.difference" /></td>
							</tr>
						</tfoot>
					</table>
				</div>
			</template>
		</Panel>
	</div>
</template>
