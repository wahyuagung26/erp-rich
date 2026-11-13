<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import {
	IconPrinter,
	IconArrowLeft,
	IconArrowBackUp,
	IconCheck,
	IconLock,
	IconPaperclip,
	IconPencil,
	IconPlus,
	IconRefresh,
	IconTrash,
	IconHistory,
	IconX
} from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import { useHistory } from '@/composables/useHistory'
import { useFakturPajak } from '@/composables/useFakturPajak'
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
import RadioGroup from '@/components/base/RadioGroup.vue'
import ApprovalBadge from '@/components/common/ApprovalBadge.vue'
import ClosingBadge from '@/components/common/ClosingBadge.vue'
import Amount from '@/components/base/Amount.vue'
import Tabs from '@/components/base/Tabs.vue'
import { settlementStatusLabel, settlementTone, settlementTypeLabel, settlementTypeOptions, validateSettlement } from '@/views/sales-return/schema'
import type { SalesReturn, SalesReturnApprovalStatus, SalesReturnSettlement, SalesReturnSettlementType } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const fakturPajak = useFakturPajak()
const row = ref<SalesReturn>()
const loading = ref(true)
const notFound = ref(false)

// Approved returns get two tabs: static info vs the settlement work area. Opens on Penyelesaian while something is left
// to settle; `?tab=` overrides it. A return that is not approved has nothing to settle, so it shows the info only (no tabs).
const tab = ref('informasi')
const tabs = computed(() => [
	{ label: 'Informasi', value: 'informasi' },
	{ label: `Penyelesaian (${row.value?.settlements.length ?? 0})`, value: 'penyelesaian' }
])

onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: SalesReturn }>(`/sales-return/${route.params.id}`)
		row.value = res.data.data
		const wanted = String(route.query.tab ?? '')
		const open = res.data.data.approval_status === 'approved' && res.data.data.remaining_total > 0
		tab.value = ['informasi', 'penyelesaian'].includes(wanted) ? wanted : open ? 'penyelesaian' : 'informasi'
		resetForm()
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}

// Every action that moves stok / jurnal is gated on !locked; Faktur Pajak, Riwayat and Cetak stay (docs/sales-return/index.md).
const approved = computed(() => row.value?.approval_status === 'approved')
const canWrite = computed(() => Boolean(row.value && row.value.approval_status !== 'approved' && !row.value.locked))
const canApprove = computed(() => Boolean(row.value && row.value.approval_status === 'pending' && !row.value.locked))
const canResubmit = computed(() => Boolean(row.value && row.value.approval_status === 'rejected' && !row.value.locked))
const canUnapprove = computed(() =>
	Boolean(row.value && row.value.approval_status === 'approved' && !row.value.locked && !row.value.settlements.length)
)
const canSettle = computed(() => approved.value && (row.value?.remaining_total ?? 0) > 0)

const ACTIONS: Record<string, { label: string; type: 'info' | 'danger'; message: string }> = {
	approved: { label: 'Setujui', type: 'info', message: 'Retur yang disetujui memasukkan stok ke gudang penerima dan membentuk jurnal pembalik.' },
	rejected: { label: 'Tolak', type: 'danger', message: 'Retur yang ditolak melepas jumlah retur pada invoice.' },
	resubmit: { label: 'Ajukan Ulang', type: 'info', message: 'Retur kembali menunggu persetujuan.' },
	unapprove: { label: 'Batalkan Approval', type: 'danger', message: 'Stok dan jurnal retur dikembalikan, retur kembali menunggu persetujuan.' }
}

function updateApproval(action: keyof typeof ACTIONS) {
	const value = row.value
	if (!value) return
	const { label, type, message: text } = ACTIONS[action]
	const status: SalesReturnApprovalStatus = action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : 'pending'
	ask({ title: `${label} retur penjualan`, message: `${label} retur penjualan “${value.number}”? ${text}`, type, confirmText: label }, async () => {
		const res = await api.patch<{ data: SalesReturn; message: string }>(`/sales-return/${value.id}/approval`, { status })
		row.value = res.data.data
		tab.value = res.data.data.approval_status === 'approved' ? 'penyelesaian' : 'informasi'
		resetForm()
		toast.success(res.data.message)
	})
}

function openTaxInvoice() {
	const value = row.value
	if (value) fakturPajak.open({ kode: value.number, endpoint: `/sales-return/${value.id}/tax-invoice`, onSaved: load })
}
// Opens the print view in a new tab; `?auto=1` makes it call window.print() once rendered.
function printDoc() {
	if (row.value) window.open(router.resolve({ name: 'SalesReturnPrint', params: { id: row.value.id }, query: { auto: '1' } }).href, '_blank')
}
function openHistory() {
	const value = row.value
	if (value) history.open({ kode: value.number, endpoint: `/sales-return/${value.id}/history` })
}
function remove() {
	const value = row.value
	if (!value) return
	ask({ title: 'Hapus retur penjualan', message: `Hapus retur penjualan “${value.number}”?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/sales-return/${value.id}`)
		toast.success('Retur penjualan dihapus')
		router.push('/sales-return')
	})
}

// "Penyelesaian" — offset the invoice receivable, or refund the customer. Each settlement is locked by its OWN date.
const today = new Date().toISOString().slice(0, 10)
const form = reactive({
	type: 'receivable_deduction' as SalesReturnSettlementType,
	date: today,
	bank_account_id: null as number | null,
	description: '',
	amount: 0
})
const formErrors = ref<Record<string, string>>({})
const saving = ref(false)
const bankLabel = (item: Record<string, unknown>) => String(item.bank_name)
const LOCKED_HINT = 'Periode sudah closing — tidak bisa diedit atau dihapus'

// Edit mode reuses the form: the settlement being edited (null = recording a new one). Its type stays fixed.
const editing = ref<SalesReturnSettlement | null>(null)
const formEl = ref<HTMLElement>()
// What the amount may reach: the return's balance (+ what the edited row already holds) and, for potong piutang, the invoice's Sisa.
const maxRemaining = computed(() => (row.value?.remaining_total ?? 0) + (editing.value?.amount ?? 0))
const maxInvoice = computed(() => (row.value?.invoice_outstanding ?? 0) + (editing.value?.type === 'receivable_deduction' ? editing.value.amount : 0))
const maxAmount = computed(() => (form.type === 'receivable_deduction' ? Math.min(maxRemaining.value, maxInvoice.value) : maxRemaining.value))
const hasLocked = computed(() => row.value?.settlements.some((item) => item.locked) ?? false)

function resetForm() {
	editing.value = null
	formErrors.value = {}
	// Default to potong piutang while the invoice still has a balance, otherwise the only way left is a refund.
	Object.assign(form, {
		type: (row.value?.invoice_outstanding ?? 0) > 0 ? 'receivable_deduction' : 'cash_bank',
		date: today,
		bank_account_id: null,
		description: '',
		amount: 0
	})
}

function startEdit(item: SalesReturnSettlement) {
	editing.value = item
	formErrors.value = {}
	Object.assign(form, { type: item.type, date: item.date, bank_account_id: item.bank_account_id, description: item.description, amount: item.amount })
	formEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function saveSettlement() {
	const value = row.value
	if (!value || saving.value) return
	const errors = validateSettlement(form, { remaining: maxRemaining.value, invoice: maxInvoice.value })
	formErrors.value = errors ?? {}
	if (errors) return
	saving.value = true
	try {
		const url = `/sales-return/${value.id}/settlements`
		const payload = { ...form, bank_account_id: form.type === 'cash_bank' ? form.bank_account_id : null }
		const res = editing.value
			? await api.put<{ data: SalesReturn; message: string }>(`${url}/${editing.value.id}`, payload)
			: await api.post<{ data: SalesReturn; message: string }>(url, payload)
		row.value = res.data.data
		resetForm()
		toast.success(res.data.message)
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 422 && error.response.data?.errors) {
			formErrors.value = Object.fromEntries(
				Object.entries(error.response.data.errors as Record<string, string[]>).map(([key, msgs]) => [key, msgs[0]])
			)
		} else toast.error(errorMessage(error, editing.value ? 'Penyelesaian tidak dapat diubah' : 'Penyelesaian tidak dapat dicatat'))
	} finally {
		saving.value = false
	}
}

function removeSettlement(item: SalesReturnSettlement) {
	const value = row.value
	if (!value) return
	ask(
		{
			title: 'Batalkan penyelesaian',
			message:
				item.type === 'receivable_deduction'
					? 'Batalkan potong piutang ini? Pembayaran di invoice ikut dihapus dan Sisa invoice kembali bertambah.'
					: 'Batalkan pencatatan pengembalian dana ini?',
			type: 'danger',
			confirmText: 'Batalkan'
		},
		async () => {
			const res = await api.delete<{ data: SalesReturn; message: string }>(`/sales-return/${value.id}/settlements/${item.id}`)
			row.value = res.data.data
			if (editing.value?.id === item.id) resetForm()
			toast.success(res.data.message)
		}
	)
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Retur Penjualan" subtitle="Penjualan"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<ApprovalBadge v-if="row" :status="row.approval_status" class="mr-1" />
					<Button size="sm" variant="subtle" @click="router.push('/sales-return')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button>
					<Button size="sm" variant="subtle" :disabled="!row" @click="openHistory"><IconHistory class="h-4 w-4" /> Riwayat</Button>
					<Button size="sm" variant="subtle" :disabled="!row" @click="printDoc"><IconPrinter class="h-4 w-4" /> Cetak</Button>
					<ClosingBadge v-if="row?.locked" title="Periode sudah closing, dokumen tidak bisa diubah" />
					<Button v-if="canWrite" size="sm" variant="secondary" @click="router.push(`/sales-return/edit/${row!.id}`)"
						><IconPencil class="h-4 w-4" /> Edit</Button
					>
					<Button v-if="canWrite" size="sm" variant="subtle" @click="remove"><IconTrash class="h-4 w-4" /> Hapus</Button>
					<Button v-if="canApprove" size="sm" @click="updateApproval('approved')"><IconCheck class="h-4 w-4" /> Setujui</Button>
					<Button v-if="canApprove" size="sm" variant="danger" @click="updateApproval('rejected')"><IconX class="h-4 w-4" /> Tolak</Button>
					<Button v-if="canResubmit" size="sm" variant="secondary" @click="updateApproval('resubmit')"
						><IconRefresh class="h-4 w-4" /> Ajukan Ulang</Button
					>
					<Button
						v-if="row?.approval_status === 'approved' && !row.locked"
						size="sm"
						variant="subtle"
						:disabled="!canUnapprove"
						:title="canUnapprove ? undefined : 'Tidak bisa dibatalkan: retur sudah dipakai atau dikembalikan'"
						@click="updateApproval('unapprove')"
						><IconArrowBackUp class="h-4 w-4" /> Batalkan Approval</Button
					>
				</div></template
			></PageHeader
		>
		<Panel v-if="loading"><Skeleton :lines="10" /></Panel>
		<Panel v-else-if="notFound || !row"><EmptyState title="Retur penjualan tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel>
		<Panel v-else>
			<div class="space-y-6">
				<!-- Always visible, above the tabs: Sisa Retur must never hide behind a tab, and it updates right after a settlement. -->
				<dl class="grid grid-cols-2 gap-x-6 gap-y-4" :class="approved ? 'md:grid-cols-4' : 'md:grid-cols-3'">
					<template v-if="approved">
						<div>
							<dt class="text-s text-ink-muted">Total Retur</dt>
							<dd class="mt-1 text-l"><Amount :value="row.total" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Dipakai Potong Piutang</dt>
							<dd class="mt-1 text-l"><Amount :value="row.used_total" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Dikembalikan ke Customer</dt>
							<dd class="mt-1 text-l"><Amount :value="row.refunded_total" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Sisa Retur</dt>
							<dd class="mt-1 flex flex-wrap items-center gap-2 text-l font-semibold">
								<Amount :value="row.remaining_total" />
								<Badge :tone="settlementTone[row.settlement_status]">{{ settlementStatusLabel[row.settlement_status] }}</Badge>
							</dd>
						</div>
					</template>
					<template v-else>
						<div>
							<dt class="text-s text-ink-muted">Sub Total (DPP)</dt>
							<dd class="mt-1 text-l"><Amount :value="row.dpp" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">PPN</dt>
							<dd class="mt-1 text-l"><Amount :value="row.ppn" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Total Retur</dt>
							<dd class="mt-1 text-l font-semibold"><Amount :value="row.total" /></dd>
						</div>
					</template>
				</dl>

				<Tabs v-if="approved" v-model="tab" :tabs="tabs" />

				<div v-if="tab === 'informasi' || !approved" class="space-y-8">
					<section class="space-y-3">
						<h3 class="subhead">Informasi Transaksi</h3>
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
								<dt class="text-s text-ink-muted">Gudang Penerima</dt>
								<dd class="mt-1 text-m text-ink">{{ row.warehouse_code }} — {{ row.warehouse_name }}</dd>
							</div>
							<div>
								<dt class="text-s text-ink-muted">Departemen</dt>
								<dd class="mt-1 text-m text-ink">{{ row.department_code }} — {{ row.department_name }}</dd>
							</div>
							<div>
								<dt class="text-s text-ink-muted">Dibuat</dt>
								<dd class="mt-1 text-m text-ink">{{ row.created_by }}</dd>
							</div>
							<div class="md:col-span-3">
								<dt class="text-s text-ink-muted">Alasan Retur</dt>
								<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ row.reason }}</dd>
							</div>
						</dl>
					</section>

					<section class="space-y-3">
						<h3 class="subhead">Referensi Invoice</h3>
						<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
							<div>
								<dt class="text-s text-ink-muted">Invoice Penjualan</dt>
								<dd class="mt-1 text-m">
									<RouterLink :to="`/sales-invoice/${row.sales_invoice_id}`" class="text-primary-dark hover:underline">{{
										row.sales_invoice_number
									}}</RouterLink>
								</dd>
							</div>
							<div>
								<dt class="text-s text-ink-muted">Customer</dt>
								<dd class="mt-1 text-m text-ink">
									{{ row.customer_code }} — {{ row.customer_name }}
									<span class="text-s text-ink-muted">({{ row.pkp_active ? 'PKP Aktif' : 'Non-PKP' }})</span>
								</dd>
							</div>
							<div>
								<dt class="text-s text-ink-muted">Sisa Piutang Invoice</dt>
								<dd class="mt-1 text-m"><Amount :value="row.invoice_outstanding" /></dd>
							</div>
						</dl>
					</section>

					<section v-if="row.approval_status !== 'pending'" class="space-y-3">
						<h3 class="subhead">Persetujuan</h3>
						<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
							<template v-if="approved">
								<div>
									<dt class="text-s text-ink-muted">Disetujui Oleh</dt>
									<dd class="mt-1 text-m text-ink">{{ row.approved_by ?? '–' }}</dd>
								</div>
								<div>
									<dt class="text-s text-ink-muted">Disetujui Pada</dt>
									<dd class="mt-1 text-m text-ink">{{ row.approved_at ? date(row.approved_at, 'DD MMM YYYY HH:mm') : '–' }}</dd>
								</div>
							</template>
							<div v-if="row.rejection_reason" class="md:col-span-3">
								<dt class="text-s text-ink-muted">Alasan Penolakan</dt>
								<dd class="mt-1 text-m text-danger">{{ row.rejection_reason }}</dd>
							</div>
						</dl>
					</section>

					<section v-if="row.pkp_active && approved" class="space-y-3">
						<div class="flex items-center justify-between gap-3">
							<h3 class="subhead">Faktur Pajak</h3>
							<Button size="sm" variant="secondary" @click="openTaxInvoice">
								<component :is="row.tax_invoice ? IconPencil : IconPlus" class="h-4 w-4" />
								{{ row.tax_invoice ? 'Lihat / Edit Faktur' : 'Tambah Faktur Pajak' }}
							</Button>
						</div>
						<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
							<div>
								<dt class="text-s text-ink-muted">Nomor Faktur Pajak</dt>
								<dd class="mt-1 text-m text-ink">{{ row.tax_invoice?.number ?? '–' }}</dd>
							</div>
							<div>
								<dt class="text-s text-ink-muted">Tanggal Faktur Pajak</dt>
								<dd class="mt-1 text-m text-ink">{{ row.tax_invoice ? date(row.tax_invoice.date) : '–' }}</dd>
							</div>
							<div>
								<dt class="text-s text-ink-muted">File Faktur Pajak</dt>
								<dd class="mt-1 text-m">
									<a
										v-if="row.tax_invoice?.file"
										:href="row.tax_invoice.file.data_url"
										:download="row.tax_invoice.file.name"
										class="inline-flex items-center gap-1 text-primary-dark hover:underline"
									>
										<IconPaperclip class="h-4 w-4 shrink-0" /> <span class="truncate">{{ row.tax_invoice.file.name }}</span>
									</a>
									<span v-else class="text-ink-muted">–</span>
								</dd>
							</div>
						</dl>
					</section>

					<section class="space-y-3">
						<h3 class="subhead">Detail Produk</h3>
						<div class="overflow-x-auto">
							<table class="w-full min-w-[980px] text-m">
								<thead>
									<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
										<th class="px-3 py-2">Produk</th>
										<th class="px-3 py-2 text-right">Qty Terjual</th>
										<th class="px-3 py-2 text-right">Sudah Diretur</th>
										<th class="px-3 py-2 text-right">Qty Retur</th>
										<th class="px-3 py-2 text-right">Harga Satuan</th>
										<th class="px-3 py-2 text-right">Diskon / Satuan</th>
										<th class="px-3 py-2 text-right">DPP</th>
										<th class="px-3 py-2 text-right">PPN</th>
										<th class="px-3 py-2 text-right">Total</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="line in row.lines" :key="line.variant_id" class="border-b border-hairline last:border-0">
										<td class="px-3 py-3 text-ink">
											<div>{{ line.product_name }}</div>
											<div class="text-s text-ink-muted">{{ [line.sku, line.variant_label, line.brand_name].filter(Boolean).join(' · ') }}</div>
										</td>
										<td class="px-3 py-3 text-right text-ink">
											<div class="tnum">{{ line.quantity_sold }}</div>
											<div class="text-s text-ink-muted">{{ line.unit_name || '–' }}</div>
										</td>
										<td class="tnum px-3 py-3 text-right text-ink-muted">{{ line.quantity_returned_before }}</td>
										<td class="tnum px-3 py-3 text-right text-ink">{{ line.quantity }}</td>
										<td class="px-3 py-3 text-right"><Amount :value="line.price" /></td>
										<td class="px-3 py-3 text-right"><Amount :value="line.discount" /></td>
										<td class="px-3 py-3 text-right"><Amount :value="line.dpp" /></td>
										<td class="px-3 py-3 text-right"><Amount :value="line.ppn" /></td>
										<td class="px-3 py-3 text-right"><Amount :value="line.total" /></td>
									</tr>
								</tbody>
								<tfoot>
									<tr class="border-t border-hairline text-s">
										<td class="px-3 py-3 text-ink-muted" colspan="6">Total Retur</td>
										<td class="px-3 py-3 text-right"><Amount :value="row.dpp" /></td>
										<td class="px-3 py-3 text-right"><Amount :value="row.ppn" /></td>
										<td class="px-3 py-3 text-right text-m"><Amount :value="row.total" /></td>
									</tr>
								</tfoot>
							</table>
						</div>
					</section>
				</div>

				<div v-else class="space-y-8">
					<section ref="formEl" class="scroll-mt-4 space-y-3">
						<h3 class="subhead">{{ editing ? 'Edit Penyelesaian' : 'Catat Penyelesaian' }}</h3>
						<p v-if="editing" class="text-s text-ink-muted">
							Mengubah {{ settlementTypeLabel[editing.type].toLowerCase() }} tanggal {{ date(editing.date) }}.
						</p>
						<form v-if="canSettle || editing" class="space-y-4" @submit.prevent="saveSettlement">
							<FormField v-if="!editing" label="Cara Penyelesaian" required :error="formErrors.type">
								<RadioGroup v-model="form.type" :options="settlementTypeOptions" inline />
							</FormField>
							<div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
								<FormField label="Tanggal" required :error="formErrors.date">
									<DatePicker v-model="form.date" :min="row.date" :max="today" />
								</FormField>
								<FormField
									v-if="form.type === 'cash_bank'"
									label="Akun Cash / Bank"
									required
									:error="formErrors.bank_account_id"
									hint="Rekening tempat dana dikembalikan keluar"
								>
									<AsyncSelect
										:key="`bank-${editing?.id ?? 'new'}`"
										:model-value="form.bank_account_id"
										endpoint="/bank-account"
										:option-label="bankLabel"
										:initial-label="editing?.bank_account_name"
										placeholder="Cari rekening…"
										@update:model-value="(value) => (form.bank_account_id = value ? Number(value) : null)"
									/>
								</FormField>
								<FormField v-else label="Referensi" hint="Piutang invoice yang dipotong">
									<Input :model-value="row.sales_invoice_number" disabled />
								</FormField>
								<FormField
									label="Nominal"
									required
									:error="formErrors.amount"
									:hint="
										form.type === 'receivable_deduction'
											? `Maksimal Rp ${money(maxAmount)} (sisa retur atau sisa piutang invoice)`
											: `Maksimal Rp ${money(maxAmount)}`
									"
								>
									<MoneyInput v-model="form.amount" blank-zero placeholder="0" />
								</FormField>
								<FormField class="md:col-span-3" label="Keterangan" :error="formErrors.description">
									<Input v-model="form.description" maxlength="250" placeholder="Keterangan penyelesaian (opsional)" />
								</FormField>
							</div>
							<div class="flex flex-wrap justify-end gap-2 pt-2">
								<Button v-if="editing" type="button" variant="secondary" @click="resetForm">Batal</Button>
								<Button type="submit" :loading="saving">
									<IconPencil v-if="editing && !saving" class="h-4 w-4" /><IconPlus v-else-if="!saving" class="h-4 w-4" />
									{{ editing ? 'Simpan Perubahan' : 'Catat Penyelesaian' }}
								</Button>
							</div>
						</form>
						<p v-else class="text-s text-ink-muted">Retur sudah diselesaikan — tidak ada sisa yang perlu dikembalikan atau dipotongkan.</p>
					</section>

					<section class="space-y-3">
						<h3 class="subhead">Riwayat Penyelesaian</h3>
						<div class="overflow-x-auto">
							<table class="w-full min-w-[820px] text-m">
								<thead>
									<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
										<th class="px-3 py-2">Tanggal</th>
										<th class="px-3 py-2">Jenis</th>
										<th class="px-3 py-2">Referensi</th>
										<th class="px-3 py-2">Keterangan</th>
										<th class="px-3 py-2 text-right">Nominal</th>
										<th class="w-28 px-3 py-2" />
									</tr>
								</thead>
								<tbody>
									<tr v-if="!row.settlements.length">
										<td colspan="6" class="px-3 py-6 text-center text-s text-ink-muted">Belum ada potong piutang atau pengembalian dana.</td>
									</tr>
									<tr
										v-for="item in row.settlements"
										:key="item.id"
										class="border-b border-hairline last:border-0"
										:class="{ 'bg-primary/5': editing?.id === item.id }"
									>
										<td class="tnum whitespace-nowrap px-3 py-3 text-ink-muted">{{ date(item.date) }}</td>
										<td class="whitespace-nowrap px-3 py-3 text-ink">{{ settlementTypeLabel[item.type] }}</td>
										<td class="px-3 py-3 text-ink">
											<RouterLink
												v-if="item.type === 'receivable_deduction'"
												:to="`/sales-invoice/${row.sales_invoice_id}`"
												class="whitespace-nowrap text-primary-dark hover:underline"
												>{{ row.sales_invoice_number }}</RouterLink
											>
											<template v-else>{{ item.bank_account_name ?? '–' }}</template>
										</td>
										<td class="px-3 py-3 text-ink-muted">{{ item.description || '–' }}</td>
										<td class="px-3 py-3 text-right"><Amount :value="item.amount" /></td>
										<td class="px-3 py-3 text-right">
											<!-- Closed period: no edit / delete, just the reason. -->
											<ClosingBadge v-if="item.locked" :title="LOCKED_HINT" />
											<div v-else class="flex justify-end gap-1">
												<button
													type="button"
													class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
													title="Edit penyelesaian"
													@click="startEdit(item)"
												>
													<IconPencil class="h-4 w-4" />
												</button>
												<button
													type="button"
													class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
													title="Batalkan penyelesaian"
													@click="removeSettlement(item)"
												>
													<IconTrash class="h-4 w-4" />
												</button>
											</div>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
						<p v-if="hasLocked" class="flex items-center gap-1.5 text-s text-ink-muted">
							<IconLock class="h-4 w-4 shrink-0" /> Penyelesaian pada periode yang sudah closing tidak dapat diedit atau dihapus.
						</p>
					</section>
				</div>
			</div>
		</Panel>
	</div>
</template>
