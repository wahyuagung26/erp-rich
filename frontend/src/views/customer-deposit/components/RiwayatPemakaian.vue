<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '@/utils/api'
import { date } from '@/utils/format'
import Table from '@/components/base/Table.vue'
import Amount from '@/components/base/Amount.vue'
import type { CustomerDepositUsage, TableRow } from '@/utils/types'

// Read-only usage (pemakaian) history of a customer deposit — which invoices took how much.
const props = defineProps<{ depositId: number }>()

const rows = ref<CustomerDepositUsage[]>([])
const loading = ref(true)

onMounted(async () => {
	try {
		const res = await api.get<{ data: CustomerDepositUsage[] }>(`/customer-deposit/${props.depositId}/usage`)
		rows.value = res.data.data
	} finally {
		loading.value = false
	}
})

const columns: TableRow[] = [
	{ label: 'Tanggal', field: 'date', align: 'left' },
	{ label: 'No Invoice', field: 'invoice_number', align: 'left' },
	{ label: 'Keterangan', field: 'note', align: 'left' },
	{ label: 'Nominal Pakai', field: 'amount', align: 'right' }
]
</script>

<template>
	<section class="space-y-3">
		<h3 class="subhead">Riwayat Pemakaian Titipan</h3>
		<Table :rows="columns" :columns="rows as unknown as Record<string, unknown>[]" :loading="loading" empty-text="Belum ada pemakaian titipan">
			<template #table-content="{ row, column }">
				<span v-if="row.field === 'date'" class="tnum whitespace-nowrap text-ink-muted">{{ date(column.date as string) }}</span>
				<span v-else-if="row.field === 'invoice_number'" class="whitespace-nowrap text-ink">{{ column.invoice_number }}</span>
				<span v-else-if="row.field === 'note'" class="text-ink-muted">{{ column.note || '–' }}</span>
				<Amount v-else-if="row.field === 'amount'" :value="column.amount as number" />
				<span v-else>{{ column[row.field] }}</span>
			</template>
		</Table>
	</section>
</template>
