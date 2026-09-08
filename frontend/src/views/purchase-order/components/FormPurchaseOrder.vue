<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import Amount from '@/components/base/Amount.vue'

import PurchaseOrderLines from '@/views/purchase-order/components/PurchaseOrderLines.vue'
import { parsePurchaseOrder, pkpOptions, purchaseTypeOptions, totals } from '@/views/purchase-order/schema'
import { createEmptyPurchaseOrderDraft, toPurchaseOrderRequest } from '@/views/purchase-order/mappers'
import { usePurchaseOrderSupplier } from '@/views/purchase-order/composables/usePurchaseOrderSupplier'
import type { PurchaseOrderDraft } from '@/views/purchase-order/schema'
import type { PurchaseOrderRequest, Supplier } from '@/utils/types'

const emit = defineEmits<{ submit: [PurchaseOrderRequest] }>()
const props = withDefaults(
	defineProps<{
		loading?: boolean
		initial?: PurchaseOrderDraft
		initialLabels?: { supplier?: string; department?: string; warehouse?: string }
		transactionNumber?: string
		submitLabel?: string
	}>(),
	{ loading: false, submitLabel: 'Simpan' }
)
const router = useRouter()
const errors = ref<Record<string, string>>({})
const { applySupplierDefaults } = usePurchaseOrderSupplier()

const draft = reactive<PurchaseOrderDraft>(
	props.initial ? { ...props.initial, lines: props.initial.lines.map((line) => ({ ...line })) } : createEmptyPurchaseOrderDraft()
)
const summary = computed(() => totals(draft.lines, draft.pkp_active))
const label = (value?: string) => value || undefined
const namedLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`
const supplierLabel = (item: Record<string, unknown>) =>
	`${String((item as unknown as Supplier).code)} — ${String((item as unknown as Supplier).name)}`

async function pickSupplier(value: number | string | null) {
	await applySupplierDefaults(draft, value ? Number(value) : null)
}

function pickDepartment(value: number | string | null) {
	draft.department_id = value ? Number(value) : null
}

function pickWarehouse(value: number | string | null) {
	draft.warehouse_id = value ? Number(value) : null
}

function submit() {
	if (props.loading) return
	const result = parsePurchaseOrder(draft)
	if (!result.data) {
		errors.value = result.errors
		return
	}
	errors.value = {}
	emit('submit', toPurchaseOrderRequest(result.data))
}

function setServerErrors(serverErrors: Record<string, string[]>) {
	errors.value = { ...errors.value, ...Object.fromEntries(Object.entries(serverErrors).map(([key, messages]) => [key, messages[0]])) }
}

defineExpose({ setServerErrors })
</script>

<template>
	<Panel>
		<form class="space-y-8" @submit.prevent="submit">
			<section class="space-y-3">
				<h3 class="subhead">Informasi Transaksi</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
					<FormField label="Nomor Transaksi"><Input :model-value="transactionNumber" placeholder="Auto Generated" disabled /></FormField>
					<FormField label="Tanggal" required :error="errors.date"><DatePicker v-model="draft.date" /></FormField>
					<FormField label="Departemen" required :error="errors.department_id"
						><AsyncSelect
							:model-value="draft.department_id"
							endpoint="/department"
							:option-label="namedLabel"
							:initial-label="label(initialLabels?.department)"
							placeholder="Pilih departemen…"
							@update:model-value="pickDepartment"
					/></FormField>
					<FormField class="md:col-span-2" label="Supplier" required :error="errors.supplier_id"
						><AsyncSelect
							:model-value="draft.supplier_id"
							endpoint="/supplier"
							:option-label="supplierLabel"
							:initial-label="label(initialLabels?.supplier)"
							placeholder="Cari supplier…"
							@update:model-value="pickSupplier"
					/></FormField>
					<FormField label="Gudang" required :error="errors.warehouse_id"
						><AsyncSelect
							:model-value="draft.warehouse_id"
							endpoint="/warehouse"
							:option-label="namedLabel"
							:initial-label="label(initialLabels?.warehouse)"
							placeholder="Pilih gudang…"
							@update:model-value="pickWarehouse"
					/></FormField>
					<FormField label="Jenis Pembelian"
						><Select
							:model-value="draft.purchase_type ?? undefined"
							:options="purchaseTypeOptions"
							placeholder="Pilih jenis pembelian…"
							@update:model-value="(value) => (draft.purchase_type = value ? String(value) : null)"
					/></FormField>
					<FormField label="Status PKP" required :error="errors.pkp_active">
						<Select
							:model-value="String(draft.pkp_active)"
							:options="pkpOptions"
							:disabled="!draft.supplier_id"
							@update:model-value="(value) => (draft.pkp_active = value === 'true')"
						/>
					</FormField>
				</div>
				<FormField label="Alamat" required :error="errors.address"
					><Textarea v-model="draft.address" :rows="2" placeholder="Alamat pengiriman"
				/></FormField>
				<FormField label="Keterangan" required :error="errors.description"
					><Textarea v-model="draft.description" :rows="2" placeholder="Keterangan order pembelian"
				/></FormField>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Produk</h3>
				<PurchaseOrderLines
					:lines="draft.lines"
					:supplier-id="draft.supplier_id"
					:pkp-active="draft.pkp_active"
					@update:lines="(lines) => (draft.lines = lines)"
				/>
				<p v-if="errors.lines" class="text-s text-danger">{{ errors.lines }}</p>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Ringkasan</h3>
				<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-4">
					<div>
						<dt class="text-s text-ink-muted">DPP</dt>
						<dd class="mt-1"><Amount :value="summary.dpp" /></dd>
					</div>
					<div>
						<dt class="text-s text-ink-muted">PPN</dt>
						<dd class="mt-1"><Amount :value="summary.ppn" /></dd>
					</div>
					<div>
						<dt class="text-s text-ink-muted">Nett</dt>
						<dd class="mt-1"><Amount :value="summary.nett" /></dd>
					</div>
					<div>
						<dt class="text-s text-ink-muted">Total PO</dt>
						<dd class="mt-1"><Amount :value="summary.total" /></dd>
					</div>
				</dl>
			</section>

			<div class="flex flex-wrap gap-2 pt-2">
				<Button type="submit" :loading="loading"><IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel }}</Button>
				<Button variant="subtle" type="button" @click="router.push('/purchase-order')"><IconX class="h-4 w-4" /> Batal</Button>
			</div>
		</form>
	</Panel>
</template>
