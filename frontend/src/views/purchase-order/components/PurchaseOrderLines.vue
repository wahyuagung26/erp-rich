<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { IconCheck, IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import Input from '@/components/base/Input.vue'
import Button from '@/components/base/Button.vue'
import Amount from '@/components/base/Amount.vue'
import type { Product } from '@/utils/types'
import { lineTotal, totals, validatePurchaseOrderLine, type PurchaseOrderLineDraft } from '@/views/purchase-order/schema'
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

const summary = computed(() => totals(props.lines, props.pkpActive))

function calculated(line: PurchaseOrderLineDraft) {
	return lineTotal(line, props.pkpActive)
}
</script>

<template>
	<div class="space-y-2">
		<div class="overflow-x-auto">
			<table class="w-full min-w-[960px] text-m">
				<thead>
					<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
						<th class="px-2 py-2">Produk<span class="text-danger">*</span></th>
						<th class="px-2 py-2 text-right">Jumlah<span class="text-danger">*</span></th>
						<th class="px-2 py-2 text-right">Harga Satuan<span class="text-danger">*</span></th>
						<th class="px-2 py-2 text-right">Diskon</th>
						<th class="min-w-[110px] px-2 py-2 text-right">DPP</th>
						<th class="min-w-[110px] px-2 py-2 text-right">PPN</th>
						<th class="min-w-[110px] px-2 py-2 text-right">Total</th>
						<th v-if="!disabled" class="px-2 py-2 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					<tr v-if="!disabled" class="border-b border-hairline align-top">
						<td class="min-w-[240px] px-2 py-2">
							<AsyncSelect
								:model-value="draft.product_id"
								endpoint="/product"
								:option-label="productLabel"
								:initial-label="draft.product_code ? `${draft.product_code} — ${draft.product_name}` : undefined"
								:placeholder="supplierId ? 'Cari produk…' : 'Pilih supplier dahulu…'"
								:disabled="!supplierId"
								@update:model-value="onProductChange"
							/>
						</td>
						<td class="min-w-[130px] px-2 py-2">
							<Input
								v-model.number="draft.quantity"
								type="number"
								min="0.001"
								step="0.001"
								align="right"
								:addon="draft.unit_name"
								@keydown.enter.prevent="save"
							/>
						</td>
						<td class="min-w-[150px] px-2 py-2">
							<MoneyInput v-model="draft.price" blank-zero placeholder="0" @keydown.enter.prevent="save" />
						</td>
						<td class="min-w-[150px] px-2 py-2">
							<MoneyInput v-model="draft.discount" blank-zero placeholder="0" @keydown.enter.prevent="save" />
						</td>
						<!-- live preview of the row being entered -->
						<td class="px-2 py-4 text-right"><Amount v-if="draft.product_id" muted :value="calculated(draft).dpp" /></td>
						<td class="px-2 py-4 text-right"><Amount v-if="draft.product_id" muted :value="calculated(draft).ppn" /></td>
						<td class="px-2 py-4 text-right"><Amount v-if="draft.product_id" muted :value="calculated(draft).total" /></td>
						<td class="px-2 py-2">
							<div class="flex justify-end gap-1">
								<Button type="button" size="sm" variant="secondary" :title="editingIndex === null ? 'Tambah produk' : 'Simpan produk'" @click="save">
									<component :is="editingIndex === null ? IconPlus : IconCheck" class="h-4 w-4" />
								</Button>
								<Button v-if="editingIndex !== null" type="button" size="sm" variant="subtle" title="Batal edit" @click="reset">
									<IconX class="h-4 w-4" />
								</Button>
							</div>
						</td>
					</tr>
					<tr v-if="!lines.length">
						<td :colspan="disabled ? 7 : 8" class="px-3 py-6 text-center text-s text-ink-muted">
							Belum ada produk. Isi baris di atas, lalu tekan Enter atau tombol +.
						</td>
					</tr>
					<tr
						v-for="(line, index) in lines"
						:key="`${line.product_id}-${index}`"
						class="border-b border-hairline last:border-0"
						:class="{ 'bg-primary/5': editingIndex === index }"
					>
						<td class="px-2 py-3">
							<div class="text-ink">{{ line.product_name }}</div>
							<div class="text-s text-ink-muted">{{ line.product_code }}{{ line.brand_name ? ` · ${line.brand_name}` : '' }}</div>
						</td>
						<td class="px-2 py-3 text-right">
							<div class="tnum text-ink">{{ line.quantity }}</div>
							<div v-if="line.unit_name" class="text-s text-ink-muted">{{ line.unit_name }}</div>
						</td>
						<td class="px-2 py-3 text-right"><Amount :value="line.price" /></td>
						<td class="px-2 py-3 text-right"><Amount :value="line.discount" /></td>
						<td class="px-2 py-3 text-right"><Amount :value="calculated(line).dpp" /></td>
						<td class="px-2 py-3 text-right"><Amount :value="calculated(line).ppn" /></td>
						<td class="px-2 py-3 text-right"><Amount :value="calculated(line).total" /></td>
						<td v-if="!disabled" class="px-2 py-3">
							<div class="flex justify-end gap-1">
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
					</tr>
				</tbody>
				<tfoot v-if="lines.length">
					<tr class="bg-fill font-semibold text-ink [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md">
						<td colspan="4" class="px-2 py-2.5 text-right text-ink-muted">Total PO</td>
						<td class="px-2 py-2.5 text-right"><Amount :value="summary.dpp" /></td>
						<td class="px-2 py-2.5 text-right"><Amount :value="summary.ppn" /></td>
						<td class="px-2 py-2.5 text-right text-l"><Amount :value="summary.total" /></td>
						<td v-if="!disabled" />
					</tr>
				</tfoot>
			</table>
		</div>
		<p v-if="errors" class="text-s text-danger">{{ errors }}</p>
	</div>
</template>
