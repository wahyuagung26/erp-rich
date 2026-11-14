<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft, IconFileInvoice, IconLock, IconPencil, IconPrinter, IconPlus, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import { date, money } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import ClosingBadge from '@/components/common/ClosingBadge.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import Input from '@/components/base/Input.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Amount from '@/components/base/Amount.vue'
import Tabs from '@/components/base/Tabs.vue'
import { receivableStatusLabel, receivableTone, validatePayment } from '@/views/customer-receivable/schema'
import type { CustomerReceivable, CustomerReceivablePayment } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const row = ref<CustomerReceivable>()
const loading = ref(true)
const notFound = ref(false)

// Two tabs: static info vs the payment work area. Opens on Pembayaran while there is still something to collect
// (the usual reason to be here); `?tab=` overrides it.
const tab = ref('informasi')
const tabs = computed(() => [
	{ label: 'Informasi', value: 'informasi' },
	{ label: `Pembayaran (${row.value?.payments.length ?? 0})`, value: 'pembayaran' }
])

onMounted(async () => {
	try {
		const res = await api.get<{ data: CustomerReceivable }>(`/customer-receivable/${route.params.id}`)
		row.value = res.data.data
		const wanted = String(route.query.tab ?? '')
		tab.value = ['informasi', 'pembayaran'].includes(wanted) ? wanted : res.data.data.outstanding > 0 ? 'pembayaran' : 'informasi'
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})
// Opens the print view in a new tab; `?auto=1` makes it call window.print() once rendered.
function printDoc() {
	if (row.value) window.open(router.resolve({ name: 'CustomerReceivablePrint', params: { id: row.value.id }, query: { auto: '1' } }).href, '_blank')
}

// Payment form. The picked payment type's `method` decides whether a bank account, a titipan or a sales expense (Biaya) is asked for.
const today = new Date().toISOString().slice(0, 10)
const payment = reactive({
	date: today,
	payment_type_id: 0,
	bank_account_id: null as number | null,
	deposit_id: null as number | null,
	sales_expense_id: null as number | null,
	description: '',
	amount: 0
})
const method = ref<string>()
const refRemaining = ref(0)
const errors = ref<Record<string, string>>({})
const saving = ref(false)
const canPay = computed(() => (row.value?.outstanding ?? 0) > 0)

// Edit mode reuses the payment form: the payment being edited (null = recording a new one).
const editing = ref<CustomerReceivablePayment | null>(null)
const formEl = ref<HTMLElement>()
// What the amount may reach: the invoice's Sisa, plus what the edited payment already holds.
const maxAmount = computed(() => (row.value?.outstanding ?? 0) + (editing.value?.amount ?? 0))
const hasLocked = computed(() => row.value?.payments.some((item) => item.locked) ?? false)
const LOCKED_HINT = 'Periode sudah closing — pembayaran tidak bisa diedit atau dihapus'

function resetForm() {
	editing.value = null
	method.value = undefined
	refRemaining.value = 0
	errors.value = {}
	Object.assign(payment, {
		date: today,
		payment_type_id: 0,
		bank_account_id: null,
		deposit_id: null,
		sales_expense_id: null,
		description: '',
		amount: 0
	})
}

function startEdit(item: CustomerReceivablePayment) {
	editing.value = item
	method.value = item.method
	// The server re-checks what the titipan can still absorb; only the invoice's own Sisa is checked here.
	refRemaining.value = Number.POSITIVE_INFINITY
	errors.value = {}
	Object.assign(payment, {
		date: item.date,
		payment_type_id: item.payment_type_id,
		bank_account_id: item.bank_account_id,
		deposit_id: item.deposit_id,
		sales_expense_id: item.sales_expense_id,
		description: item.description,
		amount: item.amount
	})
	formEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const typeLabel = (item: Record<string, unknown>) => String(item.name)
const bankLabel = (item: Record<string, unknown>) => String(item.bank_name)
const expenseLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`
const depositLabel = (item: Record<string, unknown>) => `${String(item.number)} (sisa ${money(Number(item.remaining))})`

function pickType(item: Record<string, unknown> | null) {
	method.value = item ? String(item.method) : undefined
	payment.bank_account_id = null
	payment.deposit_id = null
	payment.sales_expense_id = null
	refRemaining.value = 0
}
// Picking a titipan pre-fills the amount with whatever both the titipan and the invoice can still absorb.
function pickDeposit(item: Record<string, unknown> | null) {
	refRemaining.value = item ? Number(item.remaining) : 0
	if (item && row.value) payment.amount = Math.min(refRemaining.value, row.value.outstanding)
}

async function savePayment() {
	const value = row.value
	if (!value || saving.value) return
	const found = validatePayment(payment, method.value, maxAmount.value, refRemaining.value)
	errors.value = found ?? {}
	if (found) return
	saving.value = true
	try {
		const url = `/customer-receivable/${value.id}/payments`
		const res = editing.value
			? await api.put<{ data: CustomerReceivable; message: string }>(`${url}/${editing.value.id}`, { ...payment })
			: await api.post<{ data: CustomerReceivable; message: string }>(url, { ...payment })
		row.value = res.data.data
		resetForm()
		toast.success(res.data.message)
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 422 && error.response.data?.errors) {
			errors.value = Object.fromEntries(Object.entries(error.response.data.errors as Record<string, string[]>).map(([key, msgs]) => [key, msgs[0]]))
		} else toast.error(errorMessage(error, editing.value ? 'Pembayaran tidak dapat diubah' : 'Pembayaran tidak dapat dicatat'))
	} finally {
		saving.value = false
	}
}

function removePayment(item: CustomerReceivablePayment) {
	const value = row.value
	if (!value) return
	ask({ title: 'Batalkan pembayaran', message: `Batalkan pembayaran “${item.number}”?`, type: 'danger', confirmText: 'Batalkan' }, async () => {
		const res = await api.delete<{ data: CustomerReceivable; message: string }>(`/customer-receivable/${value.id}/payments/${item.id}`)
		row.value = res.data.data
		if (editing.value?.id === item.id) resetForm()
		toast.success(res.data.message)
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Piutang Customer" subtitle="Penjualan"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<Badge v-if="row" class="mr-1 whitespace-nowrap" :tone="receivableTone[row.status]">{{ receivableStatusLabel[row.status] }}</Badge
					><Button size="sm" variant="subtle" @click="router.push('/customer-receivable')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					><Button v-if="row" size="sm" variant="secondary" @click="router.push(`/sales-invoice/${row!.id}`)"
						><IconFileInvoice class="h-4 w-4" /> Lihat Invoice</Button
					><Button v-if="row" size="sm" variant="subtle" @click="printDoc"><IconPrinter class="h-4 w-4" /> Cetak</Button>
				</div></template
			></PageHeader
		>
		<Panel v-if="loading"><Skeleton :lines="10" /></Panel>
		<Panel v-else-if="notFound || !row"
			><EmptyState title="Piutang customer tidak ditemukan" description="Piutang terbentuk setelah invoice penjualan disetujui."
		/></Panel>
		<Panel v-else>
			<div class="space-y-6">
				<!-- Always visible, above the tabs: Sisa must never hide behind a tab, and it updates right after a payment. -->
				<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
					<div>
						<dt class="text-s text-ink-muted">Total Piutang</dt>
						<dd class="mt-1 text-l"><Amount :value="row.total" /></dd>
					</div>
					<div>
						<dt class="text-s text-ink-muted">Terbayar</dt>
						<dd class="mt-1 text-l"><Amount :value="row.paid_total" /></dd>
					</div>
					<div>
						<dt class="text-s text-ink-muted">Sisa Piutang</dt>
						<dd class="mt-1 text-l font-semibold"><Amount :value="row.outstanding" /></dd>
					</div>
				</dl>

				<Tabs v-model="tab" :tabs="tabs" />

				<section v-if="tab === 'informasi'" class="space-y-3">
					<h3 class="subhead">Informasi Piutang</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nomor</dt>
							<dd class="mt-1 text-m">
								<RouterLink :to="`/sales-invoice/${row.id}`" class="text-primary-dark hover:underline">{{ row.number }}</RouterLink>
							</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Tanggal</dt>
							<dd class="mt-1 text-m text-ink">{{ date(row.date) }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Jatuh Tempo</dt>
							<dd class="mt-1 text-m" :class="row.overdue ? 'text-danger' : 'text-ink'">
								{{ date(row.due_date) }} <span class="text-s text-ink-muted">(TOP {{ row.top_days }} hari)</span>
							</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Customer</dt>
							<dd class="mt-1 text-m text-ink">{{ row.customer_code }} — {{ row.customer_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Departemen</dt>
							<dd class="mt-1 text-m text-ink">{{ row.department_code }} — {{ row.department_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Sales</dt>
							<dd class="mt-1 text-m text-ink">{{ row.sales_name || '–' }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ row.description || '–' }}</dd>
						</div>
					</dl>
				</section>

				<div v-else class="space-y-8">
					<section ref="formEl" class="scroll-mt-4 space-y-3">
						<h3 class="subhead">{{ editing ? 'Edit Pembayaran' : 'Catat Pembayaran' }}</h3>
						<p v-if="editing" class="text-s text-ink-muted">
							Mengubah <span class="font-medium text-ink">{{ editing.number }}</span
							>. Tipe pembayaran dan titipan tidak bisa diubah — batalkan lalu catat ulang bila perlu.
						</p>
						<form v-if="canPay || editing" class="space-y-4" @submit.prevent="savePayment">
							<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
								<FormField label="Tanggal" required :error="errors.date">
									<DatePicker v-model="payment.date" :min="row.date" :max="today" />
								</FormField>
								<FormField
									label="Tipe Pembayaran"
									required
									:error="errors.payment_type_id"
									:help="editing ? ['Tidak bisa diubah saat mengedit pembayaran.', 'Batalkan pembayaran lalu catat ulang bila perlu.'] : undefined"
								>
									<AsyncSelect
										:key="`type-${editing?.id ?? 'new'}`"
										:disabled="Boolean(editing)"
										:initial-label="editing?.payment_type_name"
										:model-value="payment.payment_type_id || null"
										endpoint="/customer-receivable/payment-types"
										:option-label="typeLabel"
										placeholder="Pilih tipe pembayaran…"
										@update:model-value="(value) => (payment.payment_type_id = value ? Number(value) : 0)"
										@select="pickType"
									/>
								</FormField>
								<!-- Always one field in this slot so the grid never reflows when the type changes. -->
								<FormField
									v-if="method === 'cash_bank'"
									label="Akun Cash / Bank"
									required
									:error="errors.bank_account_id"
									hint="Rekening tempat dana masuk"
								>
									<AsyncSelect
										:key="`bank-${editing?.id ?? 'new'}`"
										:initial-label="editing?.bank_account_name"
										:model-value="payment.bank_account_id"
										endpoint="/bank-account"
										:option-label="bankLabel"
										placeholder="Cari rekening…"
										@update:model-value="(value) => (payment.bank_account_id = value ? Number(value) : null)"
									/>
								</FormField>
								<FormField
									v-else-if="method === 'down_payment'"
									label="Titipan Customer"
									required
									:error="errors.deposit_id"
									hint="Titipan dari customer ini yang masih punya sisa"
									:help="editing ? ['Tidak bisa diubah saat mengedit pembayaran.', 'Batalkan pembayaran lalu catat ulang bila perlu.'] : undefined"
								>
									<AsyncSelect
										:key="`deposit-${editing?.id ?? 'new'}`"
										:disabled="Boolean(editing)"
										:initial-label="editing?.deposit_number"
										:model-value="payment.deposit_id"
										endpoint="/customer-deposit"
										:params="{ customer_id: row.customer_id, has_balance: 1 }"
										:option-label="depositLabel"
										placeholder="Cari titipan…"
										@update:model-value="(value) => (payment.deposit_id = value ? Number(value) : null)"
										@select="pickDeposit"
									/>
								</FormField>
								<FormField
									v-else-if="method === 'expense'"
									label="Biaya Penjualan"
									required
									:error="errors.sales_expense_id"
									hint="Biaya yang melunasi piutang (mis. ongkir) — bukan uang masuk, tanpa akun kas / bank"
								>
									<AsyncSelect
										:key="`expense-${editing?.id ?? 'new'}`"
										:initial-label="editing?.sales_expense_name"
										:model-value="payment.sales_expense_id"
										endpoint="/sales-expense"
										:option-label="expenseLabel"
										placeholder="Cari biaya penjualan…"
										@update:model-value="(value) => (payment.sales_expense_id = value ? Number(value) : null)"
									/>
								</FormField>
								<FormField
									v-else
									label="Referensi"
									hint="Terisi setelah tipe pembayaran dipilih"
									help="Aktif setelah tipe pembayaran dipilih, sesuai tipe yang dipilih."
								>
									<Input disabled placeholder="–" />
								</FormField>
								<FormField label="Nominal" required :error="errors.amount" :hint="`Maksimal Rp ${money(maxAmount)}`">
									<MoneyInput v-model="payment.amount" blank-zero placeholder="0" />
								</FormField>
								<FormField class="md:col-span-2" label="Keterangan" :error="errors.description">
									<Input v-model="payment.description" maxlength="250" placeholder="Keterangan pembayaran (opsional)" />
								</FormField>
							</div>
							<div class="flex flex-wrap justify-end gap-2 pt-2">
								<Button v-if="editing" type="button" variant="secondary" @click="resetForm">Batal</Button>
								<Button type="submit" :loading="saving"
									><IconPencil v-if="editing && !saving" class="h-4 w-4" /><IconPlus v-else-if="!saving" class="h-4 w-4" />
									{{ editing ? 'Simpan Perubahan' : 'Catat Pembayaran' }}</Button
								>
							</div>
						</form>
						<p v-else class="text-s text-ink-muted">Piutang sudah lunas — tidak ada sisa yang perlu dibayar.</p>
					</section>

					<section class="space-y-3">
						<h3 class="subhead">Riwayat Pembayaran</h3>
						<div class="overflow-x-auto">
							<table class="w-full min-w-[820px] text-m">
								<thead>
									<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
										<th class="px-3 py-2">Tanggal</th>
										<th class="px-3 py-2">Nomor</th>
										<th class="px-3 py-2">Tipe</th>
										<th class="px-3 py-2">Referensi</th>
										<th class="px-3 py-2">Keterangan</th>
										<th class="px-3 py-2 text-right">Nominal</th>
										<th class="w-28 px-3 py-2" />
									</tr>
								</thead>
								<tbody>
									<tr v-if="!row.payments.length">
										<td colspan="7" class="px-3 py-6 text-center text-s text-ink-muted">Belum ada pembayaran.</td>
									</tr>
									<tr
										v-for="item in row.payments"
										:key="item.id"
										class="border-b border-hairline last:border-0"
										:class="{ 'bg-primary/5': editing?.id === item.id }"
									>
										<td class="tnum whitespace-nowrap px-3 py-3 text-ink-muted">{{ date(item.date) }}</td>
										<td class="whitespace-nowrap px-3 py-3 text-ink">{{ item.number ?? '–' }}</td>
										<td class="whitespace-nowrap px-3 py-3 text-ink">{{ item.payment_type_name }}</td>
										<td class="px-3 py-3 text-ink">
											<RouterLink
												v-if="item.return_id"
												:to="`/sales-return/${item.return_id}`"
												class="whitespace-nowrap text-primary-dark hover:underline"
												>{{ item.return_number ?? item.reference }}</RouterLink
											>
											<RouterLink
												v-else-if="item.deposit_id"
												:to="`/customer-deposit/${item.deposit_id}`"
												class="whitespace-nowrap text-primary-dark hover:underline"
												>{{ item.deposit_number }}</RouterLink
											>
											<template v-else>{{ item.bank_account_name ?? item.sales_expense_name ?? (item.reference || '–') }}</template>
										</td>
										<td class="px-3 py-3 text-ink-muted">
											<template v-if="item.source === 'return'"
												>Dikelola dari Retur Penjualan
												<RouterLink :to="`/sales-return/${item.return_id}`" class="whitespace-nowrap text-primary-dark hover:underline">{{
													item.return_number ?? item.reference
												}}</RouterLink></template
											>
											<template v-else-if="item.source === 'creation'">Dibayar saat invoice dibuat — dikelola dari Invoice Penjualan</template>
											<template v-else>{{ item.description || '–' }}</template>
										</td>
										<td class="px-3 py-3 text-right"><Amount :value="item.amount" /></td>
										<td class="px-3 py-3 text-right">
											<!-- Only payments recorded here are writable; closed period: no edit / delete, just the reason. -->
											<template v-if="item.source === 'receivable'">
												<ClosingBadge v-if="item.locked" :title="LOCKED_HINT" />
												<div v-else class="flex justify-end gap-1">
													<button
														type="button"
														class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
														title="Edit pembayaran"
														@click="startEdit(item)"
													>
														<IconPencil class="h-4 w-4" />
													</button>
													<button
														type="button"
														class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
														title="Batalkan pembayaran"
														@click="removePayment(item)"
													>
														<IconTrash class="h-4 w-4" />
													</button>
												</div>
											</template>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
						<p v-if="hasLocked" class="flex items-center gap-1.5 text-s text-ink-muted">
							<IconLock class="h-4 w-4 shrink-0" /> Pembayaran pada periode yang sudah closing tidak dapat diedit atau dihapus.
						</p>
					</section>
				</div>
			</div>
		</Panel>
	</div>
</template>
