<script setup lang="ts">
// Print view of one customer receivable with its payment history (A4 portrait) — same frame as the Hutang Supplier printout.
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { usePrintCompany } from '@/composables/usePrintCompany'
import { date } from '@/utils/format'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintPaper from '@/components/print/PrintPaper.vue'
import PrintDocHeader from '@/components/print/PrintDocHeader.vue'
import { printTd as td, printTh as th } from '@/components/print/styles'
import { receivableStatusLabel } from '@/views/customer-receivable/schema'
import type { CustomerReceivable, CustomerReceivablePayment } from '@/utils/types'

const MIN_ROWS = 6
const route = useRoute()
const row = ref<CustomerReceivable>()
const { company, load: loadCompany } = usePrintCompany()
const loading = ref(true)
const notFound = ref(false)
// Print figures follow the other printouts: comma thousands, up to 2 decimals.
const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const amount = (value: number) => amountFormat.format(value)
const reference = (payment: CustomerReceivablePayment) =>
	payment.return_number ?? payment.deposit_number ?? payment.bank_account_name ?? payment.sales_expense_name ?? (payment.reference || '-')

onMounted(async () => {
	try {
		const [res] = await Promise.all([api.get<{ data: CustomerReceivable }>(`/customer-receivable/${route.params.id}`), loadCompany()])
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
		not-found-title="Piutang customer tidak ditemukan"
		:doc-number="row?.number"
		portrait
	>
		<PrintPaper v-if="row && company">
			<PrintDocHeader :company="company" title="PIUTANG CUSTOMER" :doc-date="row.date" number-label="No. Invoice" :number="row.number" />

			<div class="mb-3 mt-4 flex gap-4">
				<dl class="grid w-1/2 grid-cols-[34mm_2mm_1fr] content-start gap-y-0.5">
					<dt>Customer</dt>
					<dd>:</dd>
					<dd>{{ row.customer_code }} {{ row.customer_name }}</dd>
					<dt>Departemen</dt>
					<dd>:</dd>
					<dd>{{ row.department_code }} — {{ row.department_name }}</dd>
				</dl>
				<div class="w-1/2">
					<p class="text-[16px] font-bold leading-tight">{{ receivableStatusLabel[row.status].toUpperCase() }}</p>
					<dl class="grid grid-cols-[34mm_2mm_1fr] gap-y-0.5">
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
						<td :class="td">{{ payment.number ?? '-' }}</td>
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
							<td :class="[td, 'font-bold']">TOTAL PIUTANG</td>
							<td :class="[td, 'text-right']">{{ amount(row.total) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'font-bold']">TERBAYAR</td>
							<td :class="[td, 'text-right']">{{ amount(row.paid_total) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'bg-[#0b6b5a] font-bold text-white']">SISA PIUTANG</td>
							<td :class="[td, 'bg-[#0b6b5a] text-right font-bold text-white']">{{ amount(row.outstanding) }}</td>
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
