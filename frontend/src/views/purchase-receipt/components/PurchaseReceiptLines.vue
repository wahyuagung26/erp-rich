<script setup lang="ts">
import { computed } from 'vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Input from '@/components/base/Input.vue'
import { receiptSummary, type PurchaseReceiptLineDraft } from '@/views/purchase-receipt/schema'

const props = defineProps<{ lines: PurchaseReceiptLineDraft[]; disabled?: boolean }>()
const emit = defineEmits<{ 'update:lines': [PurchaseReceiptLineDraft[]] }>()

const warehouseLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`
const summary = computed(() => receiptSummary(props.lines))

function updateQuantity(index: number, value: number) {
	emit(
		'update:lines',
		props.lines.map((line, i) => (i === index ? { ...line, quantity: value } : line))
	)
}

function updateWarehouse(index: number, value: number | string | null) {
	emit(
		'update:lines',
		props.lines.map((line, i) => (i === index ? { ...line, warehouse_id: value ? Number(value) : null } : line))
	)
}
</script>

<template>
	<div class="overflow-x-auto">
		<table class="w-full min-w-[940px] text-m">
			<thead>
				<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
					<th class="px-2 py-2">Produk</th>
					<th class="px-2 py-2 text-right">Permintaan</th>
					<th class="px-2 py-2 text-right">Belum Terima</th>
					<th class="px-2 py-2 text-right">Sudah Terima</th>
					<th class="px-2 py-2 text-right">Jumlah Diterima<span class="text-danger">*</span></th>
					<th class="px-2 py-2">Gudang</th>
				</tr>
			</thead>
			<tbody>
				<tr v-if="!lines.length">
					<td colspan="6" class="px-3 py-6 text-center text-s text-ink-muted">Pilih order pembelian untuk memuat daftar produk.</td>
				</tr>
				<tr v-for="(line, index) in lines" :key="line.product_id" class="border-b border-hairline align-top last:border-0">
					<td class="min-w-[220px] px-2 py-3">
						<div class="text-ink">{{ line.product_name }}</div>
						<div class="text-s text-ink-muted">{{ line.product_code }}{{ line.brand_name ? ` · ${line.brand_name}` : '' }}</div>
					</td>
					<td class="px-2 py-3 text-right tnum text-ink-muted">{{ line.ordered_quantity }}</td>
					<td class="px-2 py-3 text-right tnum text-ink">{{ line.remaining_quantity }}</td>
					<td class="px-2 py-3 text-right tnum text-ink-muted">{{ line.received_quantity }}</td>
					<td class="min-w-[150px] px-2 py-2">
						<Input
							type="number"
							min="0"
							:max="line.remaining_quantity"
							step="0.001"
							align="right"
							:addon="line.unit_name"
							:model-value="line.quantity"
							:disabled="disabled"
							@update:model-value="(value) => updateQuantity(index, Number(value))"
						/>
					</td>
					<td class="min-w-[220px] px-2 py-2">
						<AsyncSelect
							:model-value="line.warehouse_id"
							endpoint="/warehouse"
							:option-label="warehouseLabel"
							:initial-label="line.warehouse_code ? `${line.warehouse_code} — ${line.warehouse_name}` : undefined"
							placeholder="Pilih gudang…"
							:disabled="disabled"
							@update:model-value="(value) => updateWarehouse(index, value)"
						/>
					</td>
				</tr>
			</tbody>
			<tfoot v-if="lines.length">
				<tr class="bg-fill font-semibold text-ink [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md">
					<td colspan="4" class="px-2 py-2.5 text-right text-ink-muted">Total Diterima ({{ summary.productCount }} produk)</td>
					<td class="px-2 py-2.5 text-right text-l tnum">{{ summary.totalQuantity }}</td>
					<td />
				</tr>
			</tfoot>
		</table>
	</div>
</template>
