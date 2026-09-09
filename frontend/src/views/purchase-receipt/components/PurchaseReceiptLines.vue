<script setup lang="ts">
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Input from '@/components/base/Input.vue'
import type { PurchaseReceiptLineDraft } from '@/views/purchase-receipt/schema'

const props = defineProps<{ lines: PurchaseReceiptLineDraft[]; disabled?: boolean }>()
const emit = defineEmits<{ 'update:lines': [PurchaseReceiptLineDraft[]] }>()

const warehouseLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`

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
	<div v-if="lines.length" class="overflow-x-auto">
		<table class="w-full min-w-[1180px] text-m">
			<thead>
				<tr class="border-b border-hairline text-left text-s text-ink-muted">
					<th class="px-3 py-2">No.</th>
					<th class="px-3 py-2">No Produk</th>
					<th class="px-3 py-2">Nama Produk</th>
					<th class="px-3 py-2">Merk</th>
					<th class="px-3 py-2">Satuan</th>
					<th class="px-3 py-2 text-right">Permintaan</th>
					<th class="px-3 py-2 text-right">Belum Terima</th>
					<th class="px-3 py-2 text-right">Sudah Terima</th>
					<th class="px-3 py-2">Jumlah</th>
					<th class="px-3 py-2">Gudang</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(line, index) in lines" :key="line.product_id" class="border-b border-hairline last:border-0">
					<td class="px-3 py-3 font-mono tnum">{{ index + 1 }}</td>
					<td class="px-3 py-3">{{ line.product_code }}</td>
					<td class="px-3 py-3">{{ line.product_name }}</td>
					<td class="px-3 py-3">{{ line.brand_name || '–' }}</td>
					<td class="px-3 py-3">{{ line.unit_name || '–' }}</td>
					<td class="px-3 py-3 text-right font-mono tnum">{{ line.ordered_quantity }}</td>
					<td class="px-3 py-3 text-right font-mono tnum">{{ line.remaining_quantity }}</td>
					<td class="px-3 py-3 text-right font-mono tnum">{{ line.received_quantity }}</td>
					<td class="min-w-[120px] px-3 py-3">
						<Input
							type="number"
							min="0"
							:max="line.remaining_quantity"
							step="0.001"
							:model-value="line.quantity"
							:disabled="disabled"
							@update:model-value="(value) => updateQuantity(index, Number(value))"
						/>
					</td>
					<td class="min-w-[220px] px-3 py-3">
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
		</table>
	</div>
	<p v-else class="rounded-md bg-canvas px-3 py-4 text-center text-s text-ink-muted">Pilih order pembelian untuk memuat daftar produk.</p>
</template>
