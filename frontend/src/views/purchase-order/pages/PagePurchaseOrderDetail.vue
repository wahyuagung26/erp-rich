<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft, IconCheck, IconPencil, IconRefresh, IconTrash, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import Badge from '@/components/base/Badge.vue'
import Amount from '@/components/base/Amount.vue'
import { approvalStatusLabel, approvalStatusTone, deliveryStatusLabel, deliveryStatusTone } from '@/views/purchase-order/schema'
import type { PurchaseOrder, PurchaseOrderApprovalStatus } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
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
const canEdit = computed(() => Boolean(order.value && order.value.approval_status !== 'approved' && order.value.delivery_status === 'not_received'))
const canApprove = computed(() => order.value?.approval_status === 'pending')
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
	<div class="max-w-5xl space-y-4 p-4">
		<PageHeader title="Detail Order Pembelian" subtitle="Pembelian"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<Badge v-if="order" :tone="approvalStatusTone[order.approval_status]">{{ approvalStatusLabel[order.approval_status] }}</Badge
					><Button size="sm" variant="subtle" @click="router.push('/purchase-order')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					><Button v-if="canEdit" size="sm" variant="secondary" @click="router.push(`/purchase-order/edit/${order!.id}`)"
						><IconPencil class="h-4 w-4" /> Edit</Button
					><Button v-if="canEdit" size="sm" variant="subtle" @click="remove"><IconTrash class="h-4 w-4" /> Hapus</Button
					><Button v-if="canApprove" size="sm" @click="updateApproval('approved')"><IconCheck class="h-4 w-4" /> Setujui</Button
					><Button v-if="canApprove" size="sm" variant="danger" @click="updateApproval('rejected')"><IconX class="h-4 w-4" /> Tolak</Button
					><Button v-if="order?.approval_status === 'rejected'" size="sm" variant="secondary" @click="updateApproval('pending')"
						><IconRefresh class="h-4 w-4" /> Ajukan Ulang</Button
					>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="10" /></Panel
		><Panel v-else-if="notFound || !order"><EmptyState title="Order pembelian tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel
		><Panel v-else
			><div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi Transaksi</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nomor Transaksi</dt>
							<dd class="mt-1">{{ order.number }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Tanggal</dt>
							<dd class="mt-1 font-mono tnum">{{ date(order.date) }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Supplier</dt>
							<dd class="mt-1">
								{{ order.supplier_code }} — {{ order.supplier_name }}
								<span class="text-s text-ink-muted">({{ order.pkp_active ? 'PKP Aktif' : 'PKP Nonaktif' }})</span>
							</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Departemen</dt>
							<dd class="mt-1">{{ order.department_code }} — {{ order.department_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Gudang</dt>
							<dd class="mt-1">{{ order.warehouse_code }} — {{ order.warehouse_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Jenis Pembelian</dt>
							<dd class="mt-1">{{ order.purchase_type || '–' }}</dd>
						</div>
						<div class="md:col-span-2">
							<dt class="text-s text-ink-muted">Alamat</dt>
							<dd class="mt-1 whitespace-pre-line">{{ order.address }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Dibuat Oleh</dt>
							<dd class="mt-1">{{ order.created_by }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line">{{ order.description }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Status Barang</dt>
							<dd class="mt-1">
								<Badge :tone="deliveryStatusTone[order.delivery_status]">{{ deliveryStatusLabel[order.delivery_status] }}</Badge>
							</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Disetujui Oleh</dt>
							<dd class="mt-1">{{ order.approved_by || '–' }}</dd>
						</div>
					</dl>
				</section>
				<section class="space-y-3">
					<h3 class="subhead">Produk</h3>
					<div class="overflow-x-auto">
						<table class="w-full min-w-[1120px] text-m">
							<thead>
								<tr class="border-b border-hairline text-left text-s text-ink-muted">
									<th class="px-3 py-2">No.</th>
									<th class="px-3 py-2">Kode Produk</th>
									<th class="px-3 py-2">Nama Produk</th>
									<th class="px-3 py-2">Merk</th>
									<th class="px-3 py-2">Satuan</th>

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
									<td class="px-3 py-3 font-mono tnum">{{ index + 1 }}</td>
									<td class="px-3 py-3">{{ line.product_code }}</td>
									<td class="px-3 py-3">{{ line.product_name }}</td>
									<td class="px-3 py-3">{{ line.brand_name || '–' }}</td>
									<td class="px-3 py-3">{{ line.unit_name || '–' }}</td>

									<td class="px-3 py-3 text-right font-mono tnum">{{ line.quantity }}</td>
									<td class="px-3 py-3 text-right"><Amount :value="line.price" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.discount" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.dpp" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.ppn" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.total" /></td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>
				<section class="space-y-3">
					<h3 class="subhead">Ringkasan</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-4">
						<div>
							<dt class="text-s text-ink-muted">DPP</dt>
							<dd class="mt-1"><Amount :value="order.dpp" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">PPN</dt>
							<dd class="mt-1"><Amount :value="order.ppn" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Nett</dt>
							<dd class="mt-1"><Amount :value="order.nett" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Total PO</dt>
							<dd class="mt-1"><Amount :value="order.total" /></dd>
						</div>
					</dl>
					<p v-if="order.rejection_reason" class="text-s text-danger">{{ order.rejection_reason }}</p>
				</section>
			</div></Panel
		>
	</div>
</template>
