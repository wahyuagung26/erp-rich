<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconCheck, IconDeviceFloppy, IconPaperclip, IconPencil, IconPlus, IconSend, IconTrash, IconX } from '@tabler/icons-vue'
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
				attachments: props.initialValue.attachments.map((file) => ({ ...file })),
				lines: props.initialValue.lines.map((line) => ({ ...line }))
			}
		: {
				number: '',
				date: new Date().toISOString().slice(0, 10),
				voucher: '',
				description: '',
				attachments: [],
				lines: []
			}
)

const totalDebit = computed(() => form.lines.reduce((sum, line) => sum + line.debit, 0))
const totalCredit = computed(() => form.lines.reduce((sum, line) => sum + line.credit, 0))
const balanced = computed(() => totalDebit.value > 0 && totalDebit.value === totalCredit.value)
const editingIndex = ref<number | null>(null)
const isEdit = !!props.initialValue
const fileInput = ref<HTMLInputElement>()

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
const MAX_FILES = 5
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

const readFile = (file: File) =>
	new Promise<JournalForm['attachments'][number]>((resolve, reject) => {
		const reader = new FileReader()
		// ponytail: keep prototype attachments as data URLs; switch to multipart upload when the backend exists.
		reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data_url: String(reader.result) })
		reader.onerror = () => reject(new Error(file.name))
		reader.readAsDataURL(file)
	})

async function onAttachmentPick(event: Event) {
	const input = event.target as HTMLInputElement
	const picked = Array.from(input.files ?? [])
	input.value = '' // allow picking the same file again after removing it
	for (const file of picked) {
		if (form.attachments.length >= MAX_FILES) {
			toast.error(`Maksimal ${MAX_FILES} lampiran`)
			break
		}
		if (!ALLOWED_TYPES.includes(file.type)) {
			toast.error(`${file.name}: lampiran harus berupa PDF, JPG, atau PNG`)
			continue
		}
		if (file.size > MAX_ATTACHMENT) {
			toast.error(`${file.name}: ukuran maksimal 5 MB`)
			continue
		}
		try {
			form.attachments.push(await readFile(file))
		} catch {
			toast.error(`${file.name}: lampiran tidak dapat dibaca`)
		}
	}
}

function removeAttachment(index: number) {
	form.attachments.splice(index, 1)
}

function draftError(field: 'account' | 'department' | 'cash_flow' | 'amount') {
	return errors.value['draft.' + field]
}

function lineValidation(line: JournalFormLine, prefix: string) {
	const next: Record<string, string> = {}
	if (!line.account_id) next[prefix + '.account'] = 'Akun wajib dipilih'
	if (!line.department_id) next[prefix + '.department'] = 'Departemen wajib dipilih'
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
	// Labels resolve asynchronously after a pick; wait for them so the new row never shows '–' for a chosen department / cash flow.
	if (lineDraft.department_id && !lineDraft.department_code) await onDepartmentChange(lineDraft, lineDraft.department_id)
	if (lineDraft.cash_flow && !lineDraft.cash_flow_name) await onCashFlowChange(lineDraft, lineDraft.cash_flow)
	const lineErrors = lineValidation(lineDraft, 'draft')
	clearDraftErrors()
	if (Object.keys(lineErrors).length) {
		errors.value = { ...errors.value, ...lineErrors }
		return
	}
	if (editingIndex.value === null) form.lines.push({ ...lineDraft })
	else form.lines[editingIndex.value] = { ...lineDraft }
	clearLineErrors()
	resetDraft()
}

function editDetail(index: number) {
	Object.assign(lineDraft, { ...form.lines[index] })
	editingIndex.value = index
	clearDraftErrors()
}

// Per-line errors ('lines.<i>.<field>') render under the cell of that row; indexes shift on delete/edit, so drop them and let the next submit re-validate.
const lineError = (index: number, field: 'account' | 'department' | 'cash_flow' | 'amount') => errors.value[`lines.${index}.${field}`]
const rowHasError = (index: number) => ['account', 'department', 'cash_flow', 'amount'].some((field) => lineError(index, field as 'account'))
function clearLineErrors() {
	errors.value = Object.fromEntries(Object.entries(errors.value).filter(([key]) => !key.startsWith('lines.')))
}

function removeDetail(index: number) {
	clearLineErrors()
	form.lines.splice(index, 1)
	if (editingIndex.value === index) resetDraft()
	else if (editingIndex.value !== null && editingIndex.value > index) editingIndex.value -= 1
}

function validate(): boolean {
	const next: Record<string, string> = {}
	if (!form.date) next.date = 'Tanggal wajib diisi'
	if (!form.voucher.trim()) next.voucher = 'Voucher wajib diisi'
	if (!form.description.trim()) next.description = 'Keterangan wajib diisi'
	if (!form.attachments.length) next.attachment = 'Lampiran wajib diunggah'
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
					<FormField label="No. Transaksi" :error="errors.number">
						<Input v-model="form.number" :disabled="isEdit" placeholder="Otomatis jika dikosongkan" />
					</FormField>
					<FormField label="Tanggal" required :error="errors.date">
						<DatePicker v-model="form.date" />
					</FormField>
					<FormField label="Voucher" required :error="errors.voucher">
						<Input v-model="form.voucher" placeholder="Nomor / referensi voucher" />
					</FormField>
					<FormField class="md:col-span-2" label="Keterangan" required :error="errors.description">
						<Textarea v-model="form.description" :rows="2" placeholder="Keterangan jurnal" />
					</FormField>
					<FormField label="Lampiran" required :error="errors.attachment" hint="PDF, JPG, atau PNG. Maks. 5 MB per file, hingga 5 file.">
						<div class="space-y-1.5">
							<div
								v-for="(file, index) in form.attachments"
								:key="file.name + index"
								class="flex items-center gap-2 rounded-md border border-ink-subtle/30 bg-panel px-3 py-2 text-m"
							>
								<IconPaperclip class="h-4 w-4 shrink-0 text-primary" />
								<span class="min-w-0 flex-1 truncate text-ink">{{ file.name }}</span>
								<button type="button" class="shrink-0 text-s text-danger hover:underline" @click="removeAttachment(index)">Hapus</button>
							</div>
							<input ref="fileInput" type="file" multiple accept="application/pdf,image/jpeg,image/png" class="hidden" @change="onAttachmentPick" />
							<Button
								v-if="form.attachments.length < MAX_FILES"
								type="button"
								variant="outline"
								block
								class="!justify-start"
								@click="fileInput?.click()"
							>
								<IconPlus class="h-4 w-4" /> {{ form.attachments.length ? 'Tambah file…' : 'Pilih file…' }}
							</Button>
						</div>
					</FormField>
				</div>
			</section>

			<!-- Entry row lives IN the table (same columns as the lines below): fill it, press Enter or +, the line drops in underneath. -->
			<section class="space-y-3">
				<h3 class="subhead">Detail Jurnal</h3>
				<div class="overflow-x-auto">
					<table class="w-full min-w-[1000px] text-m">
						<thead>
							<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
								<th class="px-2 py-2">Akun Perkiraan<span class="text-danger">*</span></th>
								<th class="px-2 py-2">Departemen<span class="text-danger">*</span></th>
								<th class="px-2 py-2">Arus Kas</th>
								<th class="px-2 py-2 text-right">Debit</th>
								<th class="px-2 py-2 text-right">Kredit</th>
								<th class="px-2 py-2">Keterangan</th>
								<th class="px-2 py-2 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody>
							<tr class="border-b border-hairline align-top">
								<td class="min-w-[200px] px-2 py-2">
									<AsyncSelect
										:model-value="lineDraft.account_id || null"
										endpoint="/account"
										:option-label="accountLabel"
										:initial-label="lineDraft.account_code ? `${lineDraft.account_code} — ${lineDraft.account_name}` : undefined"
										placeholder="Cari akun perkiraan…"
										@update:model-value="(value) => onAccountChange(lineDraft, value)"
									/>
									<p v-if="draftError('account')" class="mt-1 text-xs text-danger">{{ draftError('account') }}</p>
								</td>
								<td class="min-w-[150px] px-2 py-2">
									<AsyncSelect
										:model-value="lineDraft.department_id"
										endpoint="/department"
										:option-label="departmentLabel"
										:initial-label="lineDraft.department_code ? `${lineDraft.department_code} — ${lineDraft.department_name}` : undefined"
										placeholder="Pilih departemen…"
										@update:model-value="(value) => onDepartmentChange(lineDraft, value)"
									/>
									<p v-if="draftError('department')" class="mt-1 text-xs text-danger">{{ draftError('department') }}</p>
								</td>
								<td class="min-w-[150px] px-2 py-2">
									<AsyncSelect
										:model-value="lineDraft.cash_flow ?? ''"
										endpoint="/cash-flow"
										:option-label="cashFlowLabel"
										:option-value="cashFlowValue"
										:initial-label="lineDraft.cash_flow ? `${lineDraft.cash_flow} — ${lineDraft.cash_flow_name ?? lineDraft.cash_flow}` : undefined"
										:placeholder="cashFlowRequired(lineDraft) ? 'Arus kas (wajib)…' : 'Cari arus kas…'"
										@update:model-value="(value) => onCashFlowChange(lineDraft, value)"
									/>
									<p v-if="draftError('cash_flow')" class="mt-1 text-xs text-danger">{{ draftError('cash_flow') }}</p>
								</td>
								<td class="min-w-[150px] px-2 py-2">
									<MoneyInput
										blank-zero
										placeholder="0"
										:model-value="lineDraft.debit"
										@update:model-value="(value) => onDebit(lineDraft, value)"
										@keydown.enter.prevent="saveDetail"
									/>
									<p v-if="draftError('amount')" class="mt-1 text-xs text-danger">{{ draftError('amount') }}</p>
								</td>
								<td class="min-w-[150px] px-2 py-2">
									<MoneyInput
										blank-zero
										placeholder="0"
										:model-value="lineDraft.credit"
										@update:model-value="(value) => onCredit(lineDraft, value)"
										@keydown.enter.prevent="saveDetail"
									/>
								</td>
								<td class="min-w-[150px] px-2 py-2">
									<Input v-model="lineDraft.detail_description" placeholder="Keterangan (opsional)" @keydown.enter.prevent="saveDetail" />
								</td>
								<td class="px-2 py-2">
									<div class="flex justify-end gap-1">
										<Button
											type="button"
											size="sm"
											variant="secondary"
											:title="editingIndex === null ? 'Tambah detail' : 'Simpan detail'"
											@click="saveDetail"
										>
											<component :is="editingIndex === null ? IconPlus : IconCheck" class="h-4 w-4" />
										</Button>
										<Button v-if="editingIndex !== null" type="button" size="sm" variant="subtle" title="Batal edit" @click="resetDraft">
											<IconX class="h-4 w-4" />
										</Button>
									</div>
								</td>
							</tr>
							<tr v-if="!form.lines.length">
								<td colspan="7" class="px-3 py-6 text-center text-s text-ink-muted">
									Belum ada detail jurnal. Isi baris di atas, lalu tekan Enter atau tombol +.
								</td>
							</tr>
							<tr
								v-for="(line, index) in form.lines"
								:key="index"
								class="border-b border-hairline last:border-0"
								:class="{ 'bg-primary/5': editingIndex === index, 'bg-danger-soft/40': rowHasError(index) && editingIndex !== index }"
							>
								<td class="px-2 py-3 text-ink">
									<div class="text-ink">{{ line.account_name }}</div>
									<div class="text-s text-ink-muted">{{ line.account_code }}</div>
									<p v-if="lineError(index, 'account')" class="mt-1 text-xs text-danger">{{ lineError(index, 'account') }}</p>
								</td>
								<td class="px-2 py-3 text-ink">
									<template v-if="line.department_code">
										<div class="text-ink">{{ line.department_name }}</div>
										<div class="text-s text-ink-muted">{{ line.department_code }}</div>
									</template>
									<template v-else>–</template>
									<p v-if="lineError(index, 'department')" class="mt-1 text-xs text-danger">{{ lineError(index, 'department') }}</p>
								</td>
								<td class="px-2 py-3 text-ink">
									{{ line.cash_flow ? (line.cash_flow_name ?? line.cash_flow) : '–' }}
									<p v-if="lineError(index, 'cash_flow')" class="mt-1 text-xs text-danger">{{ lineError(index, 'cash_flow') }}</p>
								</td>
								<td class="px-2 py-3 text-right">
									<Amount :value="line.debit" />
									<p v-if="lineError(index, 'amount')" class="mt-1 text-xs text-danger">{{ lineError(index, 'amount') }}</p>
								</td>
								<td class="px-2 py-3 text-right"><Amount :value="line.credit" /></td>
								<td class="px-2 py-3 text-ink">{{ line.detail_description || '–' }}</td>
								<td class="px-2 py-3">
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
					</table>
				</div>
				<p v-if="errors.draft" class="text-s text-danger">{{ errors.draft }}</p>
				<p v-if="errors.lines" class="text-s text-danger">{{ errors.lines }}</p>
				<p v-if="errors.balance" class="text-s text-danger">{{ errors.balance }}</p>
			</section>

			<!-- Sticky action bar: totals + balance + Simpan stay in view however long the lines get. -->
			<div class="sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-panel px-4 py-3">
				<dl class="flex flex-wrap items-center gap-x-6 gap-y-1 text-s">
					<div class="flex items-baseline gap-2">
						<dt class="text-ink-muted">Total Debit</dt>
						<dd class="text-m font-semibold"><Amount :value="totalDebit" /></dd>
					</div>
					<div class="flex items-baseline gap-2">
						<dt class="text-ink-muted">Total Kredit</dt>
						<dd class="text-m font-semibold"><Amount :value="totalCredit" /></dd>
					</div>
					<div v-if="!balanced && (totalDebit || totalCredit)" class="flex items-baseline gap-2">
						<dt class="text-ink-muted">Selisih</dt>
						<dd class="text-m font-semibold text-danger"><Amount :value="Math.abs(totalDebit - totalCredit)" /></dd>
					</div>
					<Badge :tone="balanced ? 'success' : 'danger'">{{ balanced ? 'Balance' : 'Belum balance' }}</Badge>
				</dl>
				<div class="flex gap-2">
					<Button variant="secondary" type="button" @click="router.push('/journal')"><IconX class="h-4 w-4" /> Batal</Button>
					<Button type="submit" :loading="loading">
						<component :is="isEdit ? IconDeviceFloppy : IconSend" v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan & Ajukan' }}
					</Button>
				</div>
			</div>
		</form>
	</Panel>
</template>
