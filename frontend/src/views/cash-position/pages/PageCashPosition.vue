<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { IconFileSpreadsheet, IconRefresh } from '@tabler/icons-vue'
import axios from 'axios'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import { useToast } from '@/composables/useToast'
import { money } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import StatTile from '@/components/base/StatTile.vue'
import Amount from '@/components/base/Amount.vue'
import type { CashPosition } from '@/utils/types'

const companyStore = useCompanyStore()
const toast = useToast()
const date = ref(new Date().toISOString().slice(0, 10))
const report = ref<CashPosition>()
const loading = ref(true)

async function load() {
	loading.value = true
	try {
		const res = await api.get<{ data: CashPosition }>('/cash-position', { params: { date: date.value } })
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
				<div class="flex flex-wrap items-center gap-2">
					<DatePicker v-model="date" class="!w-44" @update:model-value="load" />
					<Button variant="secondary" :loading="loading" @click="load"><IconRefresh class="h-4 w-4" /> Refresh</Button>
					<Button :disabled="loading || !report?.rows.length" @click="exportReport"><IconFileSpreadsheet class="h-4 w-4" /> Export Excel</Button>
				</div>
			</template>
		</PageHeader>

		<Panel>
			<Skeleton v-if="loading || !report" :lines="4" />
			<template v-else>
				<div class="grid grid-cols-1 divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
					<StatTile label="Akun Kas & Bank Aktif" :value="`${report.rows.length} Akun`" />
					<StatTile label="Total Uang Masuk" :value="`Rp ${money(report.total.cash_in)}`" />
					<StatTile label="Total Uang Keluar" :value="`Rp ${money(report.total.cash_out)}`" />
				</div>

				<div class="mt-4 overflow-x-auto">
					<table class="w-full min-w-[820px] text-m">
						<thead>
							<tr class="border-b border-hairline text-left text-s text-ink-muted">
								<th class="px-3 py-2">Kode</th>
								<th class="px-3 py-2">Akun Kas / Bank</th>
								<th class="px-3 py-2 text-right">Saldo Kemarin</th>
								<th class="px-3 py-2 text-right">Uang Masuk</th>
								<th class="px-3 py-2 text-right">Uang Keluar</th>
								<th class="px-3 py-2 text-right">Saldo Hari Ini</th>
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
						</tfoot>
					</table>
				</div>
			</template>
		</Panel>
	</div>
</template>
