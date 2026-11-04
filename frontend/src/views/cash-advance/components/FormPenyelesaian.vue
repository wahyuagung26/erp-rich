<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { IconCheck, IconPencil, IconPlus, IconRefresh, IconTrash, IconX } from '@tabler/icons-vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import AttachmentInput from '@/components/base/AttachmentInput.vue'
import Button from '@/components/base/Button.vue'
import Amount from '@/components/base/Amount.vue'
import { MAX_SETTLEMENT_FILES, parseSettlement, settlementAmount, type SettlementRequest } from '@/views/cash-advance/schema'
import type { Account, CashAdvance, CashAdvanceSettlement, CashFlow, Department, JournalLine } from '@/utils/types'

// Settlement form (modal body): header + "Input Detail Biaya" draft + "Daftar Detail Biaya" list, as in Legacy.
// `cap` = remaining of the advance before this settlement (Legacy "Sisa Sebelum").
const props = defineProps<{ advance: CashAdvance; cap: number; editing?: CashAdvanceSettlement | null; loading?: boolean }>()
const emit = defineEmits<{ submit: [payload: SettlementRequest]; cancel: [] }>()

const errors = ref<Record<string, string>>({})

const form = reactive({
	date: props.editing?.date ?? new Date().toISOString().slice(0, 10),
	description: props.editing?.description ?? '',
	attachments: (props.editing?.attachments ?? []).map((file) => ({ ...file })),
	lines: (props.editing?.lines ?? []).map((line) => ({ ...line })) as JournalLine[]
})

const totalDebit = computed(() => form.lines.reduce((sum, l) => sum + l.debit, 0))
const totalCredit = computed(() => form.lines.reduce((sum, l) => sum + l.credit, 0))
const remainingAfter = computed(() => props.cap - settlementAmount(form.lines))

const blank = (): JournalLine => ({ account_id: 0, department_id: null, cash_flow: '', detail_description: '', debit: 0, credit: 0 })
const draft = reactive<JournalLine>(blank())
const editingIndex = ref<number | null>(null)
const draftErrors = ref<Record<string, string>>({})
const draftHasInput = computed(
	() => !!(draft.account_id || draft.department_id || draft.cash_flow || draft.detail_description?.trim() || draft.debit || draft.credit)
)

const accountLabel = (item: Record<string, unknown>) => `${(item as unknown as Account).code} — ${(item as unknown as Account).name}`
const departmentLabel = (item: Record<string, unknown>) => `${(item as unknown as Department).code} — ${(item as unknown as Department).name}`
const cashFlowLabel = (item: Record<string, unknown>) => `${(item as unknown as CashFlow).code} — ${(item as unknown as CashFlow).name}`
const cashFlowValue = (item: Record<string, unknown>) => (item as unknown as CashFlow).code

// The picked row carries the labels, so no extra fetch is needed.
function pickAccount(row: Record<string, unknown> | null) {
	const account = row as unknown as Account | null
	draft.account_code = account?.code
	draft.account_name = account?.name
}
function pickDepartment(row: Record<string, unknown> | null) {
	const department = row as unknown as Department | null
	draft.department_code = department?.code
	draft.department_name = department?.name
}
function pickCashFlow(row: Record<string, unknown> | null) {
	draft.cash_flow_name = (row as unknown as CashFlow | null)?.name
}

// Debit and credit are exclusive: typing one clears the other.
function onDebit(value: number) {
	draft.debit = value
	if (value) draft.credit = 0
}
function onCredit(value: number) {
	draft.credit = value
	if (value) draft.debit = 0
}

function resetDraft() {
	Object.assign(draft, blank(), {
		account_code: undefined,
		account_name: undefined,
		department_code: undefined,
		department_name: undefined,
		cash_flow_name: undefined
	})
	editingIndex.value = null
	draftErrors.value = {}
}

function saveLine() {
	const next: Record<string, string> = {}
	if (!draft.account_id) next.account = 'Akun wajib dipilih'
	if (!draft.department_id) next.department = 'Departemen wajib dipilih'
	if (!draft.debit && !draft.credit) next.amount = 'Debit atau kredit wajib diisi'
	draftErrors.value = next
	if (Object.keys(next).length) return
	if (editingIndex.value === null) form.lines.push({ ...draft })
	else form.lines[editingIndex.value] = { ...draft }
	delete errors.value.lines
	resetDraft()
}

function editLine(index: number) {
	Object.assign(draft, form.lines[index])
	editingIndex.value = index
	draftErrors.value = {}
}

function removeLine(index: number) {
	form.lines.splice(index, 1)
	if (editingIndex.value === index) resetDraft()
	else if (editingIndex.value !== null && editingIndex.value > index) editingIndex.value -= 1
}

function submit() {
	if (props.loading) return
	if (draftHasInput.value) {
		errors.value = { lines: 'Simpan baris biaya terlebih dahulu dengan tombol Tambah Baris' }
		return
	}
	const parsed = parseSettlement(
		{
			date: form.date,
			description: form.description,
			attachments: form.attachments,
			lines: form.lines.map((line) => ({
				account_id: Number(line.account_id),
				department_id: Number(line.department_id) || 0,
				cash_flow: line.cash_flow || null,
				detail_description: line.detail_description ?? '',
				debit: Number(line.debit) || 0,
				credit: Number(line.credit) || 0
			}))
		},
		props.cap
	)
	errors.value = parsed.errors ?? {}
	if (parsed.data) emit('submit', parsed.data)
}

function setServerErrors(serverErrors: Record<string, string[]>) {
	errors.value = { ...errors.value, ...Object.fromEntries(Object.entries(serverErrors).map(([key, messages]) => [key, messages[0]])) }
}
defineExpose({ setServerErrors })
</script>

<template>
	<form class="space-y-6" @submit.prevent="submit">
		<dl class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
			<div>
				<dt class="text-s text-ink-muted">Uang Muka</dt>
				<dd class="mt-1 text-m text-ink">{{ advance.number }}</dd>
			</div>
			<div>
				<dt class="text-s text-ink-muted">Penerima</dt>
				<dd class="mt-1 text-m text-ink">{{ advance.recipient }}</dd>
			</div>
			<div>
				<dt class="text-s text-ink-muted">Sisa Sebelum</dt>
				<dd class="mt-1 text-m text-ink">Rp <Amount :value="cap" /></dd>
			</div>
		</dl>

		<div class="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
			<FormField label="No. Penyelesaian">
				<Input :model-value="editing?.number ?? ''" placeholder="Nomor otomatis" disabled />
			</FormField>
			<FormField label="Tanggal" required :error="errors.date">
				<DatePicker v-model="form.date" />
			</FormField>
			<FormField class="sm:col-span-2" label="Keterangan" hint="Opsional.">
				<Textarea v-model="form.description" :rows="2" placeholder="Keterangan penyelesaian" />
			</FormField>
			<FormField
				class="sm:col-span-2"
				label="Lampiran"
				required
				:error="errors.attachments"
				:hint="`PDF, JPG, atau PNG. Maks. 5 MB per file, hingga ${MAX_SETTLEMENT_FILES} file.`"
			>
				<AttachmentInput v-model="form.attachments" :max-files="MAX_SETTLEMENT_FILES" />
			</FormField>
		</div>

		<section class="space-y-3">
			<div class="flex items-center justify-between gap-2">
				<h3 class="subhead">Input Detail Biaya</h3>
				<div class="flex items-center gap-2">
					<Button type="button" size="sm" variant="subtle" @click="resetDraft"><IconRefresh class="h-4 w-4" /> Reset</Button>
					<Button type="button" size="sm" variant="secondary" @click="saveLine">
						<component :is="editingIndex === null ? IconPlus : IconCheck" class="h-4 w-4" />
						{{ editingIndex === null ? 'Tambah Baris' : 'Simpan Baris' }}
					</Button>
				</div>
			</div>
			<div class="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
				<FormField label="Akun Perkiraan" required :error="draftErrors.account">
					<AsyncSelect
						:model-value="draft.account_id || null"
						endpoint="/account"
						:option-label="accountLabel"
						:initial-label="draft.account_code ? `${draft.account_code} — ${draft.account_name}` : undefined"
						placeholder="Cari akun perkiraan…"
						@update:model-value="(value) => (draft.account_id = Number(value) || 0)"
						@select="pickAccount"
					/>
				</FormField>
				<FormField label="Arus Kas">
					<AsyncSelect
						:model-value="draft.cash_flow || null"
						endpoint="/cash-flow"
						:option-label="cashFlowLabel"
						:option-value="cashFlowValue"
						:initial-label="draft.cash_flow ? `${draft.cash_flow} — ${draft.cash_flow_name ?? draft.cash_flow}` : undefined"
						placeholder="Cari arus kas…"
						@update:model-value="(value) => (draft.cash_flow = value ? String(value) : '')"
						@select="pickCashFlow"
					/>
				</FormField>
			</div>
			<div class="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-3">
				<FormField label="Departemen" required :error="draftErrors.department">
					<AsyncSelect
						:model-value="draft.department_id"
						endpoint="/department"
						:option-label="departmentLabel"
						:initial-label="draft.department_code ? `${draft.department_code} — ${draft.department_name}` : undefined"
						placeholder="Pilih departemen…"
						@update:model-value="(value) => (draft.department_id = value ? Number(value) : null)"
						@select="pickDepartment"
					/>
				</FormField>
				<FormField label="Debit" :error="draftErrors.amount">
					<MoneyInput blank-zero placeholder="0" :model-value="draft.debit" @update:model-value="onDebit" />
				</FormField>
				<FormField label="Kredit">
					<MoneyInput blank-zero placeholder="0" :model-value="draft.credit" @update:model-value="onCredit" />
				</FormField>
			</div>
			<FormField label="Keterangan">
				<Input v-model="draft.detail_description" placeholder="Keterangan baris (opsional)" @keydown.enter.prevent="saveLine" />
			</FormField>
		</section>

		<section class="space-y-3">
			<h3 class="subhead">Daftar Detail Biaya</h3>
			<p v-if="errors.lines" class="text-s text-danger">{{ errors.lines }}</p>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[820px] text-m">
					<thead>
						<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
							<th class="px-2 py-2">No</th>
							<th class="px-2 py-2">Akun Perkiraan</th>
							<th class="px-2 py-2">Departemen</th>
							<th class="px-2 py-2">Keterangan</th>
							<th class="px-2 py-2 text-right">Debit</th>
							<th class="px-2 py-2 text-right">Kredit</th>
							<th class="px-2 py-2">Arus Kas</th>
							<th class="px-2 py-2 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody>
						<tr v-if="!form.lines.length">
							<td colspan="8" class="px-3 py-6 text-center text-s text-ink-muted">
								Belum ada detail biaya. Isi form di atas, lalu tekan Tambah Baris.
							</td>
						</tr>
						<tr v-for="(line, index) in form.lines" :key="index" class="border-b border-hairline" :class="{ 'bg-primary/5': editingIndex === index }">
							<td class="tnum px-2 py-3 text-ink-muted">{{ index + 1 }}</td>
							<td class="px-2 py-3 text-ink">
								<div>{{ line.account_name }}</div>
								<div class="text-s text-ink-muted">{{ line.account_code }}</div>
							</td>
							<td class="px-2 py-3 text-ink">
								<div>{{ line.department_name }}</div>
								<div class="text-s text-ink-muted">{{ line.department_code }}</div>
							</td>
							<td class="px-2 py-3 text-ink">{{ line.detail_description || '–' }}</td>
							<td class="px-2 py-3 text-right"><Amount :value="line.debit" /></td>
							<td class="px-2 py-3 text-right"><Amount :value="line.credit" /></td>
							<td class="px-2 py-3 text-ink">{{ line.cash_flow_name || line.cash_flow || '–' }}</td>
							<td class="px-2 py-3">
								<div class="flex justify-end gap-1">
									<button
										type="button"
										class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
										title="Edit baris"
										@click="editLine(index)"
									>
										<IconPencil class="h-4 w-4" />
									</button>
									<button
										type="button"
										class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
										title="Hapus baris"
										@click="removeLine(index)"
									>
										<IconTrash class="h-4 w-4" />
									</button>
								</div>
							</td>
						</tr>
					</tbody>
					<tfoot v-if="form.lines.length">
						<tr class="font-semibold">
							<td colspan="4" class="px-2 py-3 text-right text-ink">Total</td>
							<td class="px-2 py-3 text-right"><Amount :value="totalDebit" /></td>
							<td class="px-2 py-3 text-right"><Amount :value="totalCredit" /></td>
							<td colspan="2" class="px-2 py-3 text-ink">
								Sisa Setelah: <Amount :value="remainingAfter" :class="remainingAfter < 0 ? '!text-danger' : ''" />
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</section>

		<div class="flex flex-wrap justify-end gap-2">
			<Button variant="subtle" type="button" @click="emit('cancel')"><IconX class="h-4 w-4" /> Batal</Button>
			<Button type="submit" :loading="loading"><IconCheck v-if="!loading" class="h-4 w-4" /> Simpan</Button>
		</div>
	</form>
</template>
