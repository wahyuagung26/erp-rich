<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import {
	IconArrowBackUp,
	IconArrowLeft,
	IconCheck,
	IconHistory,
	IconPaperclip,
	IconPencil,
	IconPlus,
	IconPrinter,
	IconRefresh,
	IconTruckDelivery,
	IconTrash,
	IconX
} from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useHistory } from '@/composables/useHistory'
import { useFakturPajak } from '@/composables/useFakturPajak'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import Badge from '@/components/base/Badge.vue'
import ClosingBadge from '@/components/common/ClosingBadge.vue'
import ApprovalBadge from '@/components/common/ApprovalBadge.vue'
import Amount from '@/components/base/Amount.vue'
import SalesTotalRows from '@/components/common/SalesTotalRows.vue'
import { paymentStatusLabel, paymentStatusTone } from '@/views/sales-invoice/schema'
import type { SalesInvoice, SalesInvoiceApprovalStatus } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const fakturPajak = useFakturPajak()
const invoice = ref<SalesInvoice>()
const loading = ref(true)
const notFound = ref(false)
const deliveryNote = ref<{ id: number; number: string } | null>(null)
const today = new Date().toISOString().slice(0, 10)

onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: SalesInvoice }>(`/sales-invoice/${route.params.id}`)
		invoice.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
	if (invoice.value?.approval_status === 'approved') await loadDeliveryNote(invoice.value.id)
}

// Surat Jalan of this invoice (0 or 1). A failure only hides the shortcut — never breaks the page.
async function loadDeliveryNote(invoiceId: number) {
	try {
		const res = await api.get<{ data: { id: number; number: string }[] }>('/delivery-note', { params: { sales_invoice_id: invoiceId, per_page: 1 } })
		deliveryNote.value = res.data.data[0] ?? null
	} catch {
		deliveryNote.value = null
	}
}

// Every action that moves stok / jurnal is gated on !locked; Faktur Pajak, Riwayat and Cetak stay (docs/sales-invoice/index.md).
const canEdit = computed(() => Boolean(invoice.value && invoice.value.approval_status !== 'approved' && !invoice.value.locked))
const canApprove = computed(() => Boolean(invoice.value && invoice.value.approval_status === 'pending' && !invoice.value.locked))
const canResubmit = computed(() => Boolean(invoice.value && invoice.value.approval_status === 'rejected' && !invoice.value.locked))
const hasReceivable = computed(() => invoice.value?.payments.some((payment) => payment.kind === 'receivable') ?? false)
// Batalkan Approval is offered only while nothing depends on the approved invoice (the server also guards Surat Jalan / Retur).
const canUnapprove = computed(() =>
	Boolean(invoice.value && invoice.value.approval_status === 'approved' && !invoice.value.locked && !hasReceivable.value)
)
const overdue = computed(() =>
	Boolean(invoice.value && invoice.value.approval_status === 'approved' && invoice.value.outstanding > 0 && invoice.value.due_date < today)
)
const totals = computed(() => {
	const value = invoice.value
	return value
		? {
				subtotal: value.subtotal,
				discount: value.discount_global,
				dpp: value.dpp,
				ppn: value.ppn,
				expense_total: value.expense_total,
				total: value.total
			}
		: undefined
})

const ACTIONS: Record<string, { label: string; type: 'info' | 'danger'; message: string }> = {
	approved: { label: 'Setujui', type: 'info', message: 'Invoice yang disetujui mengeluarkan stok dan membentuk jurnal piutang.' },
	rejected: { label: 'Tolak', type: 'danger', message: 'Invoice yang ditolak melepas jumlah pada sales order.' },
	resubmit: { label: 'Ajukan Ulang', type: 'info', message: 'Invoice kembali menunggu persetujuan.' },
	unapprove: { label: 'Batalkan Approval', type: 'danger', message: 'Stok dan jurnal invoice dikembalikan, invoice kembali menunggu persetujuan.' }
}

function updateApproval(action: keyof typeof ACTIONS) {
	const value = invoice.value
	if (!value) return
	const { label, type, message } = ACTIONS[action]
	const status: SalesInvoiceApprovalStatus = action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : 'pending'
	ask(
		{ title: `${label} invoice penjualan`, message: `${label} invoice penjualan “${value.number}”? ${message}`, type, confirmText: label },
		async () => {
			try {
				const res = await api.patch<{ data: SalesInvoice }>(`/sales-invoice/${value.id}/approval`, { status })
				invoice.value = res.data.data
				toast.success('Status persetujuan diperbarui')
			} catch (error) {
				if (axios.isAxiosError(error)) toast.error(error.response?.data?.message ?? 'Status persetujuan tidak dapat diubah')
			}
		}
	)
}

// Opens the shared faktur pajak modal; the detail reloads after a save so the section below stays current.
function openTaxInvoice() {
	const value = invoice.value
	if (value) fakturPajak.open({ kode: value.number, endpoint: `/sales-invoice/${value.id}/tax-invoice`, onSaved: load })
}
// Opens the shared record-history modal for this document.
function openHistory() {
	const value = invoice.value
	if (value) history.open({ kode: value.number, endpoint: `/sales-invoice/${value.id}/history` })
}
// Opens the print view in a new tab; `?auto=1` makes it call window.print() once rendered.
function printDoc() {
	if (invoice.value) window.open(router.resolve({ name: 'SalesInvoicePrint', params: { id: invoice.value.id }, query: { auto: '1' } }).href, '_blank')
}
function remove() {
	const value = invoice.value
	if (!value) return
	ask({ title: 'Hapus invoice penjualan', message: `Hapus invoice penjualan “${value.number}”?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/sales-invoice/${value.id}`)
			toast.success('Invoice penjualan dihapus')
			router.push('/sales-invoice')
		} catch (error) {
			if (axios.isAxiosError(error)) toast.error(error.response?.data?.message ?? 'Invoice penjualan tidak dapat dihapus')
		}
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Invoice Penjualan" subtitle="Penjualan"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<template v-if="invoice">
						<ApprovalBadge :status="invoice.approval_status" />
						<Badge v-if="invoice.approval_status !== 'rejected'" class="mr-1 whitespace-nowrap" :tone="paymentStatusTone[invoice.payment_status]">{{
							paymentStatusLabel[invoice.payment_status]
						}}</Badge>
					</template>
					<Button size="sm" variant="subtle" @click="router.push('/sales-invoice')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button>
					<Button size="sm" variant="subtle" :disabled="!invoice" @click="openHistory"><IconHistory class="h-4 w-4" /> Riwayat</Button>
					<Button size="sm" variant="subtle" :disabled="!invoice" @click="printDoc"><IconPrinter class="h-4 w-4" /> Cetak</Button>
					<ClosingBadge v-if="invoice?.locked" title="Periode sudah closing, dokumen tidak bisa diubah" />
					<template v-if="invoice?.approval_status === 'approved'">
						<Button v-if="deliveryNote" size="sm" variant="subtle" @click="router.push(`/delivery-note/${deliveryNote.id}`)"
							><IconTruckDelivery class="h-4 w-4" /> Lihat Surat Jalan</Button
						>
						<Button v-else size="sm" variant="subtle" @click="router.push(`/delivery-note/tambah?sales_invoice_id=${invoice.id}`)"
							><IconTruckDelivery class="h-4 w-4" /> Buat Surat Jalan</Button
						>
					</template>
					<Button v-if="canEdit" size="sm" variant="secondary" @click="router.push(`/sales-invoice/edit/${invoice!.id}`)"
						><IconPencil class="h-4 w-4" /> Edit</Button
					>
					<Button v-if="canEdit" size="sm" variant="subtle" @click="remove"><IconTrash class="h-4 w-4" /> Hapus</Button>
					<Button v-if="canApprove" size="sm" @click="updateApproval('approved')"><IconCheck class="h-4 w-4" /> Setujui</Button>
					<Button v-if="canApprove" size="sm" variant="danger" @click="updateApproval('rejected')"><IconX class="h-4 w-4" /> Tolak</Button>
					<Button v-if="canResubmit" size="sm" variant="secondary" @click="updateApproval('resubmit')"
						><IconRefresh class="h-4 w-4" /> Ajukan Ulang</Button
					>
					<Button v-if="canUnapprove" size="sm" variant="subtle" @click="updateApproval('unapprove')"
						><IconArrowBackUp class="h-4 w-4" /> Batalkan Approval</Button
					>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="10" /></Panel
		><Panel v-else-if="notFound || !invoice"
			><EmptyState title="Invoice penjualan tidak ditemukan" description="Data mungkin sudah dihapus."
		/></Panel>
		<Panel v-else>
			<div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi Transaksi</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nomor</dt>
							<dd class="mt-1 text-m text-ink">{{ invoice.number }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Tanggal</dt>
							<dd class="mt-1 text-m text-ink">{{ date(invoice.date) }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Departemen</dt>
							<dd class="mt-1 text-m text-ink">{{ invoice.department_code }} — {{ invoice.department_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Customer</dt>
							<dd class="mt-1 text-m text-ink">
								{{ invoice.customer_code }} — {{ invoice.customer_name }}
								<span class="text-s text-ink-muted">({{ invoice.pkp_active ? 'PKP Aktif' : 'PKP Nonaktif' }})</span>
							</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Sales</dt>
							<dd class="mt-1 text-m text-ink">{{ invoice.sales_code }} — {{ invoice.sales_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Termin Pembayaran</dt>
							<dd class="mt-1 text-m text-ink">
								{{ invoice.top_days === 0 ? 'Tunai' : `${invoice.top_days} hari` }}
								<span class="text-s" :class="overdue ? 'text-danger' : 'text-ink-muted'">· jatuh tempo {{ date(invoice.due_date) }}</span>
							</dd>
						</div>
						<div v-if="deliveryNote">
							<dt class="text-s text-ink-muted">Surat Jalan</dt>
							<dd class="mt-1 text-m">
								<RouterLink :to="`/delivery-note/${deliveryNote.id}`" class="text-primary-dark hover:underline">{{ deliveryNote.number }}</RouterLink>
							</dd>
						</div>
						<div v-if="invoice.sales_order_id">
							<dt class="text-s text-ink-muted">Sales Order</dt>
							<dd class="mt-1 text-m">
								<RouterLink :to="`/sales-order/${invoice.sales_order_id}`" class="text-primary-dark hover:underline">{{
									invoice.sales_order_number
								}}</RouterLink>
							</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ invoice.description || '–' }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Persetujuan</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Dibuat</dt>
							<dd class="mt-1 text-m text-ink">{{ invoice.created_by }}</dd>
						</div>
						<div v-if="invoice.approval_status === 'approved'">
							<dt class="text-s text-ink-muted">Disetujui</dt>
							<dd class="mt-1 text-m text-ink">
								{{ invoice.approved_by ?? '–'
								}}<template v-if="invoice.approved_at"> pada {{ date(invoice.approved_at, 'DD MMM YYYY HH:mm') }}</template>
							</dd>
						</div>
						<div v-if="invoice.rejection_reason" class="md:col-span-3">
							<dt class="text-s text-ink-muted">Alasan Penolakan</dt>
							<dd class="mt-1 text-m text-danger">{{ invoice.rejection_reason }}</dd>
						</div>
					</dl>
				</section>

				<section v-if="invoice.pkp_active" class="space-y-3">
					<div class="flex items-center justify-between gap-3">
						<h3 class="subhead">Faktur Pajak</h3>
						<Button size="sm" variant="secondary" @click="openTaxInvoice">
							<component :is="invoice.tax_invoice ? IconPencil : IconPlus" class="h-4 w-4" />
							{{ invoice.tax_invoice ? 'Lihat / Edit Faktur' : 'Tambah Faktur Pajak' }}
						</Button>
					</div>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nomor Faktur Pajak</dt>
							<dd class="mt-1 text-m text-ink">{{ invoice.tax_invoice?.number ?? '–' }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Tanggal Faktur Pajak</dt>
							<dd class="mt-1 text-m text-ink">{{ invoice.tax_invoice ? date(invoice.tax_invoice.date) : '–' }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">File Faktur Pajak</dt>
							<dd class="mt-1 text-m">
								<a
									v-if="invoice.tax_invoice?.file"
									:href="invoice.tax_invoice.file.data_url"
									:download="invoice.tax_invoice.file.name"
									class="inline-flex items-center gap-1 text-primary-dark hover:underline"
								>
									<IconPaperclip class="h-4 w-4 shrink-0" /> <span class="truncate">{{ invoice.tax_invoice.file.name }}</span>
								</a>
								<span v-else class="text-ink-muted">–</span>
							</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Detail Produk</h3>
					<div class="overflow-x-auto">
						<table class="w-full min-w-[900px] text-m">
							<thead>
								<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
									<th class="px-3 py-2">Produk</th>
									<th class="px-3 py-2">Gudang</th>
									<th class="px-3 py-2 text-right">Jumlah</th>
									<th class="px-3 py-2 text-right">Harga Satuan</th>
									<th class="px-3 py-2 text-right">Diskon / Satuan</th>
									<th class="px-3 py-2 text-right">Total</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="line in invoice.lines" :key="line.product_id" class="border-b border-hairline last:border-0">
									<td class="px-3 py-3 text-ink">
										<div>{{ line.product_name }}</div>
										<div class="text-s text-ink-muted">{{ [line.product_code, line.brand_name].filter(Boolean).join(' · ') }}</div>
										<div v-if="line.notes" class="text-s text-ink-muted">{{ line.notes }}</div>
									</td>
									<td class="px-3 py-3 text-ink">
										<div>{{ line.warehouse_name }}</div>
										<div class="text-s text-ink-muted">{{ line.warehouse_code }}</div>
									</td>
									<td class="px-3 py-3 text-right text-ink">
										<div class="tnum">{{ line.quantity }}</div>
										<div class="text-s text-ink-muted">{{ line.unit_name || '–' }}</div>
									</td>
									<td class="px-3 py-3 text-right"><Amount :value="line.price" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.discount" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.total" /></td>
								</tr>
							</tbody>
							<tfoot v-if="totals">
								<SalesTotalRows :totals="totals" :pkp="invoice.pkp_active" total-label="Total Invoice" :label-span="5" />
							</tfoot>
						</table>
					</div>
				</section>

				<section v-if="invoice.expenses.length" class="space-y-3">
					<h3 class="subhead">Biaya Penjualan</h3>
					<div class="overflow-x-auto">
						<table class="w-full min-w-[640px] text-m">
							<thead>
								<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
									<th class="px-3 py-2">Biaya</th>
									<th class="px-3 py-2">Keterangan</th>
									<th class="px-3 py-2 text-right">Nominal</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="(expense, index) in invoice.expenses" :key="index" class="border-b border-hairline last:border-0">
									<td class="px-3 py-3 text-ink">{{ expense.sales_expense_code }} — {{ expense.sales_expense_name }}</td>
									<td class="px-3 py-3 text-ink-muted">{{ expense.notes || '–' }}</td>
									<td class="px-3 py-3 text-right"><Amount :value="expense.amount" /></td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Pembayaran</h3>
					<p v-if="invoice.approval_status === 'approved' && invoice.outstanding > 0" class="text-s text-ink-subtle">
						Pembayaran berikutnya dicatat lewat Piutang Customer.
					</p>
					<div class="overflow-x-auto">
						<table class="w-full min-w-[640px] text-m">
							<thead>
								<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
									<th class="px-3 py-2">Tanggal</th>
									<th class="px-3 py-2">Tipe Pembayaran</th>
									<th class="px-3 py-2">Titipan / Referensi</th>
									<th class="px-3 py-2">Dibayar</th>
									<th class="px-3 py-2 text-right">Nominal</th>
								</tr>
							</thead>
							<tbody>
								<tr v-if="!invoice.payments.length">
									<td colspan="5" class="px-3 py-6 text-center text-s text-ink-muted">Belum ada pembayaran.</td>
								</tr>
								<tr v-for="payment in invoice.payments" :key="payment.id" class="border-b border-hairline last:border-0">
									<td class="tnum whitespace-nowrap px-3 py-3 text-ink-muted">{{ date(payment.date) }}</td>
									<td class="whitespace-nowrap px-3 py-3 text-ink">{{ payment.payment_type }}</td>
									<td class="px-3 py-3 text-ink">
										<RouterLink
											v-if="payment.deposit_id"
											:to="`/customer-deposit/${payment.deposit_id}`"
											class="whitespace-nowrap text-primary-dark hover:underline"
											>{{ payment.deposit_number }}</RouterLink
										>
										<template v-else>{{ payment.reference || '–' }}</template>
									</td>
									<td class="whitespace-nowrap px-3 py-3 text-ink-muted">
										{{ payment.kind === 'creation' ? 'Bersama invoice' : 'Pembayaran piutang' }}
									</td>
									<td class="px-3 py-3 text-right"><Amount :value="payment.amount" /></td>
								</tr>
							</tbody>
							<tfoot>
								<tr class="bg-fill font-semibold text-ink [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md">
									<td colspan="4" class="px-3 py-2.5 text-right text-ink-muted">Total Pembayaran</td>
									<td class="px-3 py-2.5 text-right"><Amount :value="invoice.paid_total" /></td>
								</tr>
								<tr class="text-m font-medium text-ink">
									<td colspan="4" class="px-3 py-2 text-right text-ink-muted">Sisa</td>
									<td class="px-3 py-2 text-right"><Amount :value="invoice.outstanding" /></td>
								</tr>
							</tfoot>
						</table>
					</div>
				</section>
			</div>
		</Panel>
	</div>
</template>
