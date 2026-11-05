<script setup lang="ts">
// Print view of one supplier payable with its payment history (A4 portrait) — same frame as the invoice / PO printouts.
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { usePrintCompany } from '@/composables/usePrintCompany'
import { date } from '@/utils/format'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintPaper from '@/components/print/PrintPaper.vue'
import PrintDocHeader from '@/components/print/PrintDocHeader.vue'
import { printTd as td, printTh as th } from '@/components/print/styles'
import { payableStatusLabel } from '@/views/supplier-payable/schema'
import type { SupplierPayable, SupplierPayablePayment } from '@/utils/types'

const MIN_ROWS = 6
const route = useRoute()
const row = ref<SupplierPayable>()
const { company, load: loadCompany } = usePrintCompany()
const loading = ref(true)
const notFound = ref(false)
// Print figures follow the other purchasing printouts: comma thousands, up to 2 decimals.
const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const amount = (value: number) => amountFormat.format(value)
const reference = (payment: SupplierPayablePayment) =>
	payment.purchase_return_number ?? payment.supplier_advance_number ?? payment.bank_account_name ?? '-'

onMounted(async () => {
	try {
		const [res] = await Promise.all([api.get<{ data: SupplierPayable }>(`/supplier-payable/${route.params.id}`), loadCompany()])
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
		not-found-title="Hutang supplier tidak ditemukan"
		:doc-number="row?.number"
		portrait
	>
		<PrintPaper v-if="row && company">
			<PrintDocHeader :company="company" title="HUTANG SUPPLIER" :doc-date="row.date" number-label="No. Hutang" :number="row.number" />

			<div class="mb-3 mt-4 flex gap-4">
				<dl class="grid w-1/2 grid-cols-[34mm_2mm_1fr] content-start gap-y-0.5">
					<dt>Supplier</dt>
					<dd>:</dd>
					<dd>{{ row.supplier_code }} {{ row.supplier_name }}</dd>
					<dt>No. Invoice</dt>
					<dd>:</dd>
					<dd>{{ row.purchase_invoice_number }}</dd>
					<dt>Invoice Supplier</dt>
					<dd>:</dd>
					<dd>{{ row.supplier_invoice_number }}</dd>
				</dl>
				<div class="w-1/2">
					<p class="text-[16px] font-bold leading-tight">{{ payableStatusLabel[row.status].toUpperCase() }}</p>
					<dl class="grid grid-cols-[34mm_2mm_1fr] gap-y-0.5">
						<dt>Departemen</dt>
						<dd>:</dd>
						<dd>{{ row.department_code }} — {{ row.department_name }}</dd>
						<dt>Jatuh Tempo</dt>
						<dd>:</dd>
						<dd>{{ date(row.due_date, 'DD/MM/YYYY') }} (TOP {{ row.top_days }} hari)</dd>
						<dt>Keterangan</dt>
						<dd>:</dd>
						<dd>{{ row.description || '-' }}</dd>
					</dl>
				</div>
			</div>

			<table class="w-full border-collapse">
				<thead>
					<tr>
						<th :class="[th, 'w-[4%]']">No</th>
						<th :class="[th, 'w-[12%]']">Tanggal</th>
						<th :class="[th, 'w-[22%]']">No. Pembayaran</th>
						<th :class="[th, 'w-[16%]']">Tipe</th>
						<th :class="th">Referensi</th>
						<th :class="[th, 'w-[16%]']">Nominal</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(payment, index) in row.payments" :key="payment.id">
						<td :class="[td, 'text-center']">{{ index + 1 }}</td>
						<td :class="[td, 'text-center']">{{ date(payment.date, 'DD/MM/YYYY') }}</td>
						<td :class="td">{{ payment.number }}</td>
						<td :class="td">{{ payment.payment_type_name }}</td>
						<td :class="td">{{ reference(payment) }}</td>
						<td :class="[td, 'text-right']">{{ amount(payment.amount) }}</td>
					</tr>
					<tr v-for="n in Math.max(MIN_ROWS - row.payments.length, 0)" :key="`empty-${n}`">
						<td v-for="c in 6" :key="c" :class="td">&nbsp;</td>
					</tr>
				</tbody>
			</table>

			<div class="mt-2.5 flex justify-end">
				<table class="w-[42%] border-collapse">
					<tbody>
						<tr>
							<td :class="[td, 'font-bold']">TOTAL HUTANG</td>
							<td :class="[td, 'text-right']">{{ amount(row.total) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'font-bold']">TERBAYAR</td>
							<td :class="[td, 'text-right']">{{ amount(row.paid_total) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'bg-[#0b6b5a] font-bold text-white']">SISA HUTANG</td>
							<td :class="[td, 'bg-[#0b6b5a] text-right font-bold text-white']">{{ amount(row.remaining_total) }}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="mt-9 flex justify-between text-center">
				<div class="w-[40%]">
					<p>Dibuat Oleh,</p>
					<p class="mx-auto mt-[18mm] w-32 border-t border-black pt-0.5 font-bold">&nbsp;</p>
				</div>
				<div class="w-[40%]">
					<p>Disetujui,</p>
					<p class="mx-auto mt-[18mm] w-32 border-t border-black pt-0.5 font-bold">&nbsp;</p>
				</div>
			</div>
		</PrintPaper>
	</PrintLayout>
</template>
