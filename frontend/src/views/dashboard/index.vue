<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { money, date } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import StatTile from '@/components/base/StatTile.vue'
import Table from '@/components/base/Table.vue'
import Amount from '@/components/base/Amount.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import type { TableRow, Journal } from '@/utils/types'

interface Summary {
	cash_bank: number
	receivables: number
	payables: number
	period_profit: number
	journal_entries_this_period: number
	transaction_value: number
	recent_journals: Journal[]
}

const summary = ref<Summary>()
const loading = ref(true)
const toast = useToast()

const rows: TableRow[] = [
	{ label: 'Tanggal', field: 'date', align: 'left' },
	{ label: 'Nomor', field: 'number', align: 'left' },
	{ label: 'Keterangan', field: 'description', align: 'left' },
	{ label: 'Nilai (Rp)', field: 'total', align: 'right' }
]

onMounted(async () => {
	try {
		const res = await api.get<{ data: Summary }>('/dashboard/summary')
		summary.value = res.data.data
	} catch (err) {
		toast.error('Ringkasan dashboard tidak dapat dimuat')
	} finally {
		loading.value = false
	}
})
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Dashboard" subtitle="Ringkasan posisi keuangan bulan berjalan" />

		<Panel>
			<Skeleton v-if="loading" :lines="2" />
			<div v-else-if="summary" class="grid grid-cols-2 divide-x divide-y divide-hairline sm:grid-cols-3 lg:grid-cols-6">
				<StatTile label="Kas & Bank" :value="money(summary.cash_bank)" />
				<StatTile label="Piutang Usaha" :value="money(summary.receivables)" />
				<StatTile label="Utang Usaha" :value="money(summary.payables)" />
				<StatTile label="Laba Bulan Ini" :value="money(summary.period_profit)" delta="+8,4% vs bulan lalu" delta-tone="success" />
				<StatTile label="Posting Bulan Ini" :value="String(summary.journal_entries_this_period)" />
				<StatTile label="Nilai Transaksi" :value="money(summary.transaction_value)" />
			</div>
		</Panel>

		<Panel title="Jurnal Terakhir">
			<Table :rows="rows" :columns="(summary?.recent_journals as unknown as Record<string, unknown>[]) ?? []" :loading="loading">
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'date'" class="font-mono tnum text-ink-muted">{{ date(column.date as string) }}</span>
					<span v-else-if="row.field === 'number'" class="font-mono text-ink-muted">{{ column.number }}</span>
					<Amount v-else-if="row.field === 'total'" :value="column.total as number" />
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
		</Panel>
	</div>
</template>
