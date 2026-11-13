<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import { date as formatDate } from '@/utils/format'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import Input from '@/components/base/Input.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import Textarea from '@/components/base/Textarea.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import SalesOrderLines from '@/views/sales-order/components/SalesOrderLines.vue'
import SalesOrderExpenses from '@/views/sales-order/components/SalesOrderExpenses.vue'
import { discountTypeOptions, parseSalesOrder, pkpOptions, topOptions, totals } from '@/views/sales-order/schema'
import { createEmptySalesOrderDraft, DEFAULT_DEPARTMENT_LABEL, toSalesOrderRequest } from '@/views/sales-order/mappers'
import { useSalesOrderLookup } from '@/views/sales-order/composables/useSalesOrderLookup'
import type { SalesOrderDraft } from '@/views/sales-order/schema'
import type { Customer, SalesOrderRequest } from '@/utils/types'

const emit = defineEmits<{ submit: [SalesOrderRequest] }>()
const props = withDefaults(
	defineProps<{
		loading?: boolean
		initial?: SalesOrderDraft
		initialLabels?: { customer?: string; sales?: string; department?: string }
		transactionNumber?: string
		submitLabel?: string
	}>(),
	{ loading: false, submitLabel: 'Simpan' }
)
const router = useRouter()
const errors = ref<Record<string, string>>({})
const { applyCustomerDefaults } = useSalesOrderLookup()

const draft = reactive<SalesOrderDraft>(
	props.initial
		? {
				...props.initial,
				lines: props.initial.lines.map((line) => ({ ...line })),
				expenses: props.initial.expenses.map((expense) => ({ ...expense }))
			}
		: createEmptySalesOrderDraft()
)
const label = (value?: string) => value || undefined
const namedLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`
const customerLabel = (item: Record<string, unknown>) => `${(item as unknown as Customer).code} — ${(item as unknown as Customer).name}`

// Live preview only — the server recomputes every amount on save.
const summary = computed(() =>
	totals(draft.lines, draft.expenses, { pkp: draft.pkp_active, discount_type: draft.discount_type, discount_value: draft.discount_value })
)
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
	const result = parseSalesOrder(draft)
	if (!result.data) {
		errors.value = result.errors
		return
	}
	errors.value = {}
	emit('submit', toSalesOrderRequest(result.data))
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
							:model-value="draft.department_id"
							endpoint="/department"
							:option-label="namedLabel"
							:initial-label="label(initialLabels?.department) ?? (initial ? undefined : DEFAULT_DEPARTMENT_LABEL)"
							placeholder="Pilih departemen…"
							@update:model-value="(value) => (draft.department_id = value ? Number(value) : null)"
					/></FormField>
					<FormField label="Sales" required :error="errors.sales_id" hint="Salesperson yang menangani order ini"
						><AsyncSelect
							:model-value="draft.sales_id"
							endpoint="/sales"
							:option-label="namedLabel"
							:initial-label="label(initialLabels?.sales)"
							placeholder="Pilih sales…"
							@update:model-value="(value) => (draft.sales_id = value ? Number(value) : null)"
					/></FormField>
					<FormField class="md:col-span-2" label="Customer" required :error="errors.customer_id"
						><AsyncSelect
							:model-value="draft.customer_id"
							endpoint="/customer"
							:option-label="customerLabel"
							:initial-label="label(initialLabels?.customer)"
							placeholder="Cari customer…"
							@update:model-value="(value) => applyCustomerDefaults(draft, value ? Number(value) : null)"
					/></FormField>
					<FormField label="Status PKP" required :error="errors.pkp_active" hint="Terisi dari data customer, bisa diubah untuk order ini">
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
					><Textarea v-model="draft.description" :rows="2" placeholder="Keterangan sales order"
				/></FormField>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Detail Produk</h3>
				<SalesOrderLines :lines="draft.lines" :totals="summary" :pkp-active="draft.pkp_active" @update:lines="(lines) => (draft.lines = lines)" />
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

			<div class="flex flex-wrap justify-end gap-2 pt-2">
				<Button variant="secondary" type="button" @click="router.push('/sales-order')"><IconX class="h-4 w-4" /> Batal</Button>
				<Button type="submit" :loading="loading"><IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel }}</Button>
			</div>
		</form>
	</Panel>
</template>
