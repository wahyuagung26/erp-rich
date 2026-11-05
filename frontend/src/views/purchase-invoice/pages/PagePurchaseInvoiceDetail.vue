<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft, IconCheck, IconPaperclip, IconPencil, IconPlus, IconPrinter, IconTrash, IconHistory } from '@tabler/icons-vue'
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
import Amount from '@/components/base/Amount.vue'
import { approvalStatusLabel, approvalStatusTone } from '@/views/purchase-invoice/schema'
import type { PurchaseInvoice } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const invoice = ref<PurchaseInvoice>()
const loading = ref(true)
const notFound = ref(false)
const fakturPajak = useFakturPajak()

onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: PurchaseInvoice }>(`/purchase-invoice/${route.params.id}`)
		invoice.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}
const canWrite = computed(() => invoice.value?.approval_status === 'pending')

function approve() {
	const value = invoice.value
	if (!value) return
	ask(
		{
			title: 'Setujui invoice pembelian',
			message: `Setujui invoice pembelian “${value.number}”? Invoice yang disetujui tidak dapat diubah dan akan membentuk hutang supplier.`,
			type: 'info',
			confirmText: 'Setujui'
		},
		async () => {
			try {
				const res = await api.patch<{ data: PurchaseInvoice }>(`/purchase-invoice/${value.id}/approval`, { status: 'approved' })
				invoice.value = res.data.data
				toast.success('Invoice disetujui')
			} catch (error) {
				if (axios.isAxiosError(error)) toast.error(error.response?.data?.message ?? 'Invoice tidak dapat disetujui')
			}
		}
	)
}

// Opens the shared faktur pajak modal; the detail reloads after a save so the section below stays current.
function openTaxInvoice() {
	const value = invoice.value
	if (value) fakturPajak.open({ kode: value.number, endpoint: `/purchase-invoice/${value.id}/tax-invoice`, onSaved: load })
}

// Opens the shared record-history modal for this document.
function openHistory() {
	const value = invoice.value
	if (value) history.open({ kode: value.number, endpoint: `/purchase-invoice/${value.id}/history` })
}

// Opens the print view in a new tab; `?auto=1` makes it call window.print() once rendered.
function printDoc() {
	if (invoice.value)
		window.open(router.resolve({ name: 'PurchaseInvoicePrint', params: { id: invoice.value.id }, query: { auto: '1' } }).href, '_blank')
}

function remove() {
	const value = invoice.value
	if (!value) return
	ask({ title: 'Hapus invoice pembelian', message: `Hapus invoice pembelian “${value.number}”?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/purchase-invoice/${value.id}`)
			toast.success('Invoice pembelian dihapus')
			router.push('/purchase-invoice')
		} catch (error) {
			if (axios.isAxiosError(error)) toast.error(error.response?.data?.message ?? 'Invoice pembelian tidak dapat dihapus')
		}
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Invoice Pembelian" subtitle="Pembelian"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<Badge v-if="invoice" :tone="approvalStatusTone[invoice.approval_status]" class="mr-1">{{
						approvalStatusLabel[invoice.approval_status]
					}}</Badge
					><Button size="sm" variant="subtle" @click="router.push('/purchase-invoice')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					><Button size="sm" variant="subtle" :disabled="!invoice" @click="openHistory"><IconHistory class="h-4 w-4" /> Riwayat</Button
					><Button size="sm" variant="subtle" :disabled="!invoice" @click="printDoc"><IconPrinter class="h-4 w-4" /> Cetak</Button
					><Button v-if="canWrite" size="sm" variant="secondary" @click="router.push(`/purchase-invoice/edit/${invoice!.id}`)"
						><IconPencil class="h-4 w-4" /> Edit</Button
					><Button v-if="canWrite" size="sm" variant="subtle" @click="remove"><IconTrash class="h-4 w-4" /> Hapus</Button
					><Button v-if="canWrite" size="sm" @click="approve"><IconCheck class="h-4 w-4" /> Setujui</Button>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="10" /></Panel
		><Panel v-else-if="notFound || !invoice"
			><EmptyState title="Invoice pembelian tidak ditemukan" description="Data mungkin sudah dihapus."
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
							<dt class="text-s text-ink-muted">Nomor Invoice Supplier</dt>
							<dd class="mt-1 text-m text-ink">{{ invoice.supplier_invoice_number }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Departemen</dt>
							<dd class="mt-1 text-m text-ink">{{ invoice.department_code }} — {{ invoice.department_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Dibuat</dt>
							<dd class="mt-1 text-m text-ink">{{ invoice.created_by }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ invoice.description || '–' }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Referensi</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Penerimaan Pembelian</dt>
							<dd class="mt-1 text-m">
								<RouterLink :to="`/purchase-receipt/${invoice.purchase_receipt_id}`" class="text-primary-dark hover:underline">{{
									invoice.purchase_receipt_number
								}}</RouterLink>
							</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Order Pembelian</dt>
							<dd class="mt-1 text-m">
								<RouterLink :to="`/purchase-order/${invoice.purchase_order_id}`" class="text-primary-dark hover:underline">{{
									invoice.purchase_order_number
								}}</RouterLink>
							</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Supplier</dt>
							<dd class="mt-1 text-m text-ink">
								{{ invoice.supplier_code }} — {{ invoice.supplier_name }}
								<span class="text-s text-ink-muted">({{ invoice.pkp_active ? 'PKP Aktif' : 'Non-PKP' }})</span>
							</dd>
						</div>
					</dl>
				</section>

				<section v-if="invoice.approval_status === 'approved'" class="space-y-3">
					<h3 class="subhead">Persetujuan dan Hutang</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Disetujui Oleh</dt>
							<dd class="mt-1 text-m text-ink">{{ invoice.approved_by ?? '–' }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Disetujui Pada</dt>
							<dd class="mt-1 text-m text-ink">{{ invoice.approved_at ? date(invoice.approved_at, 'DD MMM YYYY HH:mm') : '–' }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Nomor Kontrabon</dt>
							<dd class="mt-1 text-m text-ink">{{ invoice.kontrabon_number ?? '–' }}</dd>
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
						<table class="w-full min-w-[820px] text-m">
							<thead>
								<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
									<th class="px-3 py-2">Produk</th>
									<th class="px-3 py-2 text-right">Jumlah</th>
									<th class="px-3 py-2 text-right">Harga Satuan</th>
									<th class="px-3 py-2 text-right">DPP</th>
									<th class="px-3 py-2 text-right">PPN</th>
									<th class="px-3 py-2 text-right">Total</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="(line, index) in invoice.lines" :key="index" class="border-b border-hairline last:border-0">
									<td class="px-3 py-3 text-ink">
										<div>{{ line.product_name }}</div>
										<div class="text-s text-ink-muted">{{ [line.product_code, line.brand_name].filter(Boolean).join(' · ') }}</div>
									</td>
									<td class="px-3 py-3 text-right text-ink">
										<div class="tnum">{{ line.quantity }}</div>
										<div class="text-s text-ink-muted">{{ line.unit_name || '–' }}</div>
									</td>
									<td class="px-3 py-3 text-right"><Amount :value="line.price" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.dpp" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.ppn" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.total" /></td>
								</tr>
							</tbody>
							<tfoot>
								<tr class="border-t border-hairline text-s">
									<td class="px-3 py-3 text-ink-muted" colspan="3">Total Invoice</td>
									<td class="px-3 py-3 text-right"><Amount :value="invoice.dpp" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="invoice.ppn" /></td>
									<td class="px-3 py-3 text-right text-m"><Amount :value="invoice.total" /></td>
								</tr>
							</tfoot>
						</table>
					</div>
				</section>
			</div>
		</Panel>
	</div>
</template>
