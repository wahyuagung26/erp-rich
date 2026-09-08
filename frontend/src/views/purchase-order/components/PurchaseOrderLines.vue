<script setup lang="ts">
import { reactive, ref } from 'vue'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import FormField from '@/components/base/FormField.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import Input from '@/components/base/Input.vue'
import Button from '@/components/base/Button.vue'
import Amount from '@/components/base/Amount.vue'
import type { Product } from '@/utils/types'
import { lineTotal, validatePurchaseOrderLine, type PurchaseOrderLineDraft } from '@/views/purchase-order/schema'
import { usePurchaseOrderProduct } from '@/views/purchase-order/composables/usePurchaseOrderProduct'

const props = defineProps<{ lines: PurchaseOrderLineDraft[]; supplierId: number | null; pkpActive: boolean; disabled?: boolean }>()
const emit = defineEmits<{ 'update:lines': [PurchaseOrderLineDraft[]] }>()
const { applyProduct } = usePurchaseOrderProduct()
const errors = ref('')
const editingIndex = ref<number | null>(null)
const draft = reactive<PurchaseOrderLineDraft>({ product_id: null, quantity: 1, price: 0, discount: 0 })

const productLabel = (item: Record<string, unknown>) => {
	const product = item as unknown as Product
	return `${product.code} — ${product.name}`
}

function onProductChange(value: number | string | null) {
	applyProduct(draft, value ? Number(value) : null)
}

function reset() {
	Object.assign(draft, {
		product_id: null,
		product_code: undefined,
		product_name: undefined,
		brand_name: undefined,
		unit_name: undefined,
		quantity: 1,
		price: 0,
		discount: 0
	})
	editingIndex.value = null
	errors.value = ''
}

function save() {
	if (!props.supplierId) return (errors.value = 'Pilih supplier sebelum menambahkan produk')
	const validationError = validatePurchaseOrderLine(draft)
	if (validationError) return (errors.value = validationError)
	const next = [...props.lines]
	if (editingIndex.value === null) next.push({ ...draft })
	else next[editingIndex.value] = { ...draft }
	emit('update:lines', next)
	reset()
}

function edit(index: number) {
	Object.assign(draft, props.lines[index])
	editingIndex.value = index
	errors.value = ''
}

function remove(index: number) {
	emit(
		'update:lines',
		props.lines.filter((_, itemIndex) => itemIndex !== index)
	)
	if (editingIndex.value === index) reset()
}

function calculated(line: PurchaseOrderLineDraft) {
	return lineTotal(line, props.pkpActive)
}
</script>

<template>
	<div class="space-y-4">
		<div class="grid gap-4 xl:grid-cols-[minmax(240px,1.7fr)_minmax(130px,0.8fr)_minmax(160px,1fr)_minmax(140px,0.8fr)_minmax(150px,1fr)]">
			<FormField label="Produk" required>
				<AsyncSelect
					:model-value="draft.product_id"
					endpoint="/product"
					:option-label="productLabel"
					:initial-label="draft.product_code ? `${draft.product_code} — ${draft.product_name}` : undefined"
					placeholder="Cari produk…"
					:disabled="disabled || !supplierId"
					@update:model-value="onProductChange"
				/>
			</FormField>
			<FormField label="Kode Produk"><Input :model-value="draft.product_code" disabled /></FormField>
			<FormField label="Nama Produk"><Input :model-value="draft.product_name" disabled /></FormField>
			<FormField label="Merk"><Input :model-value="draft.brand_name" disabled /></FormField>
			<FormField label="Satuan"><Input :model-value="draft.unit_name" disabled /></FormField>
		</div>
		<div class="grid gap-4 md:grid-cols-5">
			<FormField label="Jumlah" required
				><Input v-model.number="draft.quantity" type="number" min="0.001" step="0.001" :disabled="disabled"
			/></FormField>
			<FormField label="Harga Satuan" required><MoneyInput v-model="draft.price" :disabled="disabled" /></FormField>
			<FormField label="Diskon"><MoneyInput v-model="draft.discount" :disabled="disabled" /></FormField>
			<div v-if="!disabled" class="flex items-end gap-2">
				<Button type="button" size="sm" variant="secondary" @click="save"
					><IconPlus class="h-4 w-4" /> {{ editingIndex === null ? 'Tambah' : 'Simpan' }}</Button
				>
				<Button v-if="editingIndex !== null" type="button" size="sm" variant="subtle" @click="reset">Batal</Button>
			</div>
		</div>
		<p v-if="errors" class="text-s text-danger">{{ errors }}</p>
		<div v-if="lines.length" class="overflow-x-auto">
			<table class="w-full min-w-[1120px] text-m">
				<thead>
					<tr class="border-b border-hairline text-left text-s text-ink-muted">
						<th class="px-3 py-2">No.</th>
						<th class="px-3 py-2">Aksi</th>
						<th class="px-3 py-2">Kode Produk</th>
						<th class="px-3 py-2">Nama Produk</th>
						<th class="px-3 py-2">Merk</th>
						<th class="px-3 py-2">Satuan</th>
						<th class="px-3 py-2 text-right">Jumlah</th>
						<th class="px-3 py-2 text-right">Harga Satuan</th>
						<th class="px-3 py-2 text-right">Diskon</th>
						<th class="px-3 py-2 text-right">DPP</th>
						<th class="px-3 py-2 text-right">PPN</th>
						<th class="px-3 py-2 text-right">Total</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(line, index) in lines" :key="`${line.product_id}-${index}`" class="border-b border-hairline last:border-0">
						<td class="px-3 py-3 font-mono tnum">{{ index + 1 }}</td>
						<td class="px-3 py-3">
							<div v-if="!disabled" class="flex gap-1">
								<button
									type="button"
									class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
									title="Edit produk"
									@click="edit(index)"
								>
									<IconPencil class="h-4 w-4" />
								</button>
								<button
									type="button"
									class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
									title="Hapus produk"
									@click="remove(index)"
								>
									<IconTrash class="h-4 w-4" />
								</button>
							</div>
						</td>
						<td class="px-3 py-3">{{ line.product_code }}</td>
						<td class="px-3 py-3">{{ line.product_name }}</td>
						<td class="px-3 py-3">{{ line.brand_name || '–' }}</td>
						<td class="px-3 py-3">{{ line.unit_name || '–' }}</td>
						<td class="px-3 py-3 text-right font-mono tnum">{{ line.quantity }}</td>
						<td class="px-3 py-3 text-right"><Amount :value="line.price" /></td>
						<td class="px-3 py-3 text-right"><Amount :value="line.discount" /></td>
						<td class="px-3 py-3 text-right"><Amount :value="calculated(line).dpp" /></td>
						<td class="px-3 py-3 text-right"><Amount :value="calculated(line).ppn" /></td>
						<td class="px-3 py-3 text-right"><Amount :value="calculated(line).total" /></td>
					</tr>
				</tbody>
			</table>
		</div>
		<p v-else class="rounded-md bg-canvas px-3 py-4 text-center text-s text-ink-muted">Belum ada produk. Tambahkan minimal satu produk.</p>
	</div>
</template>
