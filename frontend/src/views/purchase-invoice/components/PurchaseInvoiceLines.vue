<script setup lang="ts">
import { computed } from 'vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import Amount from '@/components/base/Amount.vue'
import { lineTotal, totals, type PurchaseInvoiceLineDraft } from '@/views/purchase-invoice/schema'

const props = defineProps<{ lines: PurchaseInvoiceLineDraft[]; pkpActive: boolean }>()
const emit = defineEmits<{ 'update:lines': [PurchaseInvoiceLineDraft[]] }>()

const summary = computed(() => totals(props.lines, props.pkpActive))

function updatePrice(index: number, value: number) {
	emit(
		'update:lines',
		props.lines.map((line, i) => (i === index ? { ...line, price: value } : line))
	)
}
</script>

<template>
	<div class="overflow-x-auto">
		<table class="w-full min-w-[860px] text-m">
			<thead>
				<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
					<th class="px-2 py-2">Produk</th>
					<th class="px-2 py-2 text-right">Jumlah</th>
					<th class="px-2 py-2 text-right">Harga Satuan<span class="text-danger">*</span></th>
					<th class="min-w-[110px] px-2 py-2 text-right">DPP</th>
					<th class="min-w-[110px] px-2 py-2 text-right">PPN</th>
					<th class="min-w-[110px] px-2 py-2 text-right">Total</th>
				</tr>
			</thead>
			<tbody>
				<tr v-if="!lines.length">
					<td colspan="6" class="px-3 py-6 text-center text-s text-ink-muted">Pilih penerimaan pembelian untuk memuat daftar produk.</td>
				</tr>
				<tr v-for="(line, index) in lines" :key="line.product_id" class="border-b border-hairline align-top last:border-0">
					<td class="min-w-[220px] px-2 py-3">
						<div class="text-ink">{{ line.product_name }}</div>
						<div class="text-s text-ink-muted">{{ [line.product_code, line.brand_name].filter(Boolean).join(' · ') }}</div>
					</td>
					<td class="px-2 py-3 text-right">
						<div class="tnum text-ink">{{ line.quantity }}</div>
						<div v-if="line.unit_name" class="text-s text-ink-muted">{{ line.unit_name }}</div>
					</td>
					<td class="min-w-[160px] px-2 py-2">
						<MoneyInput :model-value="line.price" blank-zero placeholder="0" @update:model-value="(value) => updatePrice(index, value)" />
					</td>
					<td class="px-2 py-3 text-right"><Amount :value="lineTotal(line, pkpActive).dpp" /></td>
					<td class="px-2 py-3 text-right"><Amount :value="lineTotal(line, pkpActive).ppn" /></td>
					<td class="px-2 py-3 text-right"><Amount :value="lineTotal(line, pkpActive).total" /></td>
				</tr>
			</tbody>
			<tfoot v-if="lines.length">
				<tr class="bg-fill font-semibold text-ink [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md">
					<td colspan="3" class="px-2 py-2.5 text-right text-ink-muted">Total Invoice</td>
					<td class="px-2 py-2.5 text-right"><Amount :value="summary.dpp" /></td>
					<td class="px-2 py-2.5 text-right"><Amount :value="summary.ppn" /></td>
					<td class="px-2 py-2.5 text-right text-l"><Amount :value="summary.total" /></td>
				</tr>
			</tfoot>
		</table>
	</div>
</template>
