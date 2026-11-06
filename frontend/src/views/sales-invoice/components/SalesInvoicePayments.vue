<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { IconCheck, IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-vue'
import { money } from '@/utils/format'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import Input from '@/components/base/Input.vue'
import Button from '@/components/base/Button.vue'
import Amount from '@/components/base/Amount.vue'
import { validateSalesInvoicePayment, type SalesInvoicePaymentDraft } from '@/views/sales-invoice/schema'

// Payments made together with the invoice (not the later receivable payments — those go through Piutang Customer).
// A payment type whose `method` is `down_payment` pays from a Titipan Customer of the invoice's customer; `expense` (Biaya) from a Biaya Penjualan.
const props = defineProps<{ payments: SalesInvoicePaymentDraft[]; customerId: number | null; balance: number }>()
const emit = defineEmits<{ 'update:payments': [SalesInvoicePaymentDraft[]] }>()
const errors = ref('')
const editingIndex = ref<number | null>(null)
const depositRemaining = ref<number | null>(null)
const draft = reactive<SalesInvoicePaymentDraft>(blank())

function blank(): SalesInvoicePaymentDraft {
	return { payment_type_id: null, deposit_id: null, sales_expense_id: null, reference: '', amount: 0 }
}

const typeLabel = (item: Record<string, unknown>) => String(item.name)
const depositLabel = (item: Record<string, unknown>) => `${String(item.number)} (sisa ${money(Number(item.remaining))})`
const expenseLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`
const isTitipan = computed(() => draft.method === 'down_payment')
const isBiaya = computed(() => draft.method === 'expense')
// What the entry row may still add: the invoice balance, plus the row being edited.
const room = computed(() => props.balance + (editingIndex.value === null ? 0 : props.payments[editingIndex.value].amount))

function reset() {
	Object.assign(draft, blank(), { payment_type_label: undefined, method: undefined, deposit_label: undefined, sales_expense_label: undefined })
	depositRemaining.value = null
	editingIndex.value = null
	errors.value = ''
}

function pickType(item: Record<string, unknown> | null) {
	draft.payment_type_label = item ? typeLabel(item) : undefined
	draft.method = item ? String(item.method) : undefined
	draft.deposit_id = null
	draft.deposit_label = undefined
	draft.sales_expense_id = null
	draft.sales_expense_label = undefined
	depositRemaining.value = null
	if (item && item.method !== 'down_payment' && !draft.amount) draft.amount = Math.max(room.value, 0)
}

// A titipan fills the amount with whatever both the deposit and the invoice can still take.
function pickDeposit(item: Record<string, unknown> | null) {
	draft.deposit_label = item ? String(item.number) : undefined
	depositRemaining.value = item ? Number(item.remaining) : null
	if (item) draft.amount = Math.max(Math.min(Number(item.remaining), room.value), 0)
}

function save() {
	const validationError = validateSalesInvoicePayment(draft)
	if (validationError) return (errors.value = validationError)
	if (depositRemaining.value !== null && draft.amount > depositRemaining.value)
		return (errors.value = `Nominal melebihi sisa titipan (${money(depositRemaining.value)})`)
	if (draft.amount > room.value) return (errors.value = `Nominal melebihi sisa tagihan invoice (${money(Math.max(room.value, 0))})`)
	const next = [...props.payments]
	if (editingIndex.value === null) next.push({ ...draft })
	else next[editingIndex.value] = { ...draft }
	emit('update:payments', next)
	reset()
}

function edit(index: number) {
	Object.assign(draft, props.payments[index])
	// Remaining of an already-saved titipan is re-checked by the server; only the invoice balance is checked here.
	depositRemaining.value = null
	editingIndex.value = index
	errors.value = ''
}

function remove(index: number) {
	emit(
		'update:payments',
		props.payments.filter((_, itemIndex) => itemIndex !== index)
	)
	if (editingIndex.value === index) reset()
}

const total = computed(() => props.payments.reduce((sum, payment) => sum + payment.amount, 0))
</script>

<template>
	<div class="space-y-2">
		<div class="overflow-x-auto">
			<table class="w-full min-w-[720px] text-m">
				<thead>
					<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
						<th class="px-2 py-2">Tipe Pembayaran<span class="text-danger">*</span></th>
						<th class="px-2 py-2">Titipan / Referensi</th>
						<th class="px-2 py-2 text-right">Nominal<span class="text-danger">*</span></th>
						<th class="px-2 py-2 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					<tr class="border-b border-hairline align-top">
						<td class="min-w-[220px] px-2 py-2">
							<AsyncSelect
								:model-value="draft.payment_type_id"
								endpoint="/customer-receivable/payment-types"
								:option-label="typeLabel"
								:initial-label="draft.payment_type_label"
								placeholder="Pilih tipe pembayaran…"
								@update:model-value="(value) => (draft.payment_type_id = value ? Number(value) : null)"
								@select="pickType"
							/>
						</td>
						<td class="min-w-[260px] px-2 py-2">
							<AsyncSelect
								v-if="isBiaya"
								:model-value="draft.sales_expense_id ?? null"
								endpoint="/sales-expense"
								:option-label="expenseLabel"
								:initial-label="draft.sales_expense_label"
								placeholder="Cari biaya penjualan…"
								@update:model-value="(value) => (draft.sales_expense_id = value ? Number(value) : null)"
								@select="(item) => (draft.sales_expense_label = item ? expenseLabel(item) : undefined)"
							/>
							<AsyncSelect
								v-else-if="isTitipan"
								:key="`deposit-${customerId ?? 0}`"
								:model-value="draft.deposit_id"
								endpoint="/customer-deposit"
								:params="{ customer_id: customerId ?? 0, has_balance: 1 }"
								:option-label="depositLabel"
								:initial-label="draft.deposit_label"
								:disabled="!customerId"
								:placeholder="customerId ? 'Pilih titipan customer…' : 'Pilih customer terlebih dahulu'"
								@update:model-value="(value) => (draft.deposit_id = value ? Number(value) : null)"
								@select="pickDeposit"
							/>
							<Input v-else v-model="draft.reference" maxlength="100" placeholder="Referensi (opsional)" @keydown.enter.prevent="save" />
						</td>
						<td class="min-w-[160px] px-2 py-2"><MoneyInput v-model="draft.amount" blank-zero placeholder="0" @keydown.enter.prevent="save" /></td>
						<td class="px-2 py-2">
							<div class="flex justify-end gap-1">
								<Button
									type="button"
									size="sm"
									variant="secondary"
									:title="editingIndex === null ? 'Tambah pembayaran' : 'Simpan pembayaran'"
									@click="save"
								>
									<component :is="editingIndex === null ? IconPlus : IconCheck" class="h-4 w-4" />
								</Button>
								<Button v-if="editingIndex !== null" type="button" size="sm" variant="subtle" title="Batal edit" @click="reset"
									><IconX class="h-4 w-4"
								/></Button>
							</div>
						</td>
					</tr>
					<tr v-if="!payments.length">
						<td colspan="4" class="px-3 py-5 text-center text-s text-ink-muted">Belum ada pembayaran. Sisa tagihan menjadi piutang customer.</td>
					</tr>
					<tr
						v-for="(payment, index) in payments"
						:key="`${payment.payment_type_id}-${payment.deposit_id}-${index}`"
						class="border-b border-hairline last:border-0"
						:class="{ 'bg-primary/5': editingIndex === index }"
					>
						<td class="px-2 py-3 text-ink">{{ payment.payment_type_label }}</td>
						<td class="px-2 py-3 text-ink-muted">{{ payment.deposit_label || payment.sales_expense_label || payment.reference || '–' }}</td>
						<td class="px-2 py-3 text-right"><Amount :value="payment.amount" /></td>
						<td class="px-2 py-3">
							<div class="flex justify-end gap-1">
								<Button type="button" size="sm" variant="subtle" title="Edit pembayaran" @click="edit(index)"><IconPencil class="h-4 w-4" /></Button>
								<Button type="button" size="sm" variant="subtle" title="Hapus pembayaran" @click="remove(index)"
									><IconTrash class="h-4 w-4"
								/></Button>
							</div>
						</td>
					</tr>
				</tbody>
				<tfoot v-if="payments.length">
					<tr class="bg-fill font-semibold text-ink [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md">
						<td colspan="2" class="px-2 py-2.5 text-right text-ink-muted">Total Pembayaran</td>
						<td class="px-2 py-2.5 text-right"><Amount :value="total" /></td>
						<td />
					</tr>
				</tfoot>
			</table>
		</div>
		<p v-if="errors" class="text-s text-danger">{{ errors }}</p>
	</div>
</template>
