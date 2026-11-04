<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconSend, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Button from '@/components/base/Button.vue'
import AttachmentInput from '@/components/base/AttachmentInput.vue'
import { parseCashAdvance, type CashAdvanceDraft, type CashAdvanceRequest } from '@/views/cash-advance/schema'
import type { Account, CashFlow, Department } from '@/utils/types'

const emit = defineEmits<{ submit: [payload: CashAdvanceRequest] }>()
const props = defineProps<{ loading?: boolean; initialValue?: CashAdvanceDraft; submitLabel?: string }>()

const router = useRouter()
const errors = ref<Record<string, string>>({})
const isEdit = !!props.initialValue

const form = reactive<CashAdvanceDraft>(
	props.initialValue
		? { ...props.initialValue, attachments: props.initialValue.attachments.map((file) => ({ ...file })) }
		: {
				number: '',
				voucher: '',
				date: new Date().toISOString().slice(0, 10),
				department_id: null,
				recipient: '',
				description: '',
				amount: 0,
				used: 0,
				cash_account_id: 0,
				advance_account_id: 0,
				cash_flow: '',
				attachments: []
			}
)

const remaining = computed(() => Math.max(form.amount - form.used, 0))

const departmentLabel = (item: Record<string, unknown>) => {
	const department = item as unknown as Department
	return department.code + ' — ' + department.name
}
const accountLabel = (item: Record<string, unknown>) => {
	const account = item as unknown as Account
	return account.code + ' — ' + account.name
}
const cashFlowLabel = (item: Record<string, unknown>) => {
	const cashFlow = item as unknown as CashFlow
	return cashFlow.code + ' — ' + cashFlow.name
}
const cashFlowValue = (item: Record<string, unknown>) => (item as unknown as CashFlow).code

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

async function onCashAccountChange(value: number | string | null) {
	form.cash_account_id = Number(value) || 0
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

async function onAdvanceAccountChange(value: number | string | null) {
	form.advance_account_id = Number(value) || 0
	form.advance_account_code = undefined
	form.advance_account_name = undefined
	if (!form.advance_account_id) return
	try {
		const res = await api.get<{ data: Account }>('/account/' + form.advance_account_id)
		if (form.advance_account_id === res.data.data.id) {
			form.advance_account_code = res.data.data.code
			form.advance_account_name = res.data.data.name
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
	const parsed = parseCashAdvance(form)
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
				<h3 class="subhead">Informasi Uang Muka</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
					<FormField label="No. Transaksi">
						<Input :model-value="form.number" placeholder="Nomor otomatis" disabled />
					</FormField>
					<FormField label="Tanggal" required :error="errors.date">
						<DatePicker v-model="form.date" />
					</FormField>
					<FormField label="No. Voucher" required :error="errors.voucher">
						<Input v-model="form.voucher" placeholder="Nomor bukti kas keluar" />
					</FormField>
					<FormField label="Departemen" required :error="errors.department_id">
						<AsyncSelect
							:model-value="form.department_id"
							endpoint="/department"
							:option-label="departmentLabel"
							:initial-label="form.department_code ? `${form.department_code} — ${form.department_name}` : undefined"
							placeholder="Pilih departemen…"
							@update:model-value="onDepartmentChange"
						/>
					</FormField>
					<FormField label="Penerima" required :error="errors.recipient">
						<Input v-model="form.recipient" placeholder="Nama penerima uang muka" />
					</FormField>
					<FormField label="Nilai" required :error="errors.amount">
						<MoneyInput v-model="form.amount" />
					</FormField>
					<FormField class="md:col-span-2" label="Keterangan" hint="Opsional.">
						<Textarea v-model="form.description" :rows="3" placeholder="Keterangan uang muka" />
					</FormField>
					<FormField label="Lampiran" required :error="errors.attachments" hint="PDF, JPG, atau PNG. Maks. 5 MB per file, hingga 5 file.">
						<AttachmentInput v-model="form.attachments" />
					</FormField>
				</div>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Akun & Arus Kas</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
					<FormField
						label="Sumber Dana (Kas / Bank)"
						required
						:error="errors.cash_account_id"
						hint="Kas atau bank yang berkurang saat uang muka diberikan."
					>
						<AsyncSelect
							:model-value="form.cash_account_id || null"
							endpoint="/account"
							:params="{ type: 'cash_bank' }"
							:option-label="accountLabel"
							:initial-label="form.cash_account_code ? `${form.cash_account_code} — ${form.cash_account_name}` : undefined"
							placeholder="Pilih kas / bank…"
							@update:model-value="onCashAccountChange"
						/>
					</FormField>
					<FormField label="Akun Uang Muka" required :error="errors.advance_account_id">
						<AsyncSelect
							:model-value="form.advance_account_id || null"
							endpoint="/account"
							:params="{ type: 'asset' }"
							:option-label="accountLabel"
							:initial-label="form.advance_account_code ? `${form.advance_account_code} — ${form.advance_account_name}` : undefined"
							placeholder="Cari akun uang muka…"
							@update:model-value="onAdvanceAccountChange"
						/>
					</FormField>
					<FormField label="Arus Kas" hint="Opsional.">
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
			</section>

			<section v-if="isEdit" class="space-y-3">
				<h3 class="subhead">Realisasi</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
					<FormField label="Terpakai" hint="Terisi otomatis dari realisasi.">
						<MoneyInput :model-value="form.used" disabled />
					</FormField>
					<FormField label="Sisa" hint="Nilai dikurangi terpakai.">
						<MoneyInput :model-value="remaining" disabled />
					</FormField>
				</div>
			</section>

			<div class="flex flex-wrap gap-2 pt-2">
				<Button type="submit" :loading="loading"><IconSend v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan & Ajukan' }}</Button>
				<Button variant="subtle" type="button" @click="router.push('/cash-advance')"><IconX class="h-4 w-4" /> Batal</Button>
			</div>
		</form>
	</Panel>
</template>
