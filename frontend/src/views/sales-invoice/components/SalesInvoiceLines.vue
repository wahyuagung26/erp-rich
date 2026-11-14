<script setup lang="ts">
import VariantName from '@/components/common/VariantName.vue'
import VariantSelect from '@/components/common/VariantSelect.vue'
import { computed, reactive, ref } from 'vue'
import { IconCheck, IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import Input from '@/components/base/Input.vue'
import Button from '@/components/base/Button.vue'
import Amount from '@/components/base/Amount.vue'
import SalesTotalRows from '@/components/common/SalesTotalRows.vue'
import { lineTotal, type SalesInvoiceLineDraft, type SalesInvoiceTotals } from '@/views/sales-invoice/schema'
import { validateSalesOrderLine } from '@/views/sales-order/schema'
import { useSalesInvoiceLookup } from '@/views/sales-invoice/composables/useSalesInvoiceLookup'

const props = defineProps<{
	lines: SalesInvoiceLineDraft[]
	totals: SalesInvoiceTotals
	pkpActive: boolean
	paid?: number
}>()
const emit = defineEmits<{ 'update:lines': [SalesInvoiceLineDraft[]] }>()
const { applyVariant } = useSalesInvoiceLookup()
const errors = ref('')
const editingIndex = ref<number | null>(null)
// The warehouse of the last saved line is the next entry's default — most invoices ship from one warehouse.
const lastWarehouse = ref<{ id: number | null; label?: string }>({
	id: props.lines.at(-1)?.warehouse_id ?? null,
	label: props.lines.at(-1)?.warehouse_label
})
const draft = reactive<SalesInvoiceLineDraft>(blank())

function blank(): SalesInvoiceLineDraft {
	return {
		variant_id: null,
		warehouse_id: lastWarehouse.value.id,
		warehouse_label: lastWarehouse.value.label,
		quantity: 1,
		price: 0,
		discount: 0,
		notes: ''
	}
}

const warehouseLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`

function reset() {
	Object.assign(draft, blank(), {
		product_code: undefined,
		product_name: undefined,
		sku: undefined,
		variant_label: undefined,
		brand_name: undefined,
		unit_name: undefined
	})
	editingIndex.value = null
	errors.value = ''
}

function pickWarehouse(item: Record<string, unknown> | null) {
	draft.warehouse_label = item ? warehouseLabel(item) : undefined
}

function save() {
	const validationError = validateSalesOrderLine(draft)
	if (validationError) return (errors.value = validationError)
	if (props.lines.some((line, index) => line.variant_id === draft.variant_id && index !== editingIndex.value))
		return (errors.value = 'Varian produk ini sudah ada di daftar, ubah baris yang sudah ada')
	const next = [...props.lines]
	if (editingIndex.value === null) next.push({ ...draft })
	else next[editingIndex.value] = { ...draft }
	lastWarehouse.value = { id: draft.warehouse_id, label: draft.warehouse_label }
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

const preview = computed(() => lineTotal(draft))
</script>

<template>
	<div class="space-y-2">
		<div class="overflow-x-auto">
			<table class="w-full min-w-[1040px] text-m">
				<thead>
					<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
						<th class="px-2 py-2">Produk<span class="text-danger">*</span></th>
						<th class="px-2 py-2">Gudang<span class="text-danger">*</span></th>
						<th class="px-2 py-2 text-right">Jumlah<span class="text-danger">*</span></th>
						<th class="px-2 py-2 text-right">Harga Satuan<span class="text-danger">*</span></th>
						<th class="px-2 py-2 text-right">Diskon / Satuan</th>
						<th class="min-w-[120px] px-2 py-2 text-right">Total</th>
						<th class="px-2 py-2 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					<tr class="border-b border-hairline align-top">
						<td class="min-w-[250px] space-y-1.5 px-2 py-2">
							<VariantSelect
								:model-value="draft.variant_id"
								:sku="draft.sku"
								:name="draft.product_name"
								:label="draft.variant_label"
								@select="(row) => applyVariant(draft, row)"
							/>
							<Input v-model="draft.notes" placeholder="Keterangan baris (opsional)" @keydown.enter.prevent="save" />
						</td>
						<td class="min-w-[190px] px-2 py-2">
							<AsyncSelect
								:model-value="draft.warehouse_id"
								endpoint="/warehouse"
								:option-label="warehouseLabel"
								:initial-label="draft.warehouse_label"
								placeholder="Pilih gudang…"
								@update:model-value="(value) => (draft.warehouse_id = value ? Number(value) : null)"
								@select="pickWarehouse"
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
						<td class="min-w-[150px] px-2 py-2"><MoneyInput v-model="draft.price" blank-zero placeholder="0" @keydown.enter.prevent="save" /></td>
						<td class="min-w-[140px] px-2 py-2"><MoneyInput v-model="draft.discount" blank-zero placeholder="0" @keydown.enter.prevent="save" /></td>
						<!-- live preview of the row being entered -->
						<td class="px-2 py-4 text-right"><Amount v-if="draft.variant_id" muted :value="preview" /></td>
						<td class="px-2 py-2">
							<div class="flex justify-end gap-1">
								<Button type="button" size="sm" variant="secondary" :title="editingIndex === null ? 'Tambah produk' : 'Simpan produk'" @click="save">
									<component :is="editingIndex === null ? IconPlus : IconCheck" class="h-4 w-4" />
								</Button>
								<Button v-if="editingIndex !== null" type="button" size="sm" variant="subtle" title="Batal edit" @click="reset"
									><IconX class="h-4 w-4"
								/></Button>
							</div>
						</td>
					</tr>
					<tr v-if="!lines.length">
						<td colspan="7" class="px-3 py-6 text-center text-s text-ink-muted">
							Belum ada produk. Isi baris di atas, lalu tekan Enter atau tombol +.
						</td>
					</tr>
					<tr
						v-for="(line, index) in lines"
						:key="`${line.variant_id}-${index}`"
						class="border-b border-hairline last:border-0"
						:class="{ 'bg-primary/5': editingIndex === index }"
					>
						<td class="px-2 py-3">
							<VariantName :name="line.product_name" :sku="line.sku" :label="line.variant_label" :brand="line.brand_name" />
							<div v-if="line.notes" class="text-s text-ink-muted">{{ line.notes }}</div>
						</td>
						<td class="px-2 py-3 text-ink">{{ line.warehouse_label }}</td>
						<td class="px-2 py-3 text-right">
							<div class="tnum text-ink">{{ line.quantity }}</div>
							<div v-if="line.unit_name" class="text-s text-ink-muted">{{ line.unit_name }}</div>
						</td>
						<td class="px-2 py-3 text-right"><Amount :value="line.price" /></td>
						<td class="px-2 py-3 text-right"><Amount :value="line.discount" /></td>
						<td class="px-2 py-3 text-right"><Amount :value="lineTotal(line)" /></td>
						<td class="px-2 py-3">
							<div class="flex justify-end gap-1">
								<Button type="button" size="sm" variant="subtle" title="Edit produk" @click="edit(index)"><IconPencil class="h-4 w-4" /></Button>
								<Button type="button" size="sm" variant="subtle" title="Hapus produk" @click="remove(index)"><IconTrash class="h-4 w-4" /></Button>
							</div>
						</td>
					</tr>
				</tbody>
				<tfoot v-if="lines.length">
					<SalesTotalRows :totals="totals" :pkp="pkpActive" :paid="paid" total-label="Total Invoice" :label-span="5" :trailing="1" />
				</tfoot>
			</table>
		</div>
		<p v-if="errors" class="text-s text-danger">{{ errors }}</p>
	</div>
</template>
