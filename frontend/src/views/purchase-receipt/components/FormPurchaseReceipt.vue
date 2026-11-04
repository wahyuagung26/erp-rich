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
import Button from '@/components/base/Button.vue'
import { date as formatDate } from '@/utils/format'

import PurchaseReceiptLines from '@/views/purchase-receipt/components/PurchaseReceiptLines.vue'
import { invoiceStatusLabel, parsePurchaseReceipt, receiptSummary } from '@/views/purchase-receipt/schema'
import { createEmptyPurchaseReceiptDraft, toPurchaseReceiptRequest } from '@/views/purchase-receipt/mappers'
import { usePurchaseReceiptOrder } from '@/views/purchase-receipt/composables/usePurchaseReceiptOrder'
import type { PurchaseReceiptDraft } from '@/views/purchase-receipt/schema'
import type { PurchaseReceiptInvoiceStatus, PurchaseReceiptRequest } from '@/utils/types'

interface PoReference {
	date: string
	description: string
	supplierLabel: string
}

const emit = defineEmits<{ submit: [PurchaseReceiptRequest] }>()
const props = withDefaults(
	defineProps<{
		loading?: boolean
		initial?: PurchaseReceiptDraft
		initialLabels?: { purchaseOrder?: string; department?: string }
		poReference?: PoReference
		poLocked?: boolean
		transactionNumber?: string
		invoiceStatus?: PurchaseReceiptInvoiceStatus
		submitLabel?: string
	}>(),
	{ loading: false, submitLabel: 'Simpan' }
)
const router = useRouter()
const errors = ref<Record<string, string>>({})
const poReference = ref<PoReference | null>(props.poReference ?? null)
const { applyPurchaseOrder } = usePurchaseReceiptOrder()

const draft = reactive<PurchaseReceiptDraft>(
	props.initial ? { ...props.initial, lines: props.initial.lines.map((line) => ({ ...line })) } : createEmptyPurchaseReceiptDraft()
)
const summary = computed(() => receiptSummary(draft.lines))
const today = new Date().toISOString().slice(0, 10)
const label = (value?: string) => value || undefined
const poLabel = (item: Record<string, unknown>) => `${String(item.number)} — ${String(item.supplier_name)}`
const namedLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`

async function pickPurchaseOrder(value: number | string | null) {
	const order = await applyPurchaseOrder(draft, value ? Number(value) : null)
	poReference.value = order
		? { date: order.date, description: order.description, supplierLabel: `${order.supplier_code} — ${order.supplier_name}` }
		: null
}

function pickDepartment(value: number | string | null) {
	draft.department_id = value ? Number(value) : null
}

function submit() {
	if (props.loading) return
	const result = parsePurchaseReceipt(draft)
	if (!result.data) {
		errors.value = result.errors
		return
	}
	errors.value = {}
	emit('submit', toPurchaseReceiptRequest(result.data))
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
					<FormField label="Nomor Penerimaan"><Input :model-value="transactionNumber" placeholder="Auto Generated" disabled /></FormField>
					<FormField label="Tanggal Penerimaan" required :error="errors.date"><DatePicker v-model="draft.date" :max="today" /></FormField>
					<FormField label="Status Invoice"><Input :model-value="invoiceStatusLabel[invoiceStatus ?? 'not_invoiced']" disabled /></FormField>
					<FormField class="md:col-span-2" label="Order Pembelian" required :error="errors.purchase_order_id"
						><AsyncSelect
							:model-value="draft.purchase_order_id"
							endpoint="/purchase-order"
							:params="{ approval_status: 'approved' }"
							:option-label="poLabel"
							:initial-label="label(initialLabels?.purchaseOrder)"
							placeholder="Cari order pembelian…"
							:disabled="poLocked"
							@update:model-value="pickPurchaseOrder"
					/></FormField>
					<FormField label="Departemen" required :error="errors.department_id"
						><AsyncSelect
							:model-value="draft.department_id"
							endpoint="/department"
							:option-label="namedLabel"
							:initial-label="label(initialLabels?.department)"
							placeholder="Pilih departemen…"
							@update:model-value="pickDepartment"
					/></FormField>
					<FormField label="Surat Jalan Supplier" required :error="errors.delivery_note_number"
						><Input v-model="draft.delivery_note_number" maxlength="30" placeholder="Nomor surat jalan supplier"
					/></FormField>
				</div>
				<FormField label="Keterangan" required :error="errors.description"
					><Textarea v-model="draft.description" :rows="2" maxlength="250" placeholder="Keterangan penerimaan pembelian"
				/></FormField>
			</section>

			<section v-if="poReference" class="space-y-3">
				<h3 class="subhead">Referensi Order Pembelian</h3>
				<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
					<div>
						<dt class="text-s text-ink-muted">Tanggal PO</dt>
						<dd class="mt-1 tnum">{{ formatDate(poReference.date) }}</dd>
					</div>
					<div>
						<dt class="text-s text-ink-muted">Supplier</dt>
						<dd class="mt-1">{{ poReference.supplierLabel }}</dd>
					</div>
					<div>
						<dt class="text-s text-ink-muted">Keterangan PO</dt>
						<dd class="mt-1">{{ poReference.description }}</dd>
					</div>
				</dl>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Produk</h3>
				<PurchaseReceiptLines :lines="draft.lines" @update:lines="(lines) => (draft.lines = lines)" />
				<p v-if="errors.lines || errors.form" class="text-s text-danger">{{ errors.lines ?? errors.form }}</p>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Ringkasan</h3>
				<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
					<div>
						<dt class="text-s text-ink-muted">Jumlah Produk Diterima</dt>
						<dd class="mt-1 tnum">{{ summary.productCount }}</dd>
					</div>
					<div>
						<dt class="text-s text-ink-muted">Total Kuantitas Diterima</dt>
						<dd class="mt-1 tnum">{{ summary.totalQuantity }}</dd>
					</div>
				</dl>
			</section>

			<div class="flex flex-wrap gap-2 pt-2">
				<Button type="submit" :loading="loading"><IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel }}</Button>
				<Button variant="subtle" type="button" @click="router.push('/purchase-receipt')"><IconX class="h-4 w-4" /> Batal</Button>
			</div>
		</form>
	</Panel>
</template>
