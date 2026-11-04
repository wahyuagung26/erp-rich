<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconPaperclip, IconPencil, IconPlus, IconSend, IconTrash, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import Amount from '@/components/base/Amount.vue'
import type { JournalForm, JournalFormLine } from '@/views/journal/schema'
import type { Account, CashFlow, Department } from '@/utils/types'

const emit = defineEmits<{ submit: [payload: JournalForm] }>()
const props = defineProps<{ loading?: boolean; initialValue?: JournalForm; submitLabel?: string }>()

const router = useRouter()
const toast = useToast()
const errors = ref<Record<string, string>>({})

function setServerErrors(serverErrors: Record<string, string[]>) {
	errors.value = Object.fromEntries(Object.entries(serverErrors).map(([key, messages]) => [key, messages[0] ?? 'Tidak valid']))
}

defineExpose({ setServerErrors })

const form = reactive<JournalForm>(
	props.initialValue
		? // Shallow-copy the form + its lines so edits don't mutate the caller's object.
			// structuredClone chokes on Vue reactive proxies; a line has no nested objects.
			{
				...props.initialValue,
				attachment: props.initialValue.attachment && { ...props.initialValue.attachment },
				lines: props.initialValue.lines.map((line) => ({ ...line }))
			}
		: {
				number: '',
				date: new Date().toISOString().slice(0, 10),
				voucher: '',
				description: '',
				attachment: null,
				lines: []
			}
)

const totalDebit = computed(() => form.lines.reduce((sum, line) => sum + line.debit, 0))
const totalCredit = computed(() => form.lines.reduce((sum, line) => sum + line.credit, 0))
const balanced = computed(() => totalDebit.value > 0 && totalDebit.value === totalCredit.value)
const editingIndex = ref<number | null>(null)

function blank(): JournalFormLine {
	return { account_id: 0, department_id: null, cash_flow: null, detail_description: '', debit: 0, credit: 0 }
}

const lineDraft = reactive<JournalFormLine>(blank())

const accountLabel = (item: Record<string, unknown>) => {
	const account = item as unknown as Account
	return account.code + ' — ' + account.name
}
const departmentLabel = (item: Record<string, unknown>) => {
	const department = item as unknown as Department
	return department.code + ' — ' + department.name
}
const cashFlowLabel = (item: Record<string, unknown>) => {
	const cashFlow = item as unknown as CashFlow
	return cashFlow.code + ' — ' + cashFlow.name
}
const cashFlowValue = (item: Record<string, unknown>) => (item as unknown as CashFlow).code

async function onAccountChange(line: JournalFormLine, value: number | string | null) {
	line.account_id = Number(value) || 0
	line.account_type = undefined
	line.account_code = undefined
	line.account_name = undefined
	line.cash_flow = null
	line.cash_flow_name = undefined
	if (!line.account_id) return
	await loadAccount(line)
}

async function loadAccount(line: JournalFormLine) {
	try {
		const res = await api.get<{ data: Account }>('/account/' + line.account_id)
		if (line.account_id === res.data.data.id) {
			line.account_type = res.data.data.type
			line.account_code = res.data.data.code
			line.account_name = res.data.data.name
		}
	} catch {
		// The submit endpoint remains the final authority for account validity.
	}
}

async function onDepartmentChange(line: JournalFormLine, value: number | string | null) {
	line.department_id = value ? Number(value) : null
	line.department_code = undefined
	line.department_name = undefined
	if (!line.department_id) return
	try {
		const res = await api.get<{ data: Department }>('/department/' + line.department_id)
		if (line.department_id === res.data.data.id) {
			line.department_code = res.data.data.code
			line.department_name = res.data.data.name
		}
	} catch {
		// The submit endpoint remains the final authority for department validity.
	}
}

async function onCashFlowChange(line: JournalFormLine, value: number | string | null) {
	line.cash_flow = value ? String(value) : null
	line.cash_flow_name = undefined
	if (!line.cash_flow) return
	try {
		const res = await api.get<{ data: CashFlow[] }>('/cash-flow', { params: { q: line.cash_flow, per_page: 20 } })
		line.cash_flow_name = res.data.data.find((flow) => flow.code === line.cash_flow)?.name
	} catch {
		// The submit endpoint remains the final authority for cash-flow validity.
	}
}

const cashFlowRequired = (line: JournalFormLine) => line.account_type === 'cash_bank'

function onDebit(line: JournalFormLine, value: number) {
	line.debit = value
	if (value) line.credit = 0
}
function onCredit(line: JournalFormLine, value: number) {
	line.credit = value
	if (value) line.debit = 0
}

const MAX_ATTACHMENT = 5 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

function onAttachmentPick(event: Event) {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	if (!file) return
	if (!ALLOWED_TYPES.includes(file.type)) {
		toast.error('Lampiran harus berupa PDF, JPG, atau PNG')
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

function draftError(field: 'account' | 'cash_flow' | 'amount') {
	return errors.value['draft.' + field]
}

function lineValidation(line: JournalFormLine, prefix: string) {
	const next: Record<string, string> = {}
	if (!line.account_id) next[prefix + '.account'] = 'Akun wajib dipilih'
	if (cashFlowRequired(line) && !line.cash_flow) next[prefix + '.cash_flow'] = 'Arus kas wajib untuk akun kas/bank'
	if (line.debit < 0 || line.credit < 0) next[prefix + '.amount'] = 'Nominal tidak boleh negatif'
	if (line.debit > 0 && line.credit > 0) next[prefix + '.amount'] = 'Isi debit atau kredit saja'
	if (!line.debit && !line.credit) next[prefix + '.amount'] = 'Debit atau kredit wajib diisi'
	return next
}

const draftHasInput = computed(() =>
	Boolean(
		lineDraft.account_id ||
		lineDraft.department_id ||
		lineDraft.cash_flow ||
		lineDraft.detail_description?.trim() ||
		lineDraft.debit ||
		lineDraft.credit
	)
)

function clearDraftErrors() {
	const next = { ...errors.value }
	Object.keys(next)
		.filter((key) => key.startsWith('draft.'))
		.forEach((key) => delete next[key])
	errors.value = next
}

function resetDraft() {
	Object.assign(lineDraft, blank())
	editingIndex.value = null
	clearDraftErrors()
}

async function saveDetail() {
	if (lineDraft.account_id && !lineDraft.account_type) await loadAccount(lineDraft)
	const lineErrors = lineValidation(lineDraft, 'draft')
	clearDraftErrors()
	if (Object.keys(lineErrors).length) {
		errors.value = { ...errors.value, ...lineErrors }
		return
	}
	if (editingIndex.value === null) form.lines.push({ ...lineDraft })
	else form.lines[editingIndex.value] = { ...lineDraft }
	resetDraft()
}

function editDetail(index: number) {
	Object.assign(lineDraft, { ...form.lines[index] })
	editingIndex.value = index
	clearDraftErrors()
}

function removeDetail(index: number) {
	form.lines.splice(index, 1)
	if (editingIndex.value === index) resetDraft()
	else if (editingIndex.value !== null && editingIndex.value > index) editingIndex.value -= 1
}

function validate(): boolean {
	const next: Record<string, string> = {}
	if (!form.date) next.date = 'Tanggal wajib diisi'
	if (!form.voucher.trim()) next.voucher = 'Voucher wajib diisi'
	if (!form.description.trim()) next.description = 'Keterangan wajib diisi'
	if (!form.attachment) next.attachment = 'Lampiran wajib diunggah'
	if (!form.lines.length) next.lines = 'Minimal satu detail jurnal harus ditambahkan'
	if (draftHasInput.value) next.draft = 'Simpan detail terlebih dahulu sebelum mengajukan jurnal'

	form.lines.forEach((line, index) => Object.assign(next, lineValidation(line, 'lines.' + index)))
	if (!balanced.value) next.balance = 'Total debit dan kredit harus sama dan lebih dari nol'

	errors.value = next
	return !Object.keys(next).length
}

function submit() {
	if (props.loading || !validate()) return
	emit('submit', {
		...form,
		lines: form.lines.map(({ account_type: _accountType, ...line }) => ({ ...line, account_id: Number(line.account_id) }))
	})
}
</script>

<template>
	<!-- One card, like every other form page. Left edge lines up with the page title. -->
	<Panel>
		<form class="space-y-8" @submit.prevent="submit">
			<section class="space-y-3">
				<h3 class="subhead">Informasi Jurnal</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
					<FormField label="No. Transaksi" :error="errors.number" hint="Kosongkan untuk nomor otomatis.">
						<Input v-model="form.number" placeholder="Nomor otomatis" />
					</FormField>
					<FormField label="Tanggal" required :error="errors.date">
						<DatePicker v-model="form.date" />
					</FormField>
					<FormField label="Voucher" required :error="errors.voucher">
						<Input v-model="form.voucher" placeholder="Nomor / referensi voucher" />
					</FormField>
					<FormField class="md:col-span-2" label="Keterangan" required :error="errors.description">
						<Textarea v-model="form.description" :rows="3" placeholder="Keterangan jurnal" />
					</FormField>
					<FormField label="Lampiran" required :error="errors.attachment" hint="PDF, JPG, atau PNG. Maksimal 5 MB.">
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

			<section class="space-y-3">
				<h3 class="subhead">Tambah Detail</h3>
				<div class="grid gap-4 xl:grid-cols-[minmax(220px,1.4fr)_minmax(180px,1fr)_minmax(160px,0.8fr)_minmax(150px,1fr)_minmax(150px,1fr)]">
					<FormField label="Akun Perkiraan" required :error="draftError('account')">
						<AsyncSelect
							:model-value="lineDraft.account_id || null"
							endpoint="/account"
							:option-label="accountLabel"
							:initial-label="lineDraft.account_code ? `${lineDraft.account_code} — ${lineDraft.account_name}` : undefined"
							placeholder="Cari akun perkiraan…"
							@update:model-value="(value) => onAccountChange(lineDraft, value)"
						/>
					</FormField>
					<FormField label="Departemen">
						<AsyncSelect
							:model-value="lineDraft.department_id"
							endpoint="/department"
							:option-label="departmentLabel"
							:initial-label="lineDraft.department_code ? `${lineDraft.department_code} — ${lineDraft.department_name}` : undefined"
							placeholder="Pilih departemen…"
							@update:model-value="(value) => onDepartmentChange(lineDraft, value)"
						/>
					</FormField>
					<FormField label="Arus Kas" :required="cashFlowRequired(lineDraft)" :error="draftError('cash_flow')">
						<AsyncSelect
							:model-value="lineDraft.cash_flow ?? ''"
							endpoint="/cash-flow"
							:option-label="cashFlowLabel"
							:option-value="cashFlowValue"
							:initial-label="lineDraft.cash_flow ? `${lineDraft.cash_flow} — ${lineDraft.cash_flow_name ?? lineDraft.cash_flow}` : undefined"
							placeholder="Cari arus kas…"
							@update:model-value="(value) => onCashFlowChange(lineDraft, value)"
						/>
					</FormField>
					<FormField label="Debit" :error="draftError('amount')">
						<MoneyInput :model-value="lineDraft.debit" @update:model-value="(value) => onDebit(lineDraft, value)" />
					</FormField>
					<FormField label="Kredit" :error="draftError('amount')">
						<MoneyInput :model-value="lineDraft.credit" @update:model-value="(value) => onCredit(lineDraft, value)" />
					</FormField>
				</div>
				<FormField label="Keterangan Detail">
					<Input v-model="lineDraft.detail_description" placeholder="Keterangan detail (opsional)" />
				</FormField>
				<div class="flex gap-2">
					<Button type="button" size="sm" variant="secondary" @click="saveDetail">
						<IconPlus class="h-4 w-4" /> {{ editingIndex === null ? 'Tambah Detail' : 'Simpan Detail' }}
					</Button>
					<Button v-if="editingIndex !== null" type="button" size="sm" variant="subtle" @click="resetDraft">Batal Edit</Button>
				</div>
				<p v-if="errors.draft" class="text-s text-danger">{{ errors.draft }}</p>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Detail Jurnal</h3>
				<div v-if="form.lines.length" class="overflow-x-auto">
					<table class="w-full min-w-[900px] text-m">
						<thead>
							<tr class="border-b border-hairline text-left text-s text-ink-muted">
								<th class="px-3 py-2">Akun Perkiraan</th>
								<th class="px-3 py-2">Departemen</th>
								<th class="px-3 py-2">Arus Kas</th>
								<th class="px-3 py-2 text-right">Debit</th>
								<th class="px-3 py-2 text-right">Kredit</th>
								<th class="px-3 py-2">Keterangan</th>
								<th class="px-3 py-2 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(line, index) in form.lines" :key="index" class="border-b border-hairline last:border-0">
								<td class="px-3 py-3 text-ink">{{ line.account_code }} — {{ line.account_name }}</td>
								<td class="px-3 py-3 text-ink">{{ line.department_code ? `${line.department_code} — ${line.department_name}` : '–' }}</td>
								<td class="px-3 py-3 text-ink">{{ line.cash_flow ? (line.cash_flow_name ?? line.cash_flow) : '–' }}</td>
								<td class="px-3 py-3 text-right"><Amount :value="line.debit" /></td>
								<td class="px-3 py-3 text-right"><Amount :value="line.credit" /></td>
								<td class="px-3 py-3 text-ink">{{ line.detail_description || '–' }}</td>
								<td class="px-3 py-3">
									<div class="flex justify-end gap-1">
										<button
											type="button"
											class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
											title="Edit detail"
											@click="editDetail(index)"
										>
											<IconPencil class="h-4 w-4" />
										</button>
										<button
											type="button"
											class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
											title="Hapus detail"
											@click="removeDetail(index)"
										>
											<IconTrash class="h-4 w-4" />
										</button>
									</div>
								</td>
							</tr>
						</tbody>
						<tfoot>
							<tr class="border-t border-hairline text-s">
								<td class="px-3 py-3 text-ink-muted" colspan="3">Total</td>
								<td class="px-3 py-3 text-right"><Amount :value="totalDebit" /></td>
								<td class="px-3 py-3 text-right"><Amount :value="totalCredit" /></td>
								<td class="px-3 py-3" colspan="2">
									<Badge :tone="balanced ? 'success' : 'danger'">{{ balanced ? 'Balance' : 'Belum balance' }}</Badge>
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
				<p v-else class="rounded-md bg-canvas px-3 py-4 text-center text-s text-ink-muted">
					Belum ada detail jurnal. Isi form di atas lalu klik Tambah Detail.
				</p>
				<p v-if="errors.lines" class="text-s text-danger">{{ errors.lines }}</p>
				<p v-if="errors.balance" class="text-s text-danger">{{ errors.balance }}</p>
			</section>

			<div class="flex flex-wrap gap-2 pt-2">
				<Button type="submit" :loading="loading"><IconSend v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan & Ajukan' }}</Button>
				<Button variant="subtle" type="button" @click="router.push('/journal')"><IconX class="h-4 w-4" /> Batal</Button>
			</div>
		</form>
	</Panel>
</template>
