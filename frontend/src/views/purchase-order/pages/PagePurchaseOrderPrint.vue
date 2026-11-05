<script setup lang="ts">
// Print view of one purchase order (Legacy "Purchase Order" sheet, A4 portrait). Pending POs carry a DRAFT watermark.
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { usePrintCompany } from '@/composables/usePrintCompany'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintPaper from '@/components/print/PrintPaper.vue'
import PrintDocHeader from '@/components/print/PrintDocHeader.vue'
import { printTd as td, printTh as th } from '@/components/print/styles'
import type { PurchaseOrder } from '@/utils/types'

const MIN_ROWS = 8
const route = useRoute()
const order = ref<PurchaseOrder>()
const { company, load: loadCompany } = usePrintCompany()
const loading = ref(true)
const notFound = ref(false)
// Print figures follow the Legacy sheet: comma thousands, up to 2 decimals.
const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const amount = (value: number) => amountFormat.format(value)

onMounted(async () => {
	try {
		const [po] = await Promise.all([api.get<{ data: PurchaseOrder }>(`/purchase-order/${route.params.id}`), loadCompany()])
		order.value = po.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})
</script>

<template>
	<PrintLayout
		:loading="loading"
		:not-found="notFound || !order || !company"
		not-found-title="Order pembelian tidak ditemukan"
		:doc-number="order?.number"
		portrait
	>
		<PrintPaper v-if="order && company" :watermark="order.approval_status === 'pending' ? 'Draft' : undefined">
			<PrintDocHeader :company="company" title="PURCHASE ORDER" :doc-date="order.date" number-label="No. PO" :number="order.number" />

			<div class="mb-3 mt-4 flex gap-4">
				<dl class="grid w-1/2 grid-cols-[22mm_2mm_1fr] content-start gap-y-0.5">
					<dt>No. PR</dt>
					<dd>:</dd>
					<dd>-</dd>
					<dt>Perusahaan</dt>
					<dd>:</dd>
					<dd>{{ order.supplier_name }}</dd>
					<dt>Nama</dt>
					<dd>:</dd>
					<dd>{{ order.supplier_contact_person || order.supplier_name }}</dd>
					<dt>Alamat</dt>
					<dd>:</dd>
					<dd>{{ order.address }}</dd>
					<dt>No Telp</dt>
					<dd>:</dd>
					<dd>{{ order.supplier_phone }}</dd>
				</dl>
				<div class="w-1/2">
					<p class="text-[16px] font-bold leading-tight">PENGIRIMAN</p>
					<dl class="grid grid-cols-[22mm_2mm_1fr] gap-y-0.5">
						<dt>Nama</dt>
						<dd>:</dd>
						<dd>{{ company.short_name }}</dd>
						<dt>Perusahaan</dt>
						<dd>:</dd>
						<dd>{{ company.legal_name }}</dd>
						<dt>Alamat</dt>
						<dd>:</dd>
						<dd>{{ company.address }}</dd>
						<dt>No. Telp</dt>
						<dd>:</dd>
						<dd></dd>
					</dl>
				</div>
			</div>

			<table class="w-full border-collapse">
				<thead>
					<tr>
						<th :class="[th, 'w-[4%]']">No</th>
						<th :class="th">Description</th>
						<th :class="[th, 'w-[14%]']">Kode Barang</th>
						<th :class="[th, 'w-[9%]']">Qty</th>
						<th :class="[th, 'w-[16%]']">Unit Price</th>
						<th :class="[th, 'w-[16%]']">Total</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(line, index) in order.lines" :key="index">
						<td :class="[td, 'text-center']">{{ index + 1 }}</td>
						<td :class="td">{{ line.product_name }}</td>
						<td :class="[td, 'text-center']">{{ line.product_code }}</td>
						<td :class="[td, 'text-right']">{{ line.quantity }}</td>
						<td :class="[td, 'text-right']">{{ amount(line.dpp / line.quantity) }}</td>
						<td :class="[td, 'text-right']">{{ amount(line.dpp) }}</td>
					</tr>
					<tr v-for="n in Math.max(MIN_ROWS - order.lines.length, 0)" :key="`empty-${n}`">
						<td v-for="c in 6" :key="c" :class="td">&nbsp;</td>
					</tr>
				</tbody>
			</table>

			<div class="mt-2.5 flex items-start justify-between">
				<div class="w-1/2">
					<span class="inline-block bg-[#0b6b5a] px-1 py-0.5 text-white">Catatan atau Instruksi Khusus</span>
					<div class="h-[72px] whitespace-pre-line border border-black p-1">{{ order.description }}</div>
				</div>
				<table class="w-[42%] border-collapse">
					<tbody>
						<tr>
							<td :class="[td, 'font-bold']">SUB TOTAL</td>
							<td :class="[td, 'text-right']">{{ amount(order.dpp) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'font-bold']">PPN</td>
							<td :class="[td, 'text-right']">{{ amount(order.ppn) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'font-bold']">BIAYA KIRIM</td>
							<td :class="[td, 'text-right']">0</td>
						</tr>
						<tr>
							<td :class="[td, 'font-bold']">LAINNYA</td>
							<td :class="[td, 'text-right']">0</td>
						</tr>
						<tr>
							<td :class="[td, 'bg-[#0b6b5a] font-bold text-white']">TOTAL</td>
							<td :class="[td, 'bg-[#0b6b5a] text-right font-bold text-white']">{{ amount(order.total) }}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="ml-auto mt-9 w-[40%] text-center">
				<p>Hormat Kami,</p>
				<p>{{ company.legal_name }}</p>
				<p class="mt-[18mm] font-bold underline">{{ order.approved_by ?? order.created_by }}</p>
			</div>
		</PrintPaper>
	</PrintLayout>
</template>
