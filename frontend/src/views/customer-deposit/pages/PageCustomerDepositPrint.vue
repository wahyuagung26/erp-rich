<script setup lang="ts">
// Print view of one customer deposit receipt (bukti titipan, A4 portrait) — same frame as the supplier-advance printout.
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { usePrintCompany } from '@/composables/usePrintCompany'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintPaper from '@/components/print/PrintPaper.vue'
import PrintDocHeader from '@/components/print/PrintDocHeader.vue'
import { printTd as td } from '@/components/print/styles'
import type { CustomerDeposit } from '@/utils/types'

const route = useRoute()
const deposit = ref<CustomerDeposit>()
const { company, load: loadCompany } = usePrintCompany()
const loading = ref(true)
const notFound = ref(false)
// Print figures follow the other printouts: comma thousands, up to 2 decimals.
const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const amount = (value: number) => amountFormat.format(value)

onMounted(async () => {
	try {
		const [res] = await Promise.all([api.get<{ data: CustomerDeposit }>(`/customer-deposit/${route.params.id}`), loadCompany()])
		deposit.value = res.data.data
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
		:not-found="notFound || !deposit || !company"
		not-found-title="Titipan customer tidak ditemukan"
		:doc-number="deposit?.number"
		portrait
	>
		<PrintPaper v-if="deposit && company">
			<PrintDocHeader :company="company" title="BUKTI TITIPAN" :doc-date="deposit.date" number-label="No. Dokumen" :number="deposit.number" />

			<div class="mb-4 mt-4 flex gap-4">
				<dl class="grid w-1/2 grid-cols-[30mm_2mm_1fr] content-start gap-y-0.5">
					<dt>Diterima dari</dt>
					<dd>:</dd>
					<dd>{{ deposit.customer_code }} {{ deposit.customer_name }}</dd>
					<dt>Departemen</dt>
					<dd>:</dd>
					<dd>{{ deposit.department_code }} — {{ deposit.department_name }}</dd>
				</dl>
				<dl class="grid w-1/2 grid-cols-[30mm_2mm_1fr] content-start gap-y-0.5">
					<dt>Akun Kas / Bank</dt>
					<dd>:</dd>
					<dd>{{ deposit.cash_account_code }} {{ deposit.cash_account_name }}</dd>
					<dt>Arus Kas</dt>
					<dd>:</dd>
					<dd>{{ deposit.cash_flow_name ?? deposit.cash_flow ?? '-' }}</dd>
					<dt>Invoice Terakhir</dt>
					<dd>:</dd>
					<dd>{{ deposit.last_invoice_number ?? '-' }}</dd>
				</dl>
			</div>

			<div class="flex items-start justify-between">
				<div class="w-1/2">
					<span class="inline-block bg-[#0b6b5a] px-1 py-0.5 text-white">Keterangan</span>
					<div class="h-[72px] whitespace-pre-line border border-black p-1">{{ deposit.description }}</div>
				</div>
				<table class="w-[42%] border-collapse">
					<tbody>
						<tr>
							<td :class="[td, 'font-bold']">NOMINAL</td>
							<td :class="[td, 'text-right']">{{ amount(deposit.amount) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'font-bold']">TERPAKAI</td>
							<td :class="[td, 'text-right']">{{ amount(deposit.used) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'bg-[#0b6b5a] font-bold text-white']">SISA</td>
							<td :class="[td, 'bg-[#0b6b5a] text-right font-bold text-white']">{{ amount(deposit.remaining) }}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="mt-9 flex justify-between text-center">
				<div class="w-[40%]">
					<p>Penyetor,</p>
					<p class="mx-auto mt-[18mm] w-32 border-t border-black pt-0.5 font-bold">Customer</p>
				</div>
				<div class="w-[40%]">
					<p>Penerima,</p>
					<p>{{ company.legal_name }}</p>
					<p class="mx-auto mt-[14mm] w-32 border-t border-black pt-0.5 font-bold">Keuangan</p>
				</div>
			</div>
		</PrintPaper>
	</PrintLayout>
</template>
