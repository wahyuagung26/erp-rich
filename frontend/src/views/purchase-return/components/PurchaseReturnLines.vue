<script setup lang="ts">
import { computed } from 'vue'
import Input from '@/components/base/Input.vue'
import Amount from '@/components/base/Amount.vue'
import { lineTotal, totals } from '@/views/purchase-invoice/schema'
import { available, type PurchaseReturnLineDraft } from '@/views/purchase-return/schema'

const props = defineProps<{ lines: PurchaseReturnLineDraft[]; pkpActive: boolean }>()
const emit = defineEmits<{ 'update:lines': [PurchaseReturnLineDraft[]] }>()

const summary = computed(() => totals(props.lines, props.pkpActive))

function updateQuantity(index: number, value: number) {
	emit(
		'update:lines',
		props.lines.map((line, i) => (i === index ? { ...line, quantity: value } : line))
	)
}
</script>

<template>
	<div class="overflow-x-auto">
		<table class="w-full min-w-[960px] text-m">
			<thead>
				<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
					<th class="px-2 py-2">Produk</th>
					<th class="px-2 py-2 text-right">Qty Dibeli</th>
					<th class="px-2 py-2 text-right">Sudah Diretur</th>
					<th class="px-2 py-2 text-right">Qty Retur<span class="text-danger">*</span></th>
					<th class="px-2 py-2 text-right">Harga Satuan</th>
					<th class="min-w-[110px] px-2 py-2 text-right">DPP</th>
					<th class="min-w-[110px] px-2 py-2 text-right">PPN</th>
					<th class="min-w-[110px] px-2 py-2 text-right">Total</th>
				</tr>
			</thead>
			<tbody>
				<tr v-if="!lines.length">
					<td colspan="8" class="px-3 py-6 text-center text-s text-ink-muted">Pilih invoice pembelian untuk memuat daftar produk.</td>
				</tr>
				<tr v-for="(line, index) in lines" :key="line.product_id" class="border-b border-hairline align-top last:border-0">
					<td class="min-w-[220px] px-2 py-3">
						<div class="text-ink">{{ line.product_name }}</div>
						<div class="text-s text-ink-muted">{{ [line.product_code, line.brand_name].filter(Boolean).join(' · ') }}</div>
					</td>
					<td class="px-2 py-3 text-right">
						<div class="tnum text-ink">{{ line.quantity_purchased }}</div>
						<div v-if="line.unit_name" class="text-s text-ink-muted">{{ line.unit_name }}</div>
					</td>
					<td class="tnum px-2 py-3 text-right text-ink-muted">{{ line.quantity_returned_before }}</td>
					<td class="min-w-[130px] px-2 py-2">
						<Input
							type="number"
							min="0"
							:max="available(line)"
							step="0.001"
							align="right"
							:addon="line.unit_name"
							:model-value="line.quantity || ''"
							:disabled="available(line) === 0"
							placeholder="0"
							@update:model-value="(value) => updateQuantity(index, Number(value))"
						/>
						<p class="mt-1 text-right text-s text-ink-muted">Maks. {{ available(line) }}</p>
					</td>
					<td class="px-2 py-3 text-right"><Amount :value="line.price" /></td>
					<td class="px-2 py-3 text-right"><Amount :value="lineTotal(line, pkpActive).dpp" /></td>
					<td class="px-2 py-3 text-right"><Amount :value="lineTotal(line, pkpActive).ppn" /></td>
					<td class="px-2 py-3 text-right"><Amount :value="lineTotal(line, pkpActive).total" /></td>
				</tr>
			</tbody>
			<tfoot v-if="lines.length">
				<tr class="bg-fill font-semibold text-ink [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md">
					<td colspan="5" class="px-2 py-2.5 text-right text-ink-muted">Total Retur</td>
					<td class="px-2 py-2.5 text-right"><Amount :value="summary.dpp" /></td>
					<td class="px-2 py-2.5 text-right"><Amount :value="summary.ppn" /></td>
					<td class="px-2 py-2.5 text-right text-l"><Amount :value="summary.total" /></td>
				</tr>
			</tfoot>
		</table>
	</div>
</template>
