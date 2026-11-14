<script setup lang="ts">
// Print view of one surat jalan (A4 portrait). No prices — item, qty, satuan and the sender / receiver signature blocks.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { usePrintCompany } from '@/composables/usePrintCompany'
import { date } from '@/utils/format'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintPaper from '@/components/print/PrintPaper.vue'
import PrintDocHeader from '@/components/print/PrintDocHeader.vue'
import { printTd as td, printTh as th } from '@/components/print/styles'
import type { DeliveryNote } from '@/utils/types'

const MIN_ROWS = 8
const route = useRoute()
const note = ref<DeliveryNote>()
const { company, load: loadCompany } = usePrintCompany()
const loading = ref(true)
const notFound = ref(false)
// Only what this surat jalan actually ships; untouched invoice lines stay off the paper.
const lines = computed(() => note.value?.lines.filter((line) => line.quantity > 0) ?? [])
const totalQuantity = computed(() => lines.value.reduce((sum, line) => sum + line.quantity, 0))

onMounted(async () => {
	try {
		const [res] = await Promise.all([api.get<{ data: DeliveryNote }>(`/delivery-note/${route.params.id}`), loadCompany()])
		note.value = res.data.data
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
		:not-found="notFound || !note || !company"
		not-found-title="Surat jalan tidak ditemukan"
		:doc-number="note?.number"
		portrait
	>
		<PrintPaper v-if="note && company">
			<PrintDocHeader :company="company" title="SURAT JALAN" :doc-date="note.date" number-label="No. Surat Jalan" :number="note.number" />

			<div class="mb-3 mt-4 flex gap-4">
				<dl class="grid w-1/2 grid-cols-[28mm_2mm_1fr] content-start gap-y-0.5">
					<dt>Kepada</dt>
					<dd>:</dd>
					<dd class="font-bold">{{ note.customer_name }}</dd>
					<dt>Alamat Kirim</dt>
					<dd>:</dd>
					<dd class="whitespace-pre-line">{{ note.delivery_address }}</dd>
					<dt>Penerima</dt>
					<dd>:</dd>
					<dd>{{ note.recipient || '-' }}</dd>
				</dl>
				<dl class="grid w-1/2 grid-cols-[28mm_2mm_1fr] content-start gap-y-0.5">
					<dt>No. Invoice</dt>
					<dd>:</dd>
					<dd>{{ note.sales_invoice_number }}</dd>
					<dt>Tanggal Invoice</dt>
					<dd>:</dd>
					<dd>{{ note.sales_invoice_date ? date(note.sales_invoice_date, 'DD/MM/YYYY') : '-' }}</dd>
					<dt>Driver</dt>
					<dd>:</dd>
					<dd>{{ note.driver || '-' }}</dd>
					<dt>No. Kendaraan</dt>
					<dd>:</dd>
					<dd>{{ note.vehicle || '-' }}</dd>
				</dl>
			</div>

			<table class="w-full border-collapse">
				<thead>
					<tr>
						<th :class="[th, 'w-[5%]']">No</th>
						<th :class="th">Nama Barang</th>
						<th :class="[th, 'w-[16%]']">SKU</th>
						<th :class="[th, 'w-[12%]']">Qty</th>
						<th :class="[th, 'w-[14%]']">Satuan</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(line, index) in lines" :key="line.variant_id">
						<td :class="[td, 'text-center']">{{ index + 1 }}</td>
						<td :class="td">{{ line.product_name }}</td>
						<td :class="[td, 'text-center']">{{ line.sku }}</td>
						<td :class="[td, 'text-right font-bold']">{{ line.quantity }}</td>
						<td :class="[td, 'text-center']">{{ line.unit_name }}</td>
					</tr>
					<tr v-for="n in Math.max(MIN_ROWS - lines.length, 0)" :key="`empty-${n}`">
						<td v-for="c in 5" :key="c" :class="td">&nbsp;</td>
					</tr>
				</tbody>
			</table>

			<div class="mt-2.5 flex items-start justify-between">
				<div class="w-1/2">
					<span class="inline-block bg-[#0b6b5a] px-1 py-0.5 text-white">Keterangan</span>
					<div class="h-[72px] whitespace-pre-line border border-black p-1">{{ note.description }}</div>
				</div>
				<table class="w-[42%] border-collapse">
					<tbody>
						<tr>
							<td :class="[td, 'bg-[#0b6b5a] font-bold text-white']">TOTAL QTY</td>
							<td :class="[td, 'bg-[#0b6b5a] text-right font-bold text-white']">{{ totalQuantity }}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="mt-9 flex justify-between text-center">
				<div class="w-[40%]">
					<p>Pengirim,</p>
					<p class="mx-auto mt-[18mm] w-40 border-t border-black pt-0.5 font-bold">{{ note.driver || '(.....................)' }}</p>
				</div>
				<div class="w-[40%]">
					<p>Penerima,</p>
					<p class="mx-auto mt-[18mm] w-40 border-t border-black pt-0.5 font-bold">{{ note.recipient || '(.....................)' }}</p>
				</div>
			</div>
		</PrintPaper>
	</PrintLayout>
</template>
