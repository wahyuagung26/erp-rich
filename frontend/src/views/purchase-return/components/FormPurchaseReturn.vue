<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Button from '@/components/base/Button.vue'
import PurchaseReturnLines from '@/views/purchase-return/components/PurchaseReturnLines.vue'
import { parsePurchaseReturn } from '@/views/purchase-return/schema'
import { createEmptyPurchaseReturnDraft, toPurchaseReturnRequest } from '@/views/purchase-return/mappers'
import { usePurchaseReturnInvoice } from '@/views/purchase-return/composables/usePurchaseReturnInvoice'
import type { PurchaseReturnDraft } from '@/views/purchase-return/schema'
import type { PurchaseReturnRequest } from '@/utils/types'

// Read-only context shown under the header fields — resolved from the invoice, never edited here.
interface InvoiceReference {
	supplierInvoice: string
	supplier: string
	department: string
	pkp: boolean
}

const emit = defineEmits<{ submit: [PurchaseReturnRequest] }>()
const props = withDefaults(
	defineProps<{
		loading?: boolean
		initial?: PurchaseReturnDraft
		initialLabels?: { invoice?: string; warehouse?: string }
		reference?: InvoiceReference
		// Edit: the invoice is fixed and the saved quantities are merged back into the full product list.
		returnId?: number
		transactionNumber?: string
		submitLabel?: string
		cancelTo?: string
	}>(),
	{ loading: false, submitLabel: 'Simpan', cancelTo: '/purchase-return' }
)
const router = useRouter()
const errors = ref<Record<string, string>>({})
const reference = ref<InvoiceReference | null>(props.reference ?? null)
const { applyInvoice } = usePurchaseReturnInvoice()

const draft = reactive<PurchaseReturnDraft>(
	props.initial ? { ...props.initial, lines: props.initial.lines.map((line) => ({ ...line })) } : createEmptyPurchaseReturnDraft()
)
const today = new Date().toISOString().slice(0, 10)
const invoiceLabel = (item: Record<string, unknown>) => `${String(item.number)} — ${String(item.supplier_name)}`
const warehouseLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`

function toReference(invoice: NonNullable<Awaited<ReturnType<typeof applyInvoice>>>): InvoiceReference {
	return {
		supplierInvoice: invoice.supplier_invoice_number,
		supplier: `${invoice.supplier_code} — ${invoice.supplier_name}`,
		department: `${invoice.department_code} — ${invoice.department_name}`,
		pkp: invoice.pkp_active
	}
}

async function pickInvoice(value: number | string | null) {
	const invoice = await applyInvoice(draft, value ? Number(value) : null)
	reference.value = invoice ? toReference(invoice) : null
}

// Edit: the saved return only holds returned products — reload the whole invoice and put the saved quantities back.
onMounted(async () => {
	if (!props.returnId || !props.initial?.purchase_invoice_id) return
	const keep = Object.fromEntries(props.initial.lines.map((line) => [line.product_id, line.quantity]))
	await applyInvoice(draft, props.initial.purchase_invoice_id, keep, props.returnId)
})

function submit() {
	if (props.loading) return
	const result = parsePurchaseReturn(draft)
	if (!result.data) {
		errors.value = result.errors
		return
	}
	errors.value = {}
	emit('submit', toPurchaseReturnRequest(result.data))
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
					<FormField label="Gudang" required :error="errors.warehouse_id" hint="Gudang asal barang yang diretur ke supplier">
						<AsyncSelect
							:model-value="draft.warehouse_id"
							endpoint="/warehouse"
							:option-label="warehouseLabel"
							:initial-label="initialLabels?.warehouse || undefined"
							placeholder="Cari gudang…"
							@update:model-value="(value) => (draft.warehouse_id = value ? Number(value) : null)"
						/>
					</FormField>
					<FormField
						class="md:col-span-3"
						label="Invoice Pembelian"
						required
						:error="errors.purchase_invoice_id"
						:hint="returnId ? undefined : 'Hanya invoice yang sudah disetujui; produk dan harga terisi otomatis'"
					>
						<AsyncSelect
							:model-value="draft.purchase_invoice_id"
							endpoint="/purchase-invoice"
							:params="{ approval_status: 'approved' }"
							:option-label="invoiceLabel"
							:initial-label="initialLabels?.invoice || undefined"
							placeholder="Cari invoice pembelian…"
							:disabled="Boolean(returnId)"
							@update:model-value="pickInvoice"
						/>
					</FormField>
				</div>
				<FormField label="Alasan Retur" required :error="errors.reason">
					<Textarea v-model="draft.reason" :rows="2" maxlength="250" placeholder="Mis. barang rusak saat diterima" />
				</FormField>
			</section>

			<section v-if="reference" class="space-y-3">
				<h3 class="subhead">Referensi Invoice</h3>
				<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
					<div>
						<dt class="text-s text-ink-muted">Nomor Invoice Supplier</dt>
						<dd class="mt-1 text-m text-ink">{{ reference.supplierInvoice }}</dd>
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
				<PurchaseReturnLines :lines="draft.lines" :pkp-active="draft.pkp_active" @update:lines="(lines) => (draft.lines = lines)" />
				<p v-if="errors.lines" class="text-s text-danger">{{ errors.lines }}</p>
			</section>

			<div class="flex flex-wrap justify-end gap-2 pt-2">
				<Button variant="secondary" type="button" @click="router.push(cancelTo)"><IconX class="h-4 w-4" /> Batal</Button>
				<Button type="submit" :loading="loading"><IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel }}</Button>
			</div>
		</form>
	</Panel>
</template>
