<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Button from '@/components/base/Button.vue'
import PurchaseInvoiceLines from '@/views/purchase-invoice/components/PurchaseInvoiceLines.vue'
import { parsePurchaseInvoice } from '@/views/purchase-invoice/schema'
import { createEmptyPurchaseInvoiceDraft, toPurchaseInvoiceRequest } from '@/views/purchase-invoice/mappers'
import { usePurchaseInvoiceReceipt } from '@/views/purchase-invoice/composables/usePurchaseInvoiceReceipt'
import type { PurchaseInvoiceDraft } from '@/views/purchase-invoice/schema'
import type { PurchaseInvoiceRequest } from '@/utils/types'

// Read-only context shown under the header fields — resolved from the receipt/PO, never edited here.
interface ReceiptReference {
	purchaseOrder: string
	supplier: string
	department: string
	pkp: boolean
}

const emit = defineEmits<{ submit: [PurchaseInvoiceRequest] }>()
const props = withDefaults(
	defineProps<{
		loading?: boolean
		initial?: PurchaseInvoiceDraft
		initialLabels?: { receipt?: string }
		reference?: ReceiptReference
		receiptLocked?: boolean
		transactionNumber?: string
		submitLabel?: string
	}>(),
	{ loading: false, submitLabel: 'Simpan' }
)
const router = useRouter()
const errors = ref<Record<string, string>>({})
const reference = ref<ReceiptReference | null>(props.reference ?? null)
const { applyReceipt } = usePurchaseInvoiceReceipt()

const draft = reactive<PurchaseInvoiceDraft>(
	props.initial ? { ...props.initial, lines: props.initial.lines.map((line) => ({ ...line })) } : createEmptyPurchaseInvoiceDraft()
)
const today = new Date().toISOString().slice(0, 10)
const receiptLabel = (item: Record<string, unknown>) => `${String(item.number)} — ${String(item.supplier_name)}`

async function pickReceipt(value: number | string | null) {
	const receipt = await applyReceipt(draft, value ? Number(value) : null)
	reference.value = receipt
		? {
				purchaseOrder: receipt.purchase_order_number ?? '–',
				supplier: `${receipt.supplier_code} — ${receipt.supplier_name}`,
				department: `${receipt.department_code} — ${receipt.department_name}`,
				pkp: receipt.pkp_active
			}
		: null
}

function submit() {
	if (props.loading) return
	const result = parsePurchaseInvoice(draft)
	if (!result.data) {
		errors.value = result.errors
		return
	}
	errors.value = {}
	emit('submit', toPurchaseInvoiceRequest(result.data))
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
					<FormField label="Nomor"><Input :model-value="transactionNumber" placeholder="Auto Generated" disabled /></FormField>
					<FormField label="Tanggal" required :error="errors.date"><DatePicker v-model="draft.date" :max="today" /></FormField>
					<FormField
						label="Nomor Invoice Supplier"
						required
						:error="errors.supplier_invoice_number"
						hint="Nomor tagihan yang tertera di invoice dari supplier"
					>
						<Input v-model="draft.supplier_invoice_number" maxlength="30" placeholder="Nomor invoice supplier" />
					</FormField>
					<FormField
						class="md:col-span-3"
						label="Penerimaan Pembelian"
						required
						:error="errors.purchase_receipt_id"
						:hint="receiptLocked ? undefined : 'Hanya penerimaan yang belum dibuat invoice; produk dan harga terisi otomatis'"
					>
						<AsyncSelect
							:model-value="draft.purchase_receipt_id"
							endpoint="/purchase-receipt"
							:params="{ invoice_status: 'not_invoiced' }"
							:option-label="receiptLabel"
							:initial-label="initialLabels?.receipt || undefined"
							placeholder="Cari penerimaan pembelian…"
							:disabled="receiptLocked"
							@update:model-value="pickReceipt"
						/>
					</FormField>
				</div>
				<FormField label="Keterangan" :error="errors.description">
					<Textarea v-model="draft.description" :rows="2" maxlength="250" placeholder="Keterangan invoice pembelian" />
				</FormField>
			</section>

			<section v-if="reference" class="space-y-3">
				<h3 class="subhead">Referensi Penerimaan</h3>
				<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
					<div>
						<dt class="text-s text-ink-muted">Order Pembelian</dt>
						<dd class="mt-1 text-m text-ink">{{ reference.purchaseOrder }}</dd>
					</div>
					<div>
						<dt class="text-s text-ink-muted">Supplier</dt>
						<dd class="mt-1 text-m text-ink">
							{{ reference.supplier }}
							<span class="text-s text-ink-muted">({{ reference.pkp ? 'PKP Aktif' : 'Non-PKP' }})</span>
						</dd>
					</div>
					<div>
						<dt class="text-s text-ink-muted">Departemen</dt>
						<dd class="mt-1 text-m text-ink">{{ reference.department }}</dd>
					</div>
				</dl>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Detail Produk</h3>
				<PurchaseInvoiceLines :lines="draft.lines" :pkp-active="draft.pkp_active" @update:lines="(lines) => (draft.lines = lines)" />
				<p v-if="errors.lines || errors.form" class="text-s text-danger">{{ errors.lines ?? errors.form }}</p>
			</section>

			<div class="flex flex-wrap justify-end gap-2 pt-2">
				<Button variant="secondary" type="button" @click="router.push('/purchase-invoice')"><IconX class="h-4 w-4" /> Batal</Button>
				<Button type="submit" :loading="loading"><IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel }}</Button>
			</div>
		</form>
	</Panel>
</template>
