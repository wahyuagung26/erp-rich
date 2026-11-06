<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft, IconCheck, IconFileInvoice, IconPencil, IconPrinter, IconRefresh, IconTrash, IconX, IconHistory } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useHistory } from '@/composables/useHistory'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import Badge from '@/components/base/Badge.vue'
import ApprovalBadge from '@/components/common/ApprovalBadge.vue'
import Amount from '@/components/base/Amount.vue'
import SalesTotalRows from '@/components/common/SalesTotalRows.vue'
import { invoiceStatusLabel, invoiceStatusTone } from '@/views/sales-order/schema'
import type { SalesOrder, SalesOrderApprovalStatus } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const order = ref<SalesOrder>()
const loading = ref(true)
const notFound = ref(false)
onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: SalesOrder }>(`/sales-order/${route.params.id}`)
		order.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}
const canEdit = computed(() => Boolean(order.value && order.value.approval_status !== 'approved' && order.value.invoice_status === 'not_invoiced'))
const canApprove = computed(() => order.value?.approval_status === 'pending')
const canInvoice = computed(() => order.value?.approval_status === 'approved' && order.value.invoice_status !== 'invoiced')
const totals = computed(() => {
	const value = order.value
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

function updateApproval(status: SalesOrderApprovalStatus) {
	const value = order.value
	if (!value) return
	const label = status === 'approved' ? 'Setujui' : status === 'rejected' ? 'Tolak' : 'Ajukan Ulang'
	ask(
		{
			title: `${label} sales order`,
			message: `${label} sales order “${value.number}”?`,
			type: status === 'rejected' ? 'danger' : 'info',
			confirmText: label
		},
		async () => {
			try {
				const res = await api.patch<{ data: SalesOrder }>(`/sales-order/${value.id}/approval`, { status })
				order.value = res.data.data
				toast.success('Status persetujuan diperbarui')
			} catch (error) {
				if (axios.isAxiosError(error)) toast.error(error.response?.data?.message ?? 'Status persetujuan tidak dapat diubah')
			}
		}
	)
}
// Opens the shared record-history modal for this document.
function openHistory() {
	const value = order.value
	if (value) history.open({ kode: value.number, endpoint: `/sales-order/${value.id}/history` })
}
// Opens the print view in a new tab; `?auto=1` makes it call window.print() once rendered.
function printDoc() {
	if (order.value) window.open(router.resolve({ name: 'SalesOrderPrint', params: { id: order.value.id }, query: { auto: '1' } }).href, '_blank')
}
function remove() {
	const value = order.value
	if (!value) return
	ask({ title: 'Hapus sales order', message: `Hapus sales order “${value.number}”?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/sales-order/${value.id}`)
			toast.success('Sales order dihapus')
			router.push('/sales-order')
		} catch (error) {
			if (axios.isAxiosError(error)) toast.error(error.response?.data?.message ?? 'Sales order tidak dapat dihapus')
		}
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Sales Order" subtitle="Penjualan"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<template v-if="order">
						<ApprovalBadge :status="order.approval_status" />
						<Badge class="mr-1 whitespace-nowrap" :tone="invoiceStatusTone[order.invoice_status]">{{
							invoiceStatusLabel[order.invoice_status]
						}}</Badge>
					</template>
					<Button size="sm" variant="subtle" @click="router.push('/sales-order')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button>
					<Button size="sm" variant="subtle" :disabled="!order" @click="openHistory"><IconHistory class="h-4 w-4" /> Riwayat</Button>
					<Button size="sm" variant="subtle" :disabled="!order" @click="printDoc"><IconPrinter class="h-4 w-4" /> Cetak</Button>
					<Button v-if="canEdit" size="sm" variant="secondary" @click="router.push(`/sales-order/edit/${order!.id}`)"
						><IconPencil class="h-4 w-4" /> Edit</Button
					>
					<Button v-if="canEdit" size="sm" variant="subtle" @click="remove"><IconTrash class="h-4 w-4" /> Hapus</Button>
					<Button v-if="canApprove" size="sm" @click="updateApproval('approved')"><IconCheck class="h-4 w-4" /> Setujui</Button>
					<Button v-if="canApprove" size="sm" variant="danger" @click="updateApproval('rejected')"><IconX class="h-4 w-4" /> Tolak</Button>
					<Button v-if="order?.approval_status === 'rejected'" size="sm" variant="secondary" @click="updateApproval('pending')"
						><IconRefresh class="h-4 w-4" /> Ajukan Ulang</Button
					>
					<Button v-if="canInvoice" size="sm" @click="router.push({ path: '/sales-invoice/tambah', query: { sales_order_id: order!.id } })"
						><IconFileInvoice class="h-4 w-4" /> Buat Invoice</Button
					>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="10" /></Panel
		><Panel v-else-if="notFound || !order"><EmptyState title="Sales order tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel>
		<Panel v-else>
			<div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi Order</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nomor</dt>
							<dd class="mt-1 text-m text-ink">{{ order.number }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Tanggal</dt>
							<dd class="mt-1 text-m text-ink">{{ date(order.date) }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Departemen</dt>
							<dd class="mt-1 text-m text-ink">{{ order.department_code }} — {{ order.department_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Customer</dt>
							<dd class="mt-1 text-m text-ink">
								{{ order.customer_code }} — {{ order.customer_name }}
								<span class="text-s text-ink-muted">({{ order.pkp_active ? 'PKP Aktif' : 'PKP Nonaktif' }})</span>
							</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Sales</dt>
							<dd class="mt-1 text-m text-ink">{{ order.sales_code }} — {{ order.sales_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Termin Pembayaran</dt>
							<dd class="mt-1 text-m text-ink">
								{{ order.top_days === 0 ? 'Tunai' : `${order.top_days} hari` }}
								<span class="text-s text-ink-muted">· jatuh tempo {{ date(order.due_date) }}</span>
							</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ order.description || '–' }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Persetujuan</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Dibuat</dt>
							<dd class="mt-1 text-m text-ink">{{ order.created_by }}</dd>
						</div>
						<div v-if="order.approval_status === 'approved'">
							<dt class="text-s text-ink-muted">Disetujui</dt>
							<dd class="mt-1 text-m text-ink">
								{{ order.approved_by ?? '–' }}<template v-if="order.approved_at"> pada {{ date(order.approved_at, 'DD MMM YYYY HH:mm') }}</template>
							</dd>
						</div>
						<div v-if="order.rejection_reason" class="md:col-span-3">
							<dt class="text-s text-ink-muted">Alasan Penolakan</dt>
							<dd class="mt-1 text-m text-danger">{{ order.rejection_reason }}</dd>
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
									<th class="px-3 py-2 text-right">Sudah Diinvoice</th>
									<th class="px-3 py-2 text-right">Harga Satuan</th>
									<th class="px-3 py-2 text-right">Diskon / Satuan</th>
									<th class="px-3 py-2 text-right">Total</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="line in order.lines" :key="line.product_id" class="border-b border-hairline last:border-0">
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
									<td class="px-3 py-3 text-right text-ink">
										<div class="tnum">{{ line.invoiced_quantity }}</div>
										<div class="text-s text-ink-muted">Sisa {{ line.remaining_quantity }}</div>
									</td>
									<td class="px-3 py-3 text-right"><Amount :value="line.price" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.discount" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.total" /></td>
								</tr>
							</tbody>
							<tfoot v-if="totals">
								<SalesTotalRows :totals="totals" :pkp="order.pkp_active" total-label="Total Sales Order" :label-span="6" />
							</tfoot>
						</table>
					</div>
				</section>

				<section v-if="order.expenses.length" class="space-y-3">
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
								<tr v-for="(expense, index) in order.expenses" :key="index" class="border-b border-hairline last:border-0">
									<td class="px-3 py-3 text-ink">{{ expense.sales_expense_code }} — {{ expense.sales_expense_name }}</td>
									<td class="px-3 py-3 text-ink-muted">{{ expense.notes || '–' }}</td>
									<td class="px-3 py-3 text-right"><Amount :value="expense.amount" /></td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</Panel>
	</div>
</template>
