<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import { money } from '@/utils/format'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Button from '@/components/base/Button.vue'
import AttachmentInput from '@/components/base/AttachmentInput.vue'
import { parseCustomerDeposit, type CustomerDepositDraft, type CustomerDepositRequest } from '@/views/customer-deposit/schema'
import type { Account, CashFlow, Customer, Department } from '@/utils/types'

const emit = defineEmits<{ submit: [payload: CustomerDepositRequest] }>()
const props = defineProps<{ loading?: boolean; initialValue?: CustomerDepositDraft; submitLabel?: string }>()

const router = useRouter()
const errors = ref<Record<string, string>>({})

// Default department is FAT (Legacy default); the edit flow overwrites from initialValue.
const form = reactive<CustomerDepositDraft>(
	props.initialValue
		? { ...props.initialValue, attachment: props.initialValue.attachment && { ...props.initialValue.attachment } }
		: {
				number: '',
				date: new Date().toISOString().slice(0, 10),
				department_id: 4,
				department_code: 'FAT',
				department_name: 'FAT',
				customer_id: null,
				amount: 0,
				used: 0,
				cash_account_id: null,
				cash_flow: '',
				description: '',
				attachment: null
			}
)

// Customer is fixed once invoices have taken from the deposit.
const hasUsage = computed(() => form.used > 0)

// The shared picker works on a list; this form keeps a single attachment.
const attachments = computed({
	get: () => (form.attachment ? [form.attachment] : []),
	set: (files) => (form.attachment = files[0] ?? null)
})

const departmentLabel = (item: Record<string, unknown>) => (item as unknown as Department).name
const customerLabel = (item: Record<string, unknown>) => {
	const customer = item as unknown as Customer
	return customer.code + ' — ' + customer.name
}
const accountLabel = (item: Record<string, unknown>) => {
	const account = item as unknown as Account
	return account.code + ' — ' + account.name
}
const cashFlowLabel = (item: Record<string, unknown>) => {
	const cashFlow = item as unknown as CashFlow
	return cashFlow.code + ' — ' + cashFlow.name
}
const cashFlowValue = (item: Record<string, unknown>) => String((item as unknown as CashFlow).code)

async function onDepartmentChange(value: number | string | null) {
	form.department_id = value ? Number(value) : null
	form.department_code = undefined
	form.department_name = undefined
	if (!form.department_id) return
	try {
		const res = await api.get<{ data: Department }>('/department/' + form.department_id)
		if (form.department_id === res.data.data.id) {
			form.department_code = res.data.data.code
			form.department_name = res.data.data.name
		}
	} catch {
		// The submit endpoint remains the final authority.
	}
}

async function onCustomerChange(value: number | string | null) {
	form.customer_id = value ? Number(value) : null
	form.customer_code = undefined
	form.customer_name = undefined
	if (!form.customer_id) return
	try {
		const res = await api.get<{ data: Customer }>('/customer/' + form.customer_id)
		if (form.customer_id === res.data.data.id) {
			form.customer_code = res.data.data.code
			form.customer_name = res.data.data.name
		}
	} catch {
		// The submit endpoint remains the final authority.
	}
}

async function onCashAccountChange(value: number | string | null) {
	form.cash_account_id = value ? Number(value) : null
	form.cash_account_code = undefined
	form.cash_account_name = undefined
	if (!form.cash_account_id) return
	try {
		const res = await api.get<{ data: Account }>('/account/' + form.cash_account_id)
		if (form.cash_account_id === res.data.data.id) {
			form.cash_account_code = res.data.data.code
			form.cash_account_name = res.data.data.name
		}
	} catch {
		// The submit endpoint remains the final authority.
	}
}

async function onCashFlowChange(value: number | string | null) {
	form.cash_flow = value ? String(value) : ''
	form.cash_flow_name = undefined
	if (!form.cash_flow) return
	try {
		const res = await api.get<{ data: CashFlow[] }>('/cash-flow', { params: { q: form.cash_flow, per_page: 20 } })
		form.cash_flow_name = res.data.data.find((flow) => flow.code === form.cash_flow)?.name
	} catch {
		// The submit endpoint remains the final authority.
	}
}

function submit() {
	if (props.loading) return
	const parsed = parseCustomerDeposit(form)
	errors.value = parsed.errors ?? {}
	if (parsed.data) emit('submit', parsed.data)
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
					<FormField label="Nomor">
						<Input :model-value="form.number" placeholder="Auto Generated" disabled />
					</FormField>
					<FormField label="Tanggal" required :error="errors.date">
						<DatePicker v-model="form.date" />
					</FormField>
					<FormField label="Departemen" required :error="errors.department_id">
						<AsyncSelect
							:model-value="form.department_id"
							endpoint="/department"
							:option-label="departmentLabel"
							:initial-label="form.department_name"
							placeholder="Pilih departemen…"
							@update:model-value="onDepartmentChange"
						/>
					</FormField>
					<FormField
						class="md:col-span-3"
						label="Customer"
						required
						:error="errors.customer_id"
						:hint="hasUsage ? 'Tidak bisa diganti karena titipan sudah dipakai di Invoice Penjualan' : 'Customer yang menitipkan dana'"
					>
						<AsyncSelect
							:model-value="form.customer_id"
							endpoint="/customer"
							:option-label="customerLabel"
							:initial-label="form.customer_code ? `${form.customer_code} — ${form.customer_name}` : undefined"
							:disabled="hasUsage"
							placeholder="Cari customer…"
							@update:model-value="onCustomerChange"
						/>
					</FormField>
				</div>
				<FormField label="Keterangan">
					<Textarea v-model="form.description" :rows="2" placeholder="Keterangan titipan customer" />
				</FormField>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Pembayaran</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
					<FormField
						label="Nominal"
						required
						:error="errors.amount"
						:hint="hasUsage ? `Sudah dipakai Rp ${money(form.used)}, nominal tidak boleh kurang dari itu` : undefined"
					>
						<MoneyInput v-model="form.amount" blank-zero placeholder="0" />
					</FormField>
					<FormField label="Akun Kas / Bank" required :error="errors.cash_account_id" hint="Akun tempat dana titipan diterima">
						<AsyncSelect
							:model-value="form.cash_account_id"
							endpoint="/account"
							:params="{ type: 'cash_bank' }"
							:option-label="accountLabel"
							:initial-label="form.cash_account_code ? `${form.cash_account_code} — ${form.cash_account_name}` : undefined"
							placeholder="Cari akun kas/bank…"
							@update:model-value="onCashAccountChange"
						/>
					</FormField>
					<FormField label="Arus Kas" :error="errors.cash_flow">
						<AsyncSelect
							:model-value="form.cash_flow || null"
							endpoint="/cash-flow"
							:option-label="cashFlowLabel"
							:option-value="cashFlowValue"
							:initial-label="form.cash_flow ? `${form.cash_flow} — ${form.cash_flow_name ?? form.cash_flow}` : undefined"
							placeholder="Cari arus kas…"
							@update:model-value="onCashFlowChange"
						/>
					</FormField>
				</div>
				<FormField label="Lampiran" required :error="errors.attachment" hint="Bukti transfer dari customer. PDF, JPG, atau PNG, maksimal 5 MB.">
					<AttachmentInput v-model="attachments" :max-files="1" />
				</FormField>
			</section>

			<div class="flex flex-wrap justify-end gap-2 pt-2">
				<Button variant="secondary" type="button" @click="router.push('/customer-deposit')"><IconX class="h-4 w-4" /> Batal</Button>
				<Button type="submit" :loading="loading"><IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }}</Button>
			</div>
		</form>
	</Panel>
</template>
