<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft, IconCheck, IconPencil, IconPrinter, IconRefresh, IconTrash, IconX, IconHistory } from '@tabler/icons-vue'
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
import ClosingBadge from '@/components/common/ClosingBadge.vue'
import Badge from '@/components/base/Badge.vue'
import ApprovalBadge from '@/components/common/ApprovalBadge.vue'
import Amount from '@/components/base/Amount.vue'
import { deliveryStatusLabel, deliveryStatusTone } from '@/views/purchase-order/schema'
import type { PurchaseOrder, PurchaseOrderApprovalStatus } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const order = ref<PurchaseOrder>()
const loading = ref(true)
const notFound = ref(false)
onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: PurchaseOrder }>(`/purchase-order/${route.params.id}`)
		order.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}
const canEdit = computed(() =>
	Boolean(order.value && !order.value.locked && order.value.approval_status !== 'approved' && order.value.delivery_status === 'not_received')
)
const canApprove = computed(() => order.value?.approval_status === 'pending' && !order.value.locked)
function updateApproval(status: PurchaseOrderApprovalStatus) {
	const value = order.value
	if (!value) return
	const label = status === 'approved' ? 'Setujui' : status === 'rejected' ? 'Tolak' : 'Ajukan Ulang'
	ask(
		{
			title: `${label} order pembelian`,
			message: `${label} order pembelian “${value.number}”?`,
			type: status === 'rejected' ? 'danger' : 'info',
			confirmText: label
		},
		async () => {
			try {
				const res = await api.patch<{ data: PurchaseOrder }>(`/purchase-order/${value.id}/approval`, { status })
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
	if (value) history.open({ kode: value.number, endpoint: `/purchase-order/${value.id}/history` })
}

// Opens the print view in a new tab; `?auto=1` makes it call window.print() once rendered.
function printDoc() {
	if (order.value) window.open(router.resolve({ name: 'PurchaseOrderPrint', params: { id: order.value.id }, query: { auto: '1' } }).href, '_blank')
}
function remove() {
	const value = order.value
	if (!value) return
	ask({ title: 'Hapus order pembelian', message: `Hapus order pembelian “${value.number}”?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/purchase-order/${value.id}`)
			toast.success('Order pembelian dihapus')
			router.push('/purchase-order')
		} catch (error) {
			if (axios.isAxiosError(error)) toast.error(error.response?.data?.message ?? 'Order pembelian tidak dapat dihapus')
		}
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Order Pembelian" subtitle="Pembelian"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<ApprovalBadge v-if="order" :status="order.approval_status" class="mr-1" /><Button
						size="sm"
						variant="subtle"
						@click="router.push('/purchase-order')"
						><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					><Button size="sm" variant="subtle" :disabled="!order" @click="openHistory"><IconHistory class="h-4 w-4" /> Riwayat</Button
					><Button size="sm" variant="subtle" :disabled="!order" @click="printDoc"><IconPrinter class="h-4 w-4" /> Cetak</Button
					><ClosingBadge v-if="order?.locked" title="Periode sudah closing, dokumen tidak bisa diubah" /><Button
						v-if="canEdit"
						size="sm"
						variant="secondary"
						@click="router.push(`/purchase-order/edit/${order!.id}`)"
						><IconPencil class="h-4 w-4" /> Edit</Button
					><Button v-if="canEdit" size="sm" variant="subtle" @click="remove"><IconTrash class="h-4 w-4" /> Hapus</Button
					><Button v-if="canApprove" size="sm" @click="updateApproval('approved')"><IconCheck class="h-4 w-4" /> Setujui</Button
					><Button v-if="canApprove" size="sm" variant="danger" @click="updateApproval('rejected')"><IconX class="h-4 w-4" /> Tolak</Button
					><Button v-if="order?.approval_status === 'rejected' && !order.locked" size="sm" variant="secondary" @click="updateApproval('pending')"
						><IconRefresh class="h-4 w-4" /> Ajukan Ulang</Button
					>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="10" /></Panel
		><Panel v-else-if="notFound || !order"><EmptyState title="Order pembelian tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel>
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
							<dt class="text-s text-ink-muted">Jenis Pembelian</dt>
							<dd class="mt-1 text-m text-ink">{{ order.purchase_type || '–' }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Departemen</dt>
							<dd class="mt-1 text-m text-ink">{{ order.department_code }} — {{ order.department_name }}</dd>
						</div>
						<div class="md:col-span-2">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ order.description || '–' }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Supplier & Gudang</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Supplier</dt>
							<dd class="mt-1 text-m text-ink">
								{{ order.supplier_code }} — {{ order.supplier_name }}
								<span class="text-s text-ink-muted">({{ order.pkp_active ? 'PKP Aktif' : 'PKP Nonaktif' }})</span>
							</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Gudang Penerima</dt>
							<dd class="mt-1 text-m text-ink">{{ order.warehouse_code }} — {{ order.warehouse_name }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Alamat Supplier</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ order.address || '–' }}</dd>
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
						<div>
							<dt class="text-s text-ink-muted">Status Barang</dt>
							<dd class="mt-1 text-m">
								<Badge :tone="deliveryStatusTone[order.delivery_status]">{{ deliveryStatusLabel[order.delivery_status] }}</Badge>
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
						<table class="w-full min-w-[820px] text-m">
							<thead>
								<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
									<th class="px-3 py-2">Produk</th>
									<th class="px-3 py-2 text-right">Jumlah</th>
									<th class="px-3 py-2 text-right">Harga Satuan</th>
									<th class="px-3 py-2 text-right">Diskon</th>
									<th class="px-3 py-2 text-right">DPP</th>
									<th class="px-3 py-2 text-right">PPN</th>
									<th class="px-3 py-2 text-right">Total</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="(line, index) in order.lines" :key="index" class="border-b border-hairline last:border-0">
									<td class="px-3 py-3 text-ink">
										<div>{{ line.product_name }}</div>
										<div class="text-s text-ink-muted">{{ [line.product_code, line.brand_name].filter(Boolean).join(' · ') }}</div>
									</td>
									<td class="px-3 py-3 text-right text-ink">
										<div class="tnum">{{ line.quantity }}</div>
										<div class="text-s text-ink-muted">{{ line.unit_name || '–' }}</div>
									</td>
									<td class="px-3 py-3 text-right"><Amount :value="line.price" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.discount" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.dpp" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.ppn" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.total" /></td>
								</tr>
							</tbody>
							<tfoot>
								<tr class="border-t border-hairline text-s">
									<td class="px-3 py-3 text-ink-muted" colspan="4">Total PO</td>
									<td class="px-3 py-3 text-right"><Amount :value="order.dpp" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="order.ppn" /></td>
									<td class="px-3 py-3 text-right text-m"><Amount :value="order.total" /></td>
								</tr>
							</tfoot>
						</table>
					</div>
				</section>
			</div>
		</Panel>
	</div>
</template>
