<script setup lang="ts">
// Print view of one sales invoice (legacy "INVOICE" sheet, A4 portrait). Pending invoices carry a DRAFT watermark.
// "Total Pembayaran" is what was actually paid (`paid_total`) — never the invoice total.
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { date } from '@/utils/format'
import { usePrintCompany } from '@/composables/usePrintCompany'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintPaper from '@/components/print/PrintPaper.vue'
import PrintDocHeader from '@/components/print/PrintDocHeader.vue'
import { printTd as td, printTh as th } from '@/components/print/styles'
import type { SalesInvoice } from '@/utils/types'

const MIN_ROWS = 8
const route = useRoute()
const invoice = ref<SalesInvoice>()
const { company, load: loadCompany } = usePrintCompany()
const loading = ref(true)
const notFound = ref(false)
// Print figures follow the other printouts: comma thousands, up to 2 decimals.
const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const amount = (value: number) => amountFormat.format(value)

onMounted(async () => {
	try {
		const [res] = await Promise.all([api.get<{ data: SalesInvoice }>(`/sales-invoice/${route.params.id}`), loadCompany()])
		invoice.value = res.data.data
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
		:not-found="notFound || !invoice || !company"
		not-found-title="Invoice penjualan tidak ditemukan"
		:doc-number="invoice?.number"
		portrait
	>
		<PrintPaper v-if="invoice && company" :watermark="invoice.approval_status === 'pending' ? 'Draft' : undefined">
			<PrintDocHeader :company="company" title="INVOICE" :doc-date="invoice.date" number-label="No. Invoice" :number="invoice.number" />

			<div class="mb-3 mt-4 flex gap-4">
				<dl class="grid w-1/2 grid-cols-[24mm_2mm_1fr] content-start gap-y-0.5">
					<dt>Customer</dt>
					<dd>:</dd>
					<dd class="font-bold">{{ invoice.customer_name }}</dd>
					<dt>Alamat</dt>
					<dd>:</dd>
					<dd>{{ invoice.customer_address || '-' }}</dd>
					<dt>No. Telp</dt>
					<dd>:</dd>
					<dd>{{ invoice.customer_phone || '-' }}</dd>
					<dt>No. SO</dt>
					<dd>:</dd>
					<dd>{{ invoice.sales_order_number ?? '-' }}</dd>
				</dl>
				<dl class="grid w-1/2 grid-cols-[34mm_2mm_1fr] content-start gap-y-0.5">
					<dt>Sales</dt>
					<dd>:</dd>
					<dd>{{ invoice.sales_name }}</dd>
					<dt>Departemen</dt>
					<dd>:</dd>
					<dd>{{ invoice.department_name }}</dd>
					<dt>Termin Pembayaran</dt>
					<dd>:</dd>
					<dd>{{ invoice.top_days === 0 ? 'Tunai' : `${invoice.top_days} hari` }}</dd>
					<dt>Jatuh Tempo</dt>
					<dd>:</dd>
					<dd>{{ date(invoice.due_date, 'DD MMMM YYYY') }}</dd>
					<dt>Faktur Pajak</dt>
					<dd>:</dd>
					<dd>
						<template v-if="invoice.tax_invoice">{{ invoice.tax_invoice.number }} ({{ date(invoice.tax_invoice.date, 'DD/MM/YYYY') }})</template>
						<template v-else>{{ invoice.pkp_active ? '-' : 'Non-PKP' }}</template>
					</dd>
				</dl>
			</div>

			<table class="w-full border-collapse">
				<thead>
					<tr>
						<th :class="[th, 'w-[4%]']">No</th>
						<th :class="th">Description</th>
						<th :class="[th, 'w-[13%]']">Kode Barang</th>
						<th :class="[th, 'w-[8%]']">Qty</th>
						<th :class="[th, 'w-[14%]']">Harga</th>
						<th :class="[th, 'w-[12%]']">Diskon</th>
						<th :class="[th, 'w-[15%]']">Total</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(line, index) in invoice.lines" :key="index">
						<td :class="[td, 'text-center']">{{ index + 1 }}</td>
						<td :class="td">
							{{ line.product_name }}<span v-if="line.notes" class="block text-[10px] leading-tight">{{ line.notes }}</span>
						</td>
						<td :class="[td, 'text-center']">{{ line.product_code }}</td>
						<td :class="[td, 'text-right']">{{ line.quantity }}</td>
						<td :class="[td, 'text-right']">{{ amount(line.price) }}</td>
						<td :class="[td, 'text-right']">{{ amount(line.discount) }}</td>
						<td :class="[td, 'text-right']">{{ amount(line.total) }}</td>
					</tr>
					<tr v-for="n in Math.max(MIN_ROWS - invoice.lines.length, 0)" :key="`empty-${n}`">
						<td v-for="c in 7" :key="c" :class="td">&nbsp;</td>
					</tr>
				</tbody>
			</table>

			<div class="mt-2.5 flex items-start justify-between">
				<div class="w-1/2">
					<span class="inline-block bg-[#0b6b5a] px-1 py-0.5 text-white">Catatan atau Instruksi Khusus</span>
					<div class="h-[72px] whitespace-pre-line border border-black p-1">{{ invoice.description }}</div>
				</div>
				<table class="w-[42%] border-collapse">
					<tbody>
						<tr>
							<td :class="[td, 'font-bold']">SUB TOTAL</td>
							<td :class="[td, 'text-right']">{{ amount(invoice.subtotal) }}</td>
						</tr>
						<tr v-if="invoice.discount_global > 0">
							<td :class="[td, 'font-bold']">DISKON GLOBAL</td>
							<td :class="[td, 'text-right']">({{ amount(invoice.discount_global) }})</td>
						</tr>
						<template v-if="invoice.pkp_active">
							<tr>
								<td :class="[td, 'font-bold']">DPP</td>
								<td :class="[td, 'text-right']">{{ amount(invoice.dpp) }}</td>
							</tr>
							<tr>
								<td :class="[td, 'font-bold']">PPN 11%</td>
								<td :class="[td, 'text-right']">{{ amount(invoice.ppn) }}</td>
							</tr>
						</template>
						<tr v-if="invoice.expense_total > 0">
							<td :class="[td, 'font-bold']">BIAYA PENJUALAN</td>
							<td :class="[td, 'text-right']">{{ amount(invoice.expense_total) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'bg-[#0b6b5a] font-bold text-white']">GRAND TOTAL</td>
							<td :class="[td, 'bg-[#0b6b5a] text-right font-bold text-white']">{{ amount(invoice.total) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'font-bold']">TOTAL PEMBAYARAN</td>
							<td :class="[td, 'text-right']">{{ amount(invoice.paid_total) }}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div v-if="invoice.expenses.length" class="mt-2 text-[11px]">
				<p class="font-bold">Rincian Biaya Penjualan</p>
				<p v-for="(expense, index) in invoice.expenses" :key="index">
					{{ expense.sales_expense_name }}<template v-if="expense.notes"> ({{ expense.notes }})</template>: {{ amount(expense.amount) }}
				</p>
			</div>

			<div class="ml-auto mt-9 w-[40%] text-center">
				<p>Hormat Kami,</p>
				<p>{{ company.legal_name }}</p>
				<p class="mt-[18mm] font-bold underline">{{ invoice.approved_by ?? invoice.created_by }}</p>
			</div>
		</PrintPaper>
	</PrintLayout>
</template>
