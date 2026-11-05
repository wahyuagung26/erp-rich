<script setup lang="ts">
// Print view of one purchase receipt (Legacy "Penerimaan Pembelian" sheet, A4 portrait) — same frame as the PO printout.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { usePrintCompany } from '@/composables/usePrintCompany'
import { date } from '@/utils/format'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintPaper from '@/components/print/PrintPaper.vue'
import PrintDocHeader from '@/components/print/PrintDocHeader.vue'
import { printTd as td, printTh as th } from '@/components/print/styles'
import type { PurchaseReceipt } from '@/utils/types'

const MIN_ROWS = 8
const route = useRoute()
const receipt = ref<PurchaseReceipt>()
const { company, load: loadCompany } = usePrintCompany()
const loading = ref(true)
const notFound = ref(false)
// Only what this receipt actually took in; untouched PO lines stay off the paper.
const lines = computed(() => receipt.value?.lines.filter((line) => line.quantity > 0) ?? [])
const totalOrdered = computed(() => lines.value.reduce((sum, line) => sum + line.ordered_quantity, 0))
const totalReceived = computed(() => lines.value.reduce((sum, line) => sum + line.quantity, 0))

onMounted(async () => {
	try {
		const [res] = await Promise.all([api.get<{ data: PurchaseReceipt }>(`/purchase-receipt/${route.params.id}`), loadCompany()])
		receipt.value = res.data.data
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
		:not-found="notFound || !receipt || !company"
		not-found-title="Penerimaan pembelian tidak ditemukan"
		:doc-number="receipt?.number"
		portrait
	>
		<PrintPaper v-if="receipt && company">
			<PrintDocHeader :company="company" title="PENERIMAAN PEMBELIAN" :doc-date="receipt.date" number-label="No. Dokumen" :number="receipt.number" />

			<div class="mb-3 mt-4 flex gap-4">
				<dl class="grid w-1/2 grid-cols-[34mm_2mm_1fr] content-start gap-y-0.5">
					<dt>No. PO</dt>
					<dd>:</dd>
					<dd>{{ receipt.purchase_order_number }}</dd>
					<dt>Tanggal PO</dt>
					<dd>:</dd>
					<dd>{{ receipt.purchase_order_date ? date(receipt.purchase_order_date, 'DD/MM/YYYY') : '-' }}</dd>
					<dt>Supplier</dt>
					<dd>:</dd>
					<dd>{{ receipt.supplier_code }} {{ receipt.supplier_name }}</dd>
					<dt>Surat Jalan Supplier</dt>
					<dd>:</dd>
					<dd>{{ receipt.delivery_note_number }}</dd>
				</dl>
				<div class="w-1/2">
					<p class="text-[16px] font-bold leading-tight">PENERIMAAN</p>
					<dl class="grid grid-cols-[34mm_2mm_1fr] gap-y-0.5">
						<dt>Departemen</dt>
						<dd>:</dd>
						<dd>{{ receipt.department_code }} — {{ receipt.department_name }}</dd>
						<dt>Perusahaan</dt>
						<dd>:</dd>
						<dd>{{ company.legal_name }}</dd>
						<dt>Dibuat Oleh</dt>
						<dd>:</dd>
						<dd>{{ receipt.created_by }}</dd>
					</dl>
				</div>
			</div>

			<table class="w-full border-collapse">
				<thead>
					<tr>
						<th :class="[th, 'w-[4%]']">No</th>
						<th :class="th">Description</th>
						<th :class="[th, 'w-[13%]']">Kode Barang</th>
						<th :class="[th, 'w-[9%]']">Satuan</th>
						<th :class="[th, 'w-[10%]']">Permintaan</th>
						<th :class="[th, 'w-[10%]']">Diterima</th>
						<th :class="[th, 'w-[17%]']">Gudang</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(line, index) in lines" :key="index">
						<td :class="[td, 'text-center']">{{ index + 1 }}</td>
						<td :class="td">{{ line.product_name }}</td>
						<td :class="[td, 'text-center']">{{ line.product_code }}</td>
						<td :class="[td, 'text-center']">{{ line.unit_name }}</td>
						<td :class="[td, 'text-right']">{{ line.ordered_quantity }}</td>
						<td :class="[td, 'text-right font-bold']">{{ line.quantity }}</td>
						<td :class="td">{{ line.warehouse_name }}</td>
					</tr>
					<tr v-for="n in Math.max(MIN_ROWS - lines.length, 0)" :key="`empty-${n}`">
						<td v-for="c in 7" :key="c" :class="td">&nbsp;</td>
					</tr>
				</tbody>
			</table>

			<div class="mt-2.5 flex items-start justify-between">
				<div class="w-1/2">
					<span class="inline-block bg-[#0b6b5a] px-1 py-0.5 text-white">Keterangan</span>
					<div class="h-[72px] whitespace-pre-line border border-black p-1">{{ receipt.description }}</div>
				</div>
				<table class="w-[42%] border-collapse">
					<tbody>
						<tr>
							<td :class="[td, 'font-bold']">TOTAL PERMINTAAN</td>
							<td :class="[td, 'text-right']">{{ totalOrdered }}</td>
						</tr>
						<tr>
							<td :class="[td, 'bg-[#0b6b5a] font-bold text-white']">TOTAL DITERIMA</td>
							<td :class="[td, 'bg-[#0b6b5a] text-right font-bold text-white']">{{ totalReceived }}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="mt-9 flex justify-between text-center">
				<div class="w-[40%]">
					<p>Diterima,</p>
					<p class="mx-auto mt-[18mm] w-32 border-t border-black pt-0.5 font-bold">Gudang</p>
				</div>
				<div class="w-[40%]">
					<p>Dibuat Oleh,</p>
					<p class="mt-[18mm] font-bold underline">{{ receipt.created_by }}</p>
				</div>
			</div>
		</PrintPaper>
	</PrintLayout>
</template>
