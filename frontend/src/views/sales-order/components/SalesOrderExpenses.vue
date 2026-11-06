<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { IconCheck, IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import Input from '@/components/base/Input.vue'
import Button from '@/components/base/Button.vue'
import Amount from '@/components/base/Amount.vue'
import { validateSalesOrderExpense, type SalesOrderExpenseDraft } from '@/views/sales-order/schema'

// Biaya Penjualan rows (ongkir, dll.) — same inline-entry shape as the product table.
const props = defineProps<{ expenses: SalesOrderExpenseDraft[] }>()
const emit = defineEmits<{ 'update:expenses': [SalesOrderExpenseDraft[]] }>()
const errors = ref('')
const editingIndex = ref<number | null>(null)
const draft = reactive<SalesOrderExpenseDraft>({ sales_expense_id: null, notes: '', amount: 0 })

const expenseLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`

function reset() {
	Object.assign(draft, { sales_expense_id: null, sales_expense_label: undefined, notes: '', amount: 0 })
	editingIndex.value = null
	errors.value = ''
}

function save() {
	const validationError = validateSalesOrderExpense(draft)
	if (validationError) {
		errors.value = validationError
		return
	}
	const next = [...props.expenses]
	if (editingIndex.value === null) next.push({ ...draft })
	else next[editingIndex.value] = { ...draft }
	emit('update:expenses', next)
	reset()
}

function edit(index: number) {
	Object.assign(draft, props.expenses[index])
	editingIndex.value = index
	errors.value = ''
}

function remove(index: number) {
	emit(
		'update:expenses',
		props.expenses.filter((_, itemIndex) => itemIndex !== index)
	)
	if (editingIndex.value === index) reset()
}

const total = computed(() => props.expenses.reduce((sum, expense) => sum + expense.amount, 0))
</script>

<template>
	<div class="space-y-2">
		<div class="overflow-x-auto">
			<table class="w-full min-w-[720px] text-m">
				<thead>
					<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
						<th class="px-2 py-2">Biaya<span class="text-danger">*</span></th>
						<th class="px-2 py-2">Keterangan</th>
						<th class="px-2 py-2 text-right">Nominal<span class="text-danger">*</span></th>
						<th class="px-2 py-2 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					<tr class="border-b border-hairline align-top">
						<td class="min-w-[240px] px-2 py-2">
							<AsyncSelect
								:model-value="draft.sales_expense_id"
								endpoint="/sales-expense"
								:option-label="expenseLabel"
								:initial-label="draft.sales_expense_label"
								placeholder="Pilih biaya penjualan…"
								@update:model-value="(value) => (draft.sales_expense_id = value ? Number(value) : null)"
								@select="(item) => (draft.sales_expense_label = item ? expenseLabel(item) : undefined)"
							/>
						</td>
						<td class="px-2 py-2"><Input v-model="draft.notes" placeholder="Keterangan biaya (opsional)" @keydown.enter.prevent="save" /></td>
						<td class="min-w-[160px] px-2 py-2"><MoneyInput v-model="draft.amount" blank-zero placeholder="0" @keydown.enter.prevent="save" /></td>
						<td class="px-2 py-2">
							<div class="flex justify-end gap-1">
								<Button type="button" size="sm" variant="secondary" :title="editingIndex === null ? 'Tambah biaya' : 'Simpan biaya'" @click="save">
									<component :is="editingIndex === null ? IconPlus : IconCheck" class="h-4 w-4" />
								</Button>
								<Button v-if="editingIndex !== null" type="button" size="sm" variant="subtle" title="Batal edit" @click="reset"
									><IconX class="h-4 w-4"
								/></Button>
							</div>
						</td>
					</tr>
					<tr v-if="!expenses.length">
						<td colspan="4" class="px-3 py-5 text-center text-s text-ink-muted">Belum ada biaya penjualan.</td>
					</tr>
					<tr
						v-for="(expense, index) in expenses"
						:key="`${expense.sales_expense_id}-${index}`"
						class="border-b border-hairline last:border-0"
						:class="{ 'bg-primary/5': editingIndex === index }"
					>
						<td class="px-2 py-3 text-ink">{{ expense.sales_expense_label }}</td>
						<td class="px-2 py-3 text-ink-muted">{{ expense.notes || '–' }}</td>
						<td class="px-2 py-3 text-right"><Amount :value="expense.amount" /></td>
						<td class="px-2 py-3">
							<div class="flex justify-end gap-1">
								<Button type="button" size="sm" variant="subtle" title="Edit biaya" @click="edit(index)"><IconPencil class="h-4 w-4" /></Button>
								<Button type="button" size="sm" variant="subtle" title="Hapus biaya" @click="remove(index)"><IconTrash class="h-4 w-4" /></Button>
							</div>
						</td>
					</tr>
				</tbody>
				<tfoot v-if="expenses.length">
					<tr class="bg-fill font-semibold text-ink [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md">
						<td colspan="2" class="px-2 py-2.5 text-right text-ink-muted">Total Biaya</td>
						<td class="px-2 py-2.5 text-right"><Amount :value="total" /></td>
						<td />
					</tr>
				</tfoot>
			</table>
		</div>
		<p v-if="errors" class="text-s text-danger">{{ errors }}</p>
	</div>
</template>
