<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { money, date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import StatTile from '@/components/base/StatTile.vue'
import Table from '@/components/base/Table.vue'
import Amount from '@/components/base/Amount.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import type { TableRow, Jurnal } from '@/utils/types'

interface Summary {
	kas_bank: number
	piutang: number
	utang: number
	laba_bulan: number
	posting_bulan_ini: number
	nilai_transaksi: number
	jurnal_terakhir: Jurnal[]
}

const summary = ref<Summary>()
const loading = ref(true)

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
				<StatTile label="Kas & Bank" :value="money(summary.kas_bank)" />
				<StatTile label="Piutang Usaha" :value="money(summary.piutang)" />
				<StatTile label="Utang Usaha" :value="money(summary.utang)" />
				<StatTile label="Laba Bulan Ini" :value="money(summary.laba_bulan)" delta="+8,4% vs bulan lalu" delta-tone="success" />
				<StatTile label="Posting Bulan Ini" :value="String(summary.posting_bulan_ini)" />
				<StatTile label="Nilai Transaksi" :value="money(summary.nilai_transaksi)" />
			</div>
		</Panel>

		<Panel title="Jurnal Terakhir">
			<Table :rows="rows" :columns="(summary?.jurnal_terakhir as unknown as Record<string, unknown>[]) ?? []" :loading="loading">
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
