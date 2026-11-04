<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft, IconPencil, IconTrash } from '@tabler/icons-vue'
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
import { invoiceStatusLabel, invoiceStatusTone, receiptSummary } from '@/views/purchase-receipt/schema'
import type { PurchaseReceipt } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const receipt = ref<PurchaseReceipt>()
const loading = ref(true)
const notFound = ref(false)
onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: PurchaseReceipt }>(`/purchase-receipt/${route.params.id}`)
		receipt.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}
const canWrite = computed(() => Boolean(receipt.value && receipt.value.invoice_status !== 'invoiced'))
const summary = computed(() => (receipt.value ? receiptSummary(receipt.value.lines) : { productCount: 0, totalQuantity: 0 }))
function remove() {
	const value = receipt.value
	if (!value) return
	ask(
		{ title: 'Hapus penerimaan pembelian', message: `Hapus penerimaan pembelian “${value.number}”?`, type: 'danger', confirmText: 'Hapus' },
		async () => {
			try {
				await api.delete(`/purchase-receipt/${value.id}`)
				toast.success('Penerimaan pembelian dihapus')
				router.push('/purchase-receipt')
			} catch (error) {
				if (axios.isAxiosError(error)) toast.error(error.response?.data?.message ?? 'Penerimaan pembelian tidak dapat dihapus')
			}
		}
	)
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Penerimaan Pembelian" subtitle="Pembelian"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<Badge v-if="receipt" :tone="invoiceStatusTone[receipt.invoice_status]">{{ invoiceStatusLabel[receipt.invoice_status] }}</Badge
					><Button size="sm" variant="subtle" @click="router.push('/purchase-receipt')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					><Button v-if="canWrite" size="sm" variant="secondary" @click="router.push(`/purchase-receipt/edit/${receipt!.id}`)"
						><IconPencil class="h-4 w-4" /> Edit</Button
					><Button v-if="canWrite" size="sm" variant="subtle" @click="remove"><IconTrash class="h-4 w-4" /> Hapus</Button>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="10" /></Panel
		><Panel v-else-if="notFound || !receipt"
			><EmptyState title="Penerimaan pembelian tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel
		><Panel v-else
			><div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi Transaksi</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nomor Penerimaan</dt>
							<dd class="mt-1">{{ receipt.number }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Tanggal Penerimaan</dt>
							<dd class="mt-1 tnum">{{ date(receipt.date) }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Order Pembelian</dt>
							<dd class="mt-1">{{ receipt.purchase_order_number }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Departemen</dt>
							<dd class="mt-1">{{ receipt.department_code }} — {{ receipt.department_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Surat Jalan Supplier</dt>
							<dd class="mt-1">{{ receipt.delivery_note_number }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Dibuat Oleh</dt>
							<dd class="mt-1">{{ receipt.created_by }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line">{{ receipt.description }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Referensi Order Pembelian</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Tanggal PO</dt>
							<dd class="mt-1 tnum">{{ receipt.purchase_order_date ? date(receipt.purchase_order_date) : '–' }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Supplier</dt>
							<dd class="mt-1">{{ receipt.supplier_code }} — {{ receipt.supplier_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Keterangan PO</dt>
							<dd class="mt-1">{{ receipt.purchase_order_description || '–' }}</dd>
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
									<th class="px-3 py-2">No Produk</th>
									<th class="px-3 py-2">Nama Produk</th>
									<th class="px-3 py-2">Merk</th>
									<th class="px-3 py-2">Satuan</th>
									<th class="px-3 py-2 text-right">Permintaan</th>
									<th class="px-3 py-2 text-right">Belum Terima</th>
									<th class="px-3 py-2 text-right">Sudah Terima</th>
									<th class="px-3 py-2 text-right">Jumlah</th>
									<th class="px-3 py-2">Gudang</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="(line, index) in receipt.lines" :key="index" class="border-b border-hairline last:border-0">
									<td class="px-3 py-3 tnum">{{ index + 1 }}</td>
									<td class="px-3 py-3">{{ line.product_code }}</td>
									<td class="px-3 py-3">{{ line.product_name }}</td>
									<td class="px-3 py-3">{{ line.brand_name || '–' }}</td>
									<td class="px-3 py-3">{{ line.unit_name || '–' }}</td>
									<td class="px-3 py-3 text-right tnum">{{ line.ordered_quantity }}</td>
									<td class="px-3 py-3 text-right tnum">{{ line.remaining_quantity }}</td>
									<td class="px-3 py-3 text-right tnum">{{ line.received_quantity }}</td>
									<td class="px-3 py-3 text-right tnum">{{ line.quantity }}</td>
									<td class="px-3 py-3">{{ line.warehouse_code ? `${line.warehouse_code} — ${line.warehouse_name}` : '–' }}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Ringkasan</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
						<div>
							<dt class="text-s text-ink-muted">Jumlah Produk Diterima</dt>
							<dd class="mt-1 tnum">{{ summary.productCount }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Total Kuantitas Diterima</dt>
							<dd class="mt-1 tnum">{{ summary.totalQuantity }}</dd>
						</div>
					</dl>
				</section>
			</div></Panel
		>
	</div>
</template>
