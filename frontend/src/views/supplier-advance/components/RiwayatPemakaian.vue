<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '@/utils/api'
import { date } from '@/utils/format'
import Table from '@/components/base/Table.vue'
import Amount from '@/components/base/Amount.vue'
import type { SupplierAdvanceUsage, TableRow } from '@/utils/types'

// Read-only usage (pemakaian) history of a supplier advance. Renders an empty
// state when no advance is being edited (create flow).
const props = withDefaults(defineProps<{ advanceId?: number | null }>(), { advanceId: null })

const rows = ref<SupplierAdvanceUsage[]>([])
const loading = ref(true)

async function load() {
	if (!props.advanceId) {
		loading.value = false
		rows.value = []
		return
	}
	loading.value = true
	try {
		const res = await api.get<{ data: SupplierAdvanceUsage[] }>(`/supplier-advance/${props.advanceId}/usage`)
		rows.value = res.data.data
	} finally {
		loading.value = false
	}
}
onMounted(load)

const columns: TableRow[] = [
	{ label: 'No', field: 'no', align: 'left' },
	{ label: 'Tanggal', field: 'date', align: 'left' },
	{ label: 'No Hutang Supplier', field: 'payable_number', align: 'left' },
	{ label: 'No Bayar', field: 'payment_number', align: 'left' },
	{ label: 'Keterangan', field: 'note', align: 'left' },
	{ label: 'Nominal Pakai', field: 'amount', align: 'right' }
]
</script>

<template>
	<section class="space-y-3">
		<h3 class="subhead">Riwayat Pemakaian Uang Muka</h3>
		<Table :rows="columns" :columns="rows as unknown as Record<string, unknown>[]" :loading="loading" empty-text="Belum ada pemakaian uang muka">
			<template #table-content="{ row, column, rowIndex }">
				<span v-if="row.field === 'no'" class="font-mono tnum text-ink-muted">{{ rowIndex + 1 }}</span>
				<span v-else-if="row.field === 'date'" class="font-mono tnum text-ink-muted">{{ date(column.date as string) }}</span>
				<span v-else-if="row.field === 'payable_number'" class="text-ink">{{ column.payable_number }}</span>
				<span v-else-if="row.field === 'payment_number'" class="text-ink">{{ column.payment_number }}</span>
				<span v-else-if="row.field === 'note'" class="text-ink-muted">{{ column.note || '–' }}</span>
				<Amount v-else-if="row.field === 'amount'" :value="column.amount as number" />
				<span v-else>{{ column[row.field] }}</span>
			</template>
		</Table>
	</section>
</template>
