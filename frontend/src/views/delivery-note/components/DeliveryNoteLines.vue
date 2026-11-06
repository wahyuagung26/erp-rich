<script setup lang="ts">
import { computed } from 'vue'
import Input from '@/components/base/Input.vue'
import { shippedSummary, type DeliveryNoteLineDraft } from '@/views/delivery-note/schema'

const props = defineProps<{ lines: DeliveryNoteLineDraft[]; disabled?: boolean }>()
const emit = defineEmits<{ 'update:lines': [DeliveryNoteLineDraft[]] }>()

const summary = computed(() => shippedSummary(props.lines))

function updateQuantity(index: number, value: number) {
	emit(
		'update:lines',
		props.lines.map((line, i) => (i === index ? { ...line, quantity: value } : line))
	)
}
</script>

<template>
	<div class="overflow-x-auto">
		<table class="w-full min-w-[640px] text-m">
			<thead>
				<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
					<th class="px-2 py-2">Produk</th>
					<th class="px-2 py-2 text-right">Qty Invoice</th>
					<th class="px-2 py-2 text-right">Jumlah Dikirim<span class="text-danger">*</span></th>
				</tr>
			</thead>
			<tbody>
				<tr v-if="!lines.length">
					<td colspan="3" class="px-3 py-6 text-center text-s text-ink-muted">Pilih invoice penjualan untuk memuat daftar produk.</td>
				</tr>
				<tr v-for="(line, index) in lines" :key="line.product_id" class="border-b border-hairline align-top last:border-0">
					<td class="min-w-[220px] px-2 py-3">
						<div class="text-ink">{{ line.product_name }}</div>
						<div class="text-s text-ink-muted">{{ line.product_code }}{{ line.brand_name ? ` · ${line.brand_name}` : '' }}</div>
					</td>
					<td class="px-2 py-3 text-right tnum text-ink-muted">{{ line.invoice_quantity }} {{ line.unit_name }}</td>
					<td class="min-w-[170px] px-2 py-2">
						<Input
							type="number"
							min="0"
							:max="line.invoice_quantity"
							step="0.001"
							align="right"
							:addon="line.unit_name"
							:model-value="line.quantity"
							:disabled="disabled"
							@update:model-value="(value) => updateQuantity(index, Number(value))"
						/>
					</td>
				</tr>
			</tbody>
			<tfoot v-if="lines.length">
				<tr class="bg-fill font-semibold text-ink [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md">
					<td colspan="2" class="px-2 py-2.5 text-right text-ink-muted">Total Dikirim ({{ summary.productCount }} produk)</td>
					<td class="px-2 py-2.5 text-right text-l tnum">{{ summary.totalQuantity }}</td>
				</tr>
			</tfoot>
		</table>
	</div>
</template>
