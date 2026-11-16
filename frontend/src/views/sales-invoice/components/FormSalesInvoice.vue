<script setup lang="ts">
import HelpTip from '@/components/base/HelpTip.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import { date as formatDate } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import Input from '@/components/base/Input.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import Textarea from '@/components/base/Textarea.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import ReferencePicker from '@/components/common/ReferencePicker.vue'
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import SalesInvoiceLines from '@/views/sales-invoice/components/SalesInvoiceLines.vue'
import SalesInvoicePayments from '@/views/sales-invoice/components/SalesInvoicePayments.vue'
import SalesOrderExpenses from '@/views/sales-order/components/SalesOrderExpenses.vue'
import { discountTypeOptions, parseSalesInvoice, pkpOptions, topOptions, totals } from '@/views/sales-invoice/schema'
import { createEmptySalesInvoiceDraft, DEFAULT_DEPARTMENT_LABEL, toSalesInvoiceRequest } from '@/views/sales-invoice/mappers'
import { useSalesInvoiceLookup } from '@/views/sales-invoice/composables/useSalesInvoiceLookup'
import type { SalesInvoiceDraft } from '@/views/sales-invoice/schema'
import type { Customer, PickerColumn, SalesInvoiceRequest } from '@/utils/types'

const emit = defineEmits<{ submit: [SalesInvoiceRequest] }>()
const props = withDefaults(
	defineProps<{
		loading?: boolean
		initial?: SalesInvoiceDraft
		initialLabels?: { customer?: string; sales?: string; department?: string; salesOrder?: string }
		salesOrderId?: number | null // prefill from `?sales_order_id=` on a new invoice
		transactionNumber?: string
		submitLabel?: string
	}>(),
	{ loading: false, submitLabel: 'Simpan' }
)
const router = useRouter()
const toast = useToast()
const errors = ref<Record<string, string>>({})
const { applyCustomerDefaults, applySalesOrder } = useSalesInvoiceLookup()
// The sales order link is chosen on a new invoice only; the stored one is fixed (docs/sales-invoice/update-sales-invoice.md).
const orderFixed = Boolean(props.initial?.sales_order_id)

const draft = reactive<SalesInvoiceDraft>(
	props.initial
		? {
				...props.initial,
				lines: props.initial.lines.map((line) => ({ ...line })),
				expenses: props.initial.expenses.map((expense) => ({ ...expense })),
				payments: props.initial.payments.map((payment) => ({ ...payment }))
			}
		: createEmptySalesInvoiceDraft()
)
// Products that can be invoiced from the linked order, each with its ceiling — never shrinks while the form is open.
const orderLabel = ref(props.initialLabels?.salesOrder)
// Labels of the picked masters; a Sales Order prefill replaces them and `version` remounts the pickers so they show the new labels.
const labels = reactive({
	customer: props.initialLabels?.customer,
	sales: props.initialLabels?.sales,
	department: props.initialLabels?.department ?? (props.initial ? undefined : DEFAULT_DEPARTMENT_LABEL)
})
const version = ref(0)
const loadingOrder = ref(false)
const hasOrder = computed(() => draft.sales_order_id !== null)

const namedLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`
const customerLabel = (item: Record<string, unknown>) => `${(item as unknown as Customer).code} — ${(item as unknown as Customer).name}`
const orderOptionLabel = (item: Record<string, unknown>) => `${String(item.number)} — ${String(item.customer_name)}`
const orderColumns: PickerColumn[] = [
	{ label: 'Nomor SO', field: 'number' },
	{ label: 'Tanggal', field: 'date', kind: 'date' },
	{ label: 'Customer', field: 'customer_name' },
	{ label: 'Sales', field: 'sales_name' },
	{ label: 'Keterangan', field: 'description' },
	{ label: 'Total', field: 'total', kind: 'money' }
]

async function pickOrder(orderId: number | null) {
	if (!orderId) {
		Object.assign(draft, { sales_order_id: null, lines: [], expenses: [] })
		orderLabel.value = undefined
		version.value++
		return
	}
	loadingOrder.value = true
	const result = await applySalesOrder(draft, orderId)
	loadingOrder.value = false
	if (result.data) {
		orderLabel.value = `${result.data.number} — ${result.data.customer_name}`
		Object.assign(labels, {
			customer: `${result.data.customer_code} — ${result.data.customer_name}`,
			sales: `${result.data.sales_code} — ${result.data.sales_name}`,
			department: `${result.data.department_code} — ${result.data.department_name}`
		})
		version.value++
		errors.value = {}
	} else {
		toast.error(result.error ?? 'Sales order tidak dapat dimuat')
		Object.assign(draft, { sales_order_id: null })
		orderLabel.value = undefined
		version.value++
	}
}

onMounted(() => {
	if (props.salesOrderId && !props.initial) pickOrder(props.salesOrderId)
})

// A titipan belongs to one customer, so switching customer drops the titipan payments.
async function pickCustomer(customerId: number | null) {
	if (draft.customer_id !== customerId) draft.payments = draft.payments.filter((payment) => payment.method !== 'down_payment')
	await applyCustomerDefaults(draft, customerId)
}

// Live preview only — the server recomputes every amount on save.
const summary = computed(() =>
	totals(draft.lines, draft.expenses, { pkp: draft.pkp_active, discount_type: draft.discount_type, discount_value: draft.discount_value })
)
const paid = computed(() => draft.payments.reduce((sum, payment) => sum + payment.amount, 0))
const dueDate = computed(() => {
	const d = new Date(`${draft.date}T00:00:00`)
	d.setDate(d.getDate() + draft.top_days)
	return Number.isNaN(d.getTime()) ? '-' : formatDate(d)
})

function setDiscountType(value: string) {
	draft.discount_type = value === 'percent' ? 'percent' : 'nominal'
	draft.discount_value = 0
}

function submit() {
	if (props.loading) return
	const result = parseSalesInvoice(draft)
	if (!result.data) {
		errors.value = result.errors
		return
	}
	errors.value = {}
	emit('submit', toSalesInvoiceRequest(result.data))
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
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 lg:grid-cols-4">
					<FormField label="Nomor" help="Nomor dibuat otomatis oleh sistem saat data disimpan."
						><Input :model-value="transactionNumber" placeholder="Auto Generated" disabled
					/></FormField>
					<FormField label="Tanggal" required :error="errors.date"><DatePicker v-model="draft.date" /></FormField>
					<FormField label="Departemen" required :error="errors.department_id"
						><AsyncSelect
							:key="`department-${version}`"
							:model-value="draft.department_id"
							endpoint="/department"
							:option-label="namedLabel"
							:initial-label="labels.department"
							placeholder="Pilih departemen…"
							@update:model-value="(value) => (draft.department_id = value ? Number(value) : null)"
					/></FormField>
					<FormField label="Sales" required :error="errors.sales_id" hint="Salesperson yang menangani invoice ini"
						><AsyncSelect
							:key="`sales-${version}`"
							:model-value="draft.sales_id"
							endpoint="/sales"
							:option-label="namedLabel"
							:initial-label="labels.sales"
							placeholder="Pilih sales…"
							@update:model-value="(value) => (draft.sales_id = value ? Number(value) : null)"
					/></FormField>
					<FormField
						class="md:col-span-2"
						label="Sales Order"
						:error="errors.sales_order_id"
						hint="Opsional — menyalin seluruh isi sales order; satu sales order hanya untuk satu invoice"
						:help="
							orderFixed
								? [
										'Tidak bisa diganti karena invoice ini dibuat dari sales order tersebut.',
										'Buat invoice baru bila ingin memakai sales order lain.'
									]
								: undefined
						"
					>
						<ReferencePicker
							:key="`order-${version}`"
							:model-value="draft.sales_order_id"
							endpoint="/sales-order"
							:params="{ approval_status: 'approved', invoice_status: 'not_invoiced' }"
							:columns="orderColumns"
							:reset-warning="
								draft.lines.length || draft.expenses.length
									? 'Produk dan biaya yang sudah terisi akan direset. Bila memilih sales order lain, data header (customer, sales, departemen, diskon) ikut diganti.'
									: undefined
							"
							title="Pilih Sales Order"
							:option-label="orderOptionLabel"
							:initial-label="orderLabel"
							:disabled="orderFixed || loadingOrder"
							placeholder="Tanpa sales order — invoice langsung"
							@update:model-value="(value) => pickOrder(value ? Number(value) : null)"
						/>
					</FormField>
					<FormField
						class="md:col-span-2"
						label="Customer"
						required
						:error="errors.customer_id"
						:help="hasOrder ? ['Mengikuti customer pada sales order.', 'Kosongkan sales order bila ingin memilih customer lain.'] : undefined"
						><AsyncSelect
							:key="`customer-${version}`"
							:model-value="draft.customer_id"
							endpoint="/customer"
							:option-label="customerLabel"
							:initial-label="labels.customer"
							:disabled="hasOrder"
							placeholder="Cari customer…"
							@update:model-value="(value) => pickCustomer(value ? Number(value) : null)"
					/></FormField>
					<FormField label="Status PKP" required :error="errors.pkp_active" hint="Terisi dari data customer, bisa diubah untuk invoice ini">
						<Select
							:model-value="String(draft.pkp_active)"
							:options="pkpOptions"
							@update:model-value="(value) => (draft.pkp_active = value === 'true')"
						/>
					</FormField>
					<FormField label="Termin Pembayaran" required :error="errors.top_days" :hint="`Jatuh tempo: ${dueDate}`">
						<Select :model-value="draft.top_days" :options="topOptions" @update:model-value="(value) => (draft.top_days = Number(value))" />
					</FormField>
				</div>
				<FormField label="Keterangan" :error="errors.description"
					><Textarea v-model="draft.description" :rows="2" placeholder="Keterangan invoice"
				/></FormField>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Detail Produk</h3>
				<SalesInvoiceLines
					:lines="draft.lines"
					:totals="summary"
					:pkp-active="draft.pkp_active"
					:paid="paid"
					@update:lines="(lines) => (draft.lines = lines)"
				/>
				<p v-if="errors.lines" class="text-s text-danger">{{ errors.lines }}</p>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Diskon & Biaya Penjualan</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 lg:grid-cols-4">
					<FormField label="Jenis Diskon Global" hint="Dikurangkan dari subtotal produk, sebelum PPN"
						><Select :model-value="draft.discount_type" :options="discountTypeOptions" @update:model-value="setDiscountType"
					/></FormField>
					<FormField :label="draft.discount_type === 'percent' ? 'Diskon Global (%)' : 'Diskon Global (Rp)'" :error="errors.discount_value">
						<Input
							v-if="draft.discount_type === 'percent'"
							v-model.number="draft.discount_value"
							type="number"
							min="0"
							max="100"
							step="0.01"
							align="right"
							addon="%"
						/>
						<MoneyInput v-else v-model="draft.discount_value" blank-zero placeholder="0" />
					</FormField>
				</div>
				<p class="pt-2 text-s font-medium text-ink-muted">Biaya Penjualan</p>
				<SalesOrderExpenses :expenses="draft.expenses" @update:expenses="(expenses) => (draft.expenses = expenses)" />
				<p v-if="errors.expenses" class="text-s text-danger">{{ errors.expenses }}</p>
			</section>

			<section class="space-y-3">
				<div class="flex items-center gap-1">
					<h3 class="subhead">Pembayaran dengan Invoice</h3>
					<HelpTip
						:text="[
							'Isi bila customer sudah membayar saat invoice dibuat (tunai, titipan, atau biaya).',
							'Pembayaran berikutnya dicatat lewat Piutang Customer.'
						]"
					/>
				</div>
				<SalesInvoicePayments
					:payments="draft.payments"
					:customer-id="draft.customer_id"
					:balance="summary.total - paid"
					@update:payments="(payments) => (draft.payments = payments)"
				/>
				<p v-if="errors.payments" class="text-s text-danger">{{ errors.payments }}</p>
			</section>

			<div class="flex flex-wrap justify-end gap-2 pt-2">
				<Button variant="secondary" type="button" @click="router.push('/sales-invoice')"><IconX class="h-4 w-4" /> Batal</Button>
				<Button type="submit" :loading="loading"><IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel }}</Button>
			</div>
		</form>
	</Panel>
</template>
