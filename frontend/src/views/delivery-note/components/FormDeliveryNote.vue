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
import { date as formatDate } from '@/utils/format'

import DeliveryNoteLines from '@/views/delivery-note/components/DeliveryNoteLines.vue'
import { validateDeliveryNote } from '@/views/delivery-note/schema'
import { createEmptyDeliveryNoteDraft, toDeliveryNoteRequest } from '@/views/delivery-note/mappers'
import { useDeliveryNoteInvoice } from '@/views/delivery-note/composables/useDeliveryNoteInvoice'
import type { DeliveryNoteDraft } from '@/views/delivery-note/schema'
import type { DeliveryNoteRequest } from '@/utils/types'

interface InvoiceReference {
	number: string
	date: string
	customerLabel: string
	departmentLabel: string
}

const emit = defineEmits<{ submit: [DeliveryNoteRequest] }>()
const props = withDefaults(
	defineProps<{
		loading?: boolean
		initial?: DeliveryNoteDraft
		initialInvoiceLabel?: string
		invoiceReference?: InvoiceReference
		invoiceLocked?: boolean
		presetInvoiceId?: number | null
		transactionNumber?: string
		submitLabel?: string
	}>(),
	{ loading: false, submitLabel: 'Simpan' }
)
const router = useRouter()
const errors = ref<Record<string, string>>({})
const reference = ref<InvoiceReference | null>(props.invoiceReference ?? null)
const invoiceLabel = ref(props.initialInvoiceLabel)
const { applyInvoice } = useDeliveryNoteInvoice()

const draft = reactive<DeliveryNoteDraft>(
	props.initial ? { ...props.initial, lines: props.initial.lines.map((line) => ({ ...line })) } : createEmptyDeliveryNoteDraft()
)
const today = new Date().toISOString().slice(0, 10)
const invoiceOption = (item: Record<string, unknown>) => `${String(item.number)} — ${String(item.customer_name)}`

async function pickInvoice(value: number | string | null) {
	const invoice = await applyInvoice(draft, value ? Number(value) : null)
	invoiceLabel.value = invoice ? `${invoice.number} — ${invoice.customer_name}` : undefined
	reference.value = invoice
		? {
				number: invoice.number,
				date: invoice.date,
				customerLabel: `${invoice.customer_code} — ${invoice.customer_name}`,
				departmentLabel: `${invoice.department_code} — ${invoice.department_name}`
			}
		: null
}

// Arriving from an invoice (`?sales_invoice_id=`) behaves like picking it.
onMounted(() => {
	if (props.presetInvoiceId) pickInvoice(props.presetInvoiceId)
})

function submit() {
	if (props.loading) return
	const found = validateDeliveryNote(draft)
	if (found) {
		errors.value = found
		return
	}
	errors.value = {}
	emit('submit', toDeliveryNoteRequest(draft))
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
				<h3 class="subhead">Informasi Surat Jalan</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
					<FormField label="Nomor" help="Nomor dibuat otomatis oleh sistem saat data disimpan."
						><Input :model-value="transactionNumber" placeholder="Auto Generated" disabled
					/></FormField>
					<FormField label="Tanggal" required :error="errors.date" hint="Tanggal barang dikirim"
						><DatePicker v-model="draft.date" :max="today"
					/></FormField>
					<FormField
						label="Invoice Penjualan"
						required
						:error="errors.sales_invoice_id"
						:hint="invoiceLocked ? undefined : 'Hanya invoice yang sudah disetujui dan belum punya surat jalan; satu invoice satu surat jalan'"
						:help="
							invoiceLocked
								? 'Tidak bisa diganti karena surat jalan sudah dibuat untuk invoice ini. Hapus surat jalan lalu buat baru bila salah pilih.'
								: undefined
						"
						><AsyncSelect
							:model-value="draft.sales_invoice_id"
							endpoint="/delivery-note/deliverable-invoices"
							:option-label="invoiceOption"
							:initial-label="invoiceLabel"
							placeholder="Cari invoice penjualan…"
							:disabled="invoiceLocked"
							@update:model-value="pickInvoice"
					/></FormField>
				</div>
			</section>

			<section v-if="reference" class="space-y-3">
				<h3 class="subhead">Referensi Invoice</h3>
				<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
					<div>
						<dt class="text-s text-ink-muted">Customer</dt>
						<dd class="mt-1 text-m text-ink">{{ reference.customerLabel }}</dd>
					</div>
					<div>
						<dt class="text-s text-ink-muted">Tanggal Invoice</dt>
						<dd class="mt-1 text-m text-ink">{{ formatDate(reference.date) }}</dd>
					</div>
					<div>
						<dt class="text-s text-ink-muted">Departemen</dt>
						<dd class="mt-1 text-m text-ink">{{ reference.departmentLabel }}</dd>
					</div>
				</dl>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Pengiriman</h3>
				<FormField
					label="Alamat Pengiriman"
					required
					:error="errors.delivery_address"
					hint="Terisi otomatis dari alamat customer, bisa diubah untuk pengiriman ini"
					><Textarea v-model="draft.delivery_address" :rows="2" maxlength="250" placeholder="Alamat tujuan pengiriman"
				/></FormField>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
					<FormField label="Nama Penerima" :error="errors.recipient" hint="Orang yang menerima barang di tujuan"
						><Input v-model="draft.recipient" maxlength="100" placeholder="Nama penerima"
					/></FormField>
					<FormField label="Nama Driver" :error="errors.driver" hint="Pengirim yang membawa barang"
						><Input v-model="draft.driver" maxlength="100" placeholder="Nama driver"
					/></FormField>
					<FormField label="No. Kendaraan" :error="errors.vehicle"
						><Input v-model="draft.vehicle" maxlength="50" placeholder="Contoh: L 1234 AB" class="max-w-[200px]"
					/></FormField>
				</div>
				<FormField label="Keterangan" :error="errors.description"
					><Textarea v-model="draft.description" :rows="2" maxlength="250" placeholder="Keterangan surat jalan"
				/></FormField>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Detail Produk</h3>
				<DeliveryNoteLines :lines="draft.lines" @update:lines="(lines) => (draft.lines = lines)" />
				<p v-if="errors.lines || errors.form" class="text-s text-danger">{{ errors.lines ?? errors.form }}</p>
			</section>

			<div class="flex flex-wrap justify-end gap-2 pt-2">
				<Button variant="secondary" type="button" @click="router.push('/delivery-note')"><IconX class="h-4 w-4" /> Batal</Button>
				<Button type="submit" :loading="loading"><IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel }}</Button>
			</div>
		</form>
	</Panel>
</template>
