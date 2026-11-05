<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft, IconFileInvoice, IconPrinter, IconPlus, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { date, money } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
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
import { payableStatusLabel, payableTone, validatePayment } from '@/views/supplier-payable/schema'
import type { SupplierPayable } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const row = ref<SupplierPayable>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: SupplierPayable }>(`/supplier-payable/${route.params.id}`)
		row.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})
// Opens the print view in a new tab; `?auto=1` makes it call window.print() once rendered.
function printDoc() {
	if (row.value) window.open(router.resolve({ name: 'SupplierPayablePrint', params: { id: row.value.id }, query: { auto: '1' } }).href, '_blank')
}
const message = (error: unknown, fallback: string) => (axios.isAxiosError(error) ? (error.response?.data?.message ?? fallback) : fallback)

// Payment form. The picked payment type's `method` decides whether a bank account, a purchase return or a supplier advance is asked for.
const today = new Date().toISOString().slice(0, 10)
const payment = reactive({
	date: today,
	payment_type_id: 0,
	bank_account_id: null as number | null,
	purchase_return_id: null as number | null,
	supplier_advance_id: null as number | null,
	description: '',
	amount: 0
})
const method = ref<string>()
const refRemaining = ref(0)
const errors = ref<Record<string, string>>({})
const saving = ref(false)
const canPay = computed(() => (row.value?.remaining_total ?? 0) > 0)

const paymentTypeLabel = (item: Record<string, unknown>) => `${String(item.code)} — ${String(item.name)}`
const bankLabel = (item: Record<string, unknown>) => String(item.bank_name)
const advanceLabel = (item: Record<string, unknown>) => `${String(item.number)} — sisa Rp ${money(Number(item.remaining))}`
const returnLabel = (item: Record<string, unknown>) => `${String(item.number)} — sisa Rp ${money(Number(item.remaining_total))}`

function pickType(item: Record<string, unknown> | null) {
	method.value = item ? String(item.method) : undefined
	payment.bank_account_id = null
	payment.purchase_return_id = null
	payment.supplier_advance_id = null
	refRemaining.value = 0
}
// Picking a return pre-fills the amount with whatever both the return and the payable can still absorb.
function pickReturn(item: Record<string, unknown> | null) {
	refRemaining.value = item ? Number(item.remaining_total) : 0
	if (item && row.value) payment.amount = Math.min(refRemaining.value, row.value.remaining_total)
}
// Same for an advance: pre-fill with what both the advance and the payable can absorb.
function pickAdvance(item: Record<string, unknown> | null) {
	refRemaining.value = item ? Number(item.remaining) : 0
	if (item && row.value) payment.amount = Math.min(refRemaining.value, row.value.remaining_total)
}

async function savePayment() {
	const value = row.value
	if (!value || saving.value) return
	const found = validatePayment(payment, method.value, value.remaining_total, refRemaining.value)
	errors.value = found ?? {}
	if (found) return
	saving.value = true
	try {
		const res = await api.post<{ data: SupplierPayable; message: string }>(`/supplier-payable/${value.id}/payments`, { ...payment })
		row.value = res.data.data
		Object.assign(payment, {
			payment_type_id: 0,
			bank_account_id: null,
			purchase_return_id: null,
			supplier_advance_id: null,
			description: '',
			amount: 0
		})
		method.value = undefined
		toast.success(res.data.message)
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 422 && error.response.data?.errors) {
			errors.value = Object.fromEntries(Object.entries(error.response.data.errors as Record<string, string[]>).map(([key, msgs]) => [key, msgs[0]]))
		} else toast.error(message(error, 'Pembayaran tidak dapat dicatat'))
	} finally {
		saving.value = false
	}
}

function removePayment(paymentId: number, number: string) {
	const value = row.value
	if (!value) return
	ask({ title: 'Batalkan pembayaran', message: `Batalkan pembayaran “${number}”?`, type: 'danger', confirmText: 'Batalkan' }, async () => {
		try {
			const res = await api.delete<{ data: SupplierPayable; message: string }>(`/supplier-payable/${value.id}/payments/${paymentId}`)
			row.value = res.data.data
			toast.success(res.data.message)
		} catch (error) {
			toast.error(message(error, 'Pembayaran tidak dapat dibatalkan'))
		}
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Hutang Supplier" subtitle="Pembelian"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<Badge v-if="row" class="mr-1 whitespace-nowrap" :tone="payableTone[row.status]">{{ payableStatusLabel[row.status] }}</Badge
					><Button size="sm" variant="subtle" @click="router.push('/supplier-payable')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					><Button v-if="row" size="sm" variant="secondary" @click="router.push(`/purchase-invoice/${row!.purchase_invoice_id}`)"
						><IconFileInvoice class="h-4 w-4" /> Lihat Invoice</Button
					><Button v-if="row" size="sm" variant="subtle" @click="printDoc"><IconPrinter class="h-4 w-4" /> Cetak</Button>
				</div></template
			></PageHeader
		>
		<Panel v-if="loading"><Skeleton :lines="10" /></Panel>
		<Panel v-else-if="notFound || !row"
			><EmptyState title="Hutang supplier tidak ditemukan" description="Hutang terbentuk setelah invoice pembelian disetujui."
		/></Panel>
		<Panel v-else>
			<div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi Hutang</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nomor</dt>
							<dd class="mt-1 text-m text-ink">{{ row.number }}</dd>
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
							<dt class="text-s text-ink-muted">Supplier</dt>
							<dd class="mt-1 text-m text-ink">{{ row.supplier_code }} — {{ row.supplier_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Departemen</dt>
							<dd class="mt-1 text-m text-ink">{{ row.department_code }} — {{ row.department_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Invoice Pembelian</dt>
							<dd class="mt-1 text-m">
								<RouterLink :to="`/purchase-invoice/${row.purchase_invoice_id}`" class="text-primary-dark hover:underline">{{
									row.purchase_invoice_number
								}}</RouterLink>
								<span class="text-s text-ink-muted"> · Invoice supplier {{ row.supplier_invoice_number }}</span>
							</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ row.description || '–' }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Ringkasan</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Total Hutang</dt>
							<dd class="mt-1 text-m"><Amount :value="row.total" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Terbayar</dt>
							<dd class="mt-1 text-m"><Amount :value="row.paid_total" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Sisa Hutang</dt>
							<dd class="mt-1 text-m font-semibold"><Amount :value="row.remaining_total" /></dd>
						</div>
					</dl>
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
									<th class="w-12 px-3 py-2" />
								</tr>
							</thead>
							<tbody>
								<tr v-if="!row.payments.length">
									<td colspan="7" class="px-3 py-6 text-center text-s text-ink-muted">Belum ada pembayaran.</td>
								</tr>
								<tr v-for="item in row.payments" :key="item.id" class="border-b border-hairline last:border-0">
									<td class="tnum whitespace-nowrap px-3 py-3 text-ink-muted">{{ date(item.date) }}</td>
									<td class="whitespace-nowrap px-3 py-3 text-ink">{{ item.number }}</td>
									<td class="whitespace-nowrap px-3 py-3 text-ink">{{ item.payment_type_name }}</td>
									<td class="px-3 py-3 text-ink">
										<RouterLink
											v-if="item.purchase_return_id"
											:to="`/purchase-return/${item.purchase_return_id}`"
											class="whitespace-nowrap text-primary-dark hover:underline"
											>{{ item.purchase_return_number }}</RouterLink
										>
										<RouterLink
											v-else-if="item.supplier_advance_id"
											:to="`/supplier-advance/${item.supplier_advance_id}`"
											class="whitespace-nowrap text-primary-dark hover:underline"
											>{{ item.supplier_advance_number }}</RouterLink
										>
										<template v-else>{{ item.bank_account_name ?? '–' }}</template>
									</td>
									<td class="px-3 py-3 text-ink-muted">{{ item.description || '–' }}</td>
									<td class="px-3 py-3 text-right"><Amount :value="item.amount" /></td>
									<td class="px-3 py-3 text-right">
										<button class="text-ink-subtle hover:text-danger" title="Batalkan pembayaran" @click="removePayment(item.id, item.number)">
											<IconTrash class="h-4 w-4" />
										</button>
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					<form v-if="canPay" class="space-y-3 pt-2" @submit.prevent="savePayment">
						<h4 class="text-m font-medium text-ink">Catat Pembayaran</h4>
						<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-4">
							<FormField label="Tanggal" required :error="errors.date"><DatePicker v-model="payment.date" :min="row.date" :max="today" /></FormField>
							<FormField label="Tipe Pembayaran" required :error="errors.payment_type_id" hint="Transfer, potong retur, atau uang muka supplier">
								<AsyncSelect
									:model-value="payment.payment_type_id || null"
									endpoint="/payment-type"
									:params="{ transaction_type: 'purchase', method: 'cash_bank,return_deduction,down_payment' }"
									:option-label="paymentTypeLabel"
									placeholder="Pilih tipe pembayaran…"
									@update:model-value="(value) => (payment.payment_type_id = value ? Number(value) : 0)"
									@select="pickType"
								/>
							</FormField>
							<FormField v-if="method === 'cash_bank'" label="Akun Cash / Bank" required :error="errors.bank_account_id">
								<AsyncSelect
									:model-value="payment.bank_account_id"
									endpoint="/bank-account"
									:option-label="bankLabel"
									placeholder="Cari rekening…"
									@update:model-value="(value) => (payment.bank_account_id = value ? Number(value) : null)"
								/>
							</FormField>
							<FormField
								v-else-if="method === 'return_deduction'"
								label="Retur Pembelian"
								required
								:error="errors.purchase_return_id"
								hint="Retur yang sudah disetujui dari supplier ini"
							>
								<AsyncSelect
									:model-value="payment.purchase_return_id"
									endpoint="/purchase-return"
									:params="{ supplier_id: row.supplier_id ?? 0, approval_status: 'approved', settlement_status: 'open' }"
									:option-label="returnLabel"
									placeholder="Cari retur…"
									@update:model-value="(value) => (payment.purchase_return_id = value ? Number(value) : null)"
									@select="pickReturn"
								/>
							</FormField>
							<FormField
								v-else-if="method === 'down_payment'"
								label="Uang Muka Supplier"
								required
								:error="errors.supplier_advance_id"
								hint="Uang muka dari supplier ini yang masih punya sisa"
							>
								<AsyncSelect
									:model-value="payment.supplier_advance_id"
									endpoint="/supplier-advance"
									:params="{ supplier_id: row.supplier_id ?? 0, has_balance: 1 }"
									:option-label="advanceLabel"
									placeholder="Cari uang muka…"
									@update:model-value="(value) => (payment.supplier_advance_id = value ? Number(value) : null)"
									@select="pickAdvance"
								/>
							</FormField>
							<FormField label="Nominal" required :error="errors.amount" :hint="`Maksimal sisa hutang Rp ${money(row.remaining_total)}`">
								<MoneyInput v-model="payment.amount" blank-zero placeholder="0" />
							</FormField>
							<FormField label="Keterangan" :error="errors.description"><Input v-model="payment.description" maxlength="250" /></FormField>
						</div>
						<div class="flex justify-end">
							<Button type="submit" size="sm" :loading="saving"><IconPlus v-if="!saving" class="h-4 w-4" /> Catat</Button>
						</div>
					</form>
				</section>
			</div>
		</Panel>
	</div>
</template>
