<script setup lang="ts">
// Print view of one sales return (A4 portrait) — same frame as the invoice / PO printouts. Not yet approved = DRAFT watermark.
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { usePrintCompany } from '@/composables/usePrintCompany'
import { date } from '@/utils/format'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintPaper from '@/components/print/PrintPaper.vue'
import PrintDocHeader from '@/components/print/PrintDocHeader.vue'
import { printTd as td, printTh as th } from '@/components/print/styles'
import type { SalesReturn } from '@/utils/types'

const MIN_ROWS = 8
const route = useRoute()
const row = ref<SalesReturn>()
const { company, load: loadCompany } = usePrintCompany()
const loading = ref(true)
const notFound = ref(false)
// Print figures follow the other printouts: comma thousands, up to 2 decimals.
const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const amount = (value: number) => amountFormat.format(value)

onMounted(async () => {
	try {
		const [res] = await Promise.all([api.get<{ data: SalesReturn }>(`/sales-return/${route.params.id}`), loadCompany()])
		row.value = res.data.data
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
		:not-found="notFound || !row || !company"
		not-found-title="Retur penjualan tidak ditemukan"
		:doc-number="row?.number"
		portrait
	>
		<PrintPaper v-if="row && company" :watermark="row.approval_status === 'approved' ? undefined : 'Draft'">
			<PrintDocHeader :company="company" title="RETUR PENJUALAN" :doc-date="row.date" number-label="No. Retur" :number="row.number" />

			<div class="mb-3 mt-4 flex gap-4">
				<dl class="grid w-1/2 grid-cols-[34mm_2mm_1fr] content-start gap-y-0.5">
					<dt>Customer</dt>
					<dd>:</dd>
					<dd>{{ row.customer_code }} {{ row.customer_name }}</dd>
					<dt>No. Invoice</dt>
					<dd>:</dd>
					<dd>{{ row.sales_invoice_number }}</dd>
					<dt>Gudang Penerima</dt>
					<dd>:</dd>
					<dd>{{ row.warehouse_code }} — {{ row.warehouse_name }}</dd>
				</dl>
				<div class="w-1/2">
					<p class="text-[16px] font-bold leading-tight">RETUR</p>
					<dl class="grid grid-cols-[34mm_2mm_1fr] gap-y-0.5">
						<dt>Departemen</dt>
						<dd>:</dd>
						<dd>{{ row.department_code }} — {{ row.department_name }}</dd>
						<dt>Faktur Pajak</dt>
						<dd>:</dd>
						<dd>
							<template v-if="row.tax_invoice">{{ row.tax_invoice.number }} ({{ date(row.tax_invoice.date, 'DD/MM/YYYY') }})</template>
							<template v-else>{{ row.pkp_active ? '-' : 'Non-PKP' }}</template>
						</dd>
						<dt>Dibuat Oleh</dt>
						<dd>:</dd>
						<dd>{{ row.created_by }}</dd>
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
						<th :class="[th, 'w-[8%]']">Qty Retur</th>
						<th :class="[th, 'w-[14%]']">Unit Price</th>
						<th :class="[th, 'w-[11%]']">Diskon</th>
						<th :class="[th, 'w-[14%]']">DPP</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(line, index) in row.lines" :key="line.product_id">
						<td :class="[td, 'text-center']">{{ index + 1 }}</td>
						<td :class="td">{{ line.product_name }}</td>
						<td :class="[td, 'text-center']">{{ line.product_code }}</td>
						<td :class="[td, 'text-center']">{{ line.unit_name }}</td>
						<td :class="[td, 'text-right']">{{ line.quantity }}</td>
						<td :class="[td, 'text-right']">{{ amount(line.price) }}</td>
						<td :class="[td, 'text-right']">{{ amount(line.discount) }}</td>
						<td :class="[td, 'text-right']">{{ amount(line.dpp) }}</td>
					</tr>
					<tr v-for="n in Math.max(MIN_ROWS - row.lines.length, 0)" :key="`empty-${n}`">
						<td v-for="c in 8" :key="c" :class="td">&nbsp;</td>
					</tr>
				</tbody>
			</table>

			<div class="mt-2.5 flex items-start justify-between">
				<div class="w-1/2">
					<span class="inline-block bg-[#0b6b5a] px-1 py-0.5 text-white">Alasan Retur</span>
					<div class="h-[72px] whitespace-pre-line border border-black p-1">{{ row.reason }}</div>
				</div>
				<table class="w-[42%] border-collapse">
					<tbody>
						<tr>
							<td :class="[td, 'font-bold']">SUB TOTAL</td>
							<td :class="[td, 'text-right']">{{ amount(row.dpp) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'font-bold']">PPN</td>
							<td :class="[td, 'text-right']">{{ amount(row.ppn) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'bg-[#0b6b5a] font-bold text-white']">TOTAL</td>
							<td :class="[td, 'bg-[#0b6b5a] text-right font-bold text-white']">{{ amount(row.total) }}</td>
						</tr>
						<tr v-if="row.approval_status === 'approved'">
							<td :class="td">Dipakai Potong Piutang</td>
							<td :class="[td, 'text-right']">{{ amount(row.used_total) }}</td>
						</tr>
						<tr v-if="row.approval_status === 'approved'">
							<td :class="td">Dikembalikan ke Customer</td>
							<td :class="[td, 'text-right']">{{ amount(row.refunded_total) }}</td>
						</tr>
						<tr v-if="row.approval_status === 'approved'">
							<td :class="[td, 'font-bold']">SISA RETUR</td>
							<td :class="[td, 'text-right font-bold']">{{ amount(row.remaining_total) }}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="mt-9 flex justify-between text-center">
				<div class="w-[40%]">
					<p>Dibuat Oleh,</p>
					<p class="mt-[18mm] font-bold underline">{{ row.created_by }}</p>
				</div>
				<div class="w-[40%]">
					<p>Disetujui,</p>
					<p v-if="row.approved_by" class="mt-[18mm] font-bold underline">{{ row.approved_by }}</p>
					<p v-else class="mx-auto mt-[18mm] w-32 border-t border-black pt-0.5 font-bold">&nbsp;</p>
				</div>
			</div>
		</PrintPaper>
	</PrintLayout>
</template>
