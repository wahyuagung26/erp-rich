<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconArrowLeft, IconPencil, IconPrinter, IconTrash, IconHistory } from '@tabler/icons-vue'
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
import { shippedSummary } from '@/views/delivery-note/schema'
import type { DeliveryNote } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const note = ref<DeliveryNote>()
const loading = ref(true)
const notFound = ref(false)
onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: DeliveryNote }>(`/delivery-note/${route.params.id}`)
		note.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}
const summary = computed(() => (note.value ? shippedSummary(note.value.lines) : { productCount: 0, totalQuantity: 0 }))

function openHistory() {
	if (note.value) history.open({ kode: note.value.number, endpoint: `/delivery-note/${note.value.id}/history` })
}

// Opens the print view in a new tab; `?auto=1` makes it call window.print() once rendered.
function printDoc() {
	if (note.value) window.open(router.resolve({ name: 'DeliveryNotePrint', params: { id: note.value.id }, query: { auto: '1' } }).href, '_blank')
}
function remove() {
	const value = note.value
	if (!value) return
	ask(
		{
			title: 'Hapus surat jalan',
			message: `Hapus surat jalan “${value.number}”? Invoice ${value.sales_invoice_number} dapat dibuatkan surat jalan baru.`,
			type: 'danger',
			confirmText: 'Hapus'
		},
		async () => {
			await api.delete(`/delivery-note/${value.id}`)
			toast.success('Surat jalan dihapus')
			router.push('/delivery-note')
		}
	)
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Surat Jalan" subtitle="Penjualan"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/delivery-note')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					><Button size="sm" variant="subtle" :disabled="!note" @click="openHistory"><IconHistory class="h-4 w-4" /> Riwayat</Button
					><Button size="sm" variant="subtle" :disabled="!note" @click="printDoc"><IconPrinter class="h-4 w-4" /> Cetak</Button
					><Button v-if="note" size="sm" variant="secondary" @click="router.push(`/delivery-note/edit/${note.id}`)"
						><IconPencil class="h-4 w-4" /> Edit</Button
					><Button v-if="note" size="sm" variant="subtle" @click="remove"><IconTrash class="h-4 w-4" /> Hapus</Button>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="10" /></Panel
		><Panel v-else-if="notFound || !note"><EmptyState title="Surat jalan tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel
		><Panel v-else>
			<div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi Surat Jalan</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nomor</dt>
							<dd class="mt-1 text-m text-ink">{{ note.number }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Tanggal</dt>
							<dd class="mt-1 text-m text-ink">{{ date(note.date) }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Dibuat</dt>
							<dd class="mt-1 text-m text-ink">{{ note.created_by }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ note.description || '–' }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Referensi Invoice</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nomor Invoice</dt>
							<dd class="mt-1 text-m">
								<RouterLink :to="`/sales-invoice/${note.sales_invoice_id}`" class="text-primary-dark hover:underline">{{
									note.sales_invoice_number
								}}</RouterLink>
							</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Tanggal Invoice</dt>
							<dd class="mt-1 text-m text-ink">{{ note.sales_invoice_date ? date(note.sales_invoice_date) : '–' }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Customer</dt>
							<dd class="mt-1 text-m text-ink">{{ note.customer_code }} — {{ note.customer_name }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Pengiriman</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Alamat Pengiriman</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ note.delivery_address }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Nama Penerima</dt>
							<dd class="mt-1 text-m text-ink">{{ note.recipient || '–' }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Nama Driver</dt>
							<dd class="mt-1 text-m text-ink">{{ note.driver || '–' }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">No. Kendaraan</dt>
							<dd class="mt-1 text-m text-ink">{{ note.vehicle || '–' }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Detail Produk</h3>
					<div class="overflow-x-auto">
						<table class="w-full min-w-[560px] text-m">
							<thead>
								<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
									<th class="px-3 py-2">Produk</th>
									<th class="px-3 py-2 text-right">Qty Invoice</th>
									<th class="px-3 py-2 text-right">Jumlah Dikirim</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="line in note.lines" :key="line.variant_id" class="border-b border-hairline last:border-0">
									<td class="px-3 py-3 text-ink">
										<div>{{ line.product_name }}</div>
										<div class="text-s text-ink-muted">{{ [line.sku, line.variant_label, line.brand_name].filter(Boolean).join(' · ') }}</div>
									</td>
									<td class="px-3 py-3 text-right tnum text-ink-muted">{{ line.invoice_quantity }} {{ line.unit_name }}</td>
									<td class="px-3 py-3 text-right text-ink">
										<span class="tnum">{{ line.quantity }}</span> <span class="text-s text-ink-muted">{{ line.unit_name }}</span>
									</td>
								</tr>
							</tbody>
							<tfoot>
								<tr class="border-t border-hairline text-s">
									<td class="px-3 py-3 text-ink-muted" colspan="2">Total Dikirim ({{ summary.productCount }} produk)</td>
									<td class="px-3 py-3 text-right text-m tnum text-ink">{{ summary.totalQuantity }}</td>
								</tr>
							</tfoot>
						</table>
					</div>
				</section>
			</div>
		</Panel>
	</div>
</template>
