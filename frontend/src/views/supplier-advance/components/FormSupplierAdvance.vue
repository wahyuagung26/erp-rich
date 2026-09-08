<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconPaperclip, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import RiwayatPemakaian from '@/views/supplier-advance/components/RiwayatPemakaian.vue'
import { advanceTypeOptions, type SupplierAdvanceForm } from '@/views/supplier-advance/schema'
import type { Account, CashFlow, Department, Supplier } from '@/utils/types'

const emit = defineEmits<{ submit: [payload: SupplierAdvanceForm] }>()
const props = withDefaults(
	defineProps<{ loading?: boolean; initialValue?: SupplierAdvanceForm; submitLabel?: string; advanceId?: number | null }>(),
	{ advanceId: null }
)

const router = useRouter()
const toast = useToast()
const errors = ref<Record<string, string>>({})

// Default department is FAT (Legacy default); the edit flow overwrites from initialValue.
const form = reactive<SupplierAdvanceForm>(
	props.initialValue
		? { ...props.initialValue, attachment: props.initialValue.attachment && { ...props.initialValue.attachment } }
		: {
				number: '',
				date: new Date().toISOString().slice(0, 10),
				department_id: 4,
				department_code: 'FAT',
				department_name: 'FAT',
				supplier_id: null,
				amount: 0,
				used: 0,
				cash_account_id: null,
				advance_type: 'TITIPAN-PO',
				cash_flow: '',
				description: '',
				attachment: null
			}
)

const remaining = computed(() => Math.max(form.amount - form.used, 0))

const departmentLabel = (item: Record<string, unknown>) => (item as unknown as Department).name
const supplierLabel = (item: Record<string, unknown>) => {
	const supplier = item as unknown as Supplier
	return supplier.code + ' — ' + supplier.name
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

async function onSupplierChange(value: number | string | null) {
	form.supplier_id = value ? Number(value) : null
	form.supplier_code = undefined
	form.supplier_name = undefined
	if (!form.supplier_id) return
	try {
		const res = await api.get<{ data: Supplier }>('/supplier/' + form.supplier_id)
		if (form.supplier_id === res.data.data.id) {
			form.supplier_code = res.data.data.code
			form.supplier_name = res.data.data.name
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

const MAX_ATTACHMENT = 5 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

function onAttachmentPick(event: Event) {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	if (!file) return
	if (!ALLOWED_TYPES.includes(file.type)) {
		toast.error('Lampiran harus berupa PDF, JPG, JPEG, atau PNG')
		input.value = ''
		return
	}
	if (file.size > MAX_ATTACHMENT) {
		toast.error('Ukuran lampiran maksimal 5 MB')
		input.value = ''
		return
	}
	const reader = new FileReader()
	reader.onload = () => {
		// ponytail: keep prototype attachments as data URLs; switch to multipart upload when the backend exists.
		form.attachment = { name: file.name, type: file.type, size: file.size, data_url: String(reader.result) }
	}
	reader.onerror = () => toast.error('Lampiran tidak dapat dibaca')
	reader.readAsDataURL(file)
}
function removeAttachment() {
	form.attachment = null
}

function validate(): boolean {
	const next: Record<string, string> = {}
	if (!form.date) next.date = 'Tanggal wajib diisi'
	if (!form.department_id) next.department = 'Departemen wajib dipilih'
	if (!form.supplier_id) next.supplier = 'Supplier wajib dipilih'
	if (!form.amount || form.amount <= 0) next.amount = 'Nominal wajib diisi'
	if (!form.cash_account_id) next.cash_account = 'Akun kas/bank wajib dipilih'
	if (!form.advance_type.trim()) next.advance_type = 'Jenis uang muka wajib dipilih'
	if (!form.attachment) next.attachment = 'Lampiran wajib diunggah'
	errors.value = next
	return !Object.keys(next).length
}

function submit() {
	if (props.loading || !validate()) return
	emit('submit', {
		...form,
		department_id: form.department_id,
		supplier_id: form.supplier_id,
		cash_account_id: form.cash_account_id,
		amount: Number(form.amount) || 0,
		used: Number(form.used) || 0
	})
}
</script>

<template>
	<Panel>
		<form class="space-y-8" @submit.prevent="submit">
			<section class="space-y-3">
				<h3 class="subhead">Informasi Transaksi</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
					<FormField label="Nomor Transaksi">
						<Input :model-value="form.number" placeholder="Auto Generated" disabled />
					</FormField>
					<FormField label="Tanggal" required :error="errors.date">
						<DatePicker v-model="form.date" />
					</FormField>
					<FormField label="Departemen" required :error="errors.department">
						<AsyncSelect
							:model-value="form.department_id"
							endpoint="/department"
							:option-label="departmentLabel"
							:initial-label="form.department_name"
							placeholder="Pilih departemen…"
							@update:model-value="onDepartmentChange"
						/>
					</FormField>
					<FormField class="md:col-span-2" label="Supplier" required :error="errors.supplier">
						<AsyncSelect
							:model-value="form.supplier_id"
							endpoint="/supplier"
							:option-label="supplierLabel"
							:initial-label="form.supplier_code ? `${form.supplier_code} — ${form.supplier_name}` : undefined"
							placeholder="Cari supplier…"
							@update:model-value="onSupplierChange"
						/>
					</FormField>
				</div>
				<FormField label="Keterangan">
					<Textarea v-model="form.description" :rows="2" placeholder="Keterangan uang muka supplier" />
				</FormField>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Pembayaran dan Saldo</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
					<FormField label="Nominal" required :error="errors.amount">
						<MoneyInput v-model="form.amount" />
					</FormField>
					<FormField label="Terpakai">
						<MoneyInput :model-value="form.used" disabled />
					</FormField>
					<FormField label="Saldo Tersedia">
						<MoneyInput :model-value="remaining" disabled />
					</FormField>
					<FormField label="Akun Kas / Bank" required :error="errors.cash_account">
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
					<FormField label="Jenis Uang Muka" required :error="errors.advance_type">
						<Select v-model="form.advance_type" :options="advanceTypeOptions" placeholder="Pilih Jenis Uang Muka" />
					</FormField>
					<FormField label="Arus Kas">
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
					<FormField class="md:col-span-3" label="Lampiran" required :error="errors.attachment" hint="PDF, JPG, JPEG, atau PNG. Maksimal 5 MB.">
						<div v-if="form.attachment" class="flex items-center gap-2 rounded-md bg-fill px-3 py-2 text-s">
							<IconPaperclip class="h-4 w-4 shrink-0 text-primary" />
							<span class="min-w-0 flex-1 truncate text-ink">{{ form.attachment.name }}</span>
							<button type="button" class="text-danger hover:underline" @click="removeAttachment">Hapus</button>
						</div>
						<input
							v-else
							type="file"
							accept="application/pdf,image/jpeg,image/png"
							class="block w-full text-s text-ink-muted file:mr-2 file:rounded-md file:border-0 file:bg-fill file:px-3 file:py-2 file:text-s file:text-ink"
							@change="onAttachmentPick"
						/>
					</FormField>
				</div>
			</section>

			<RiwayatPemakaian :advance-id="advanceId" />

			<div class="flex flex-wrap gap-2 pt-2">
				<Button type="submit" :loading="loading"><IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }}</Button>
				<Button variant="subtle" type="button" @click="router.push('/supplier-advance')"><IconX class="h-4 w-4" /> Batal</Button>
			</div>
		</form>
	</Panel>
</template>
