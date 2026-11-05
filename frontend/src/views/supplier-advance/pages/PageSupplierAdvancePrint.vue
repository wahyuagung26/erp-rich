<script setup lang="ts">
// Print view of one supplier advance (A4 portrait) — same frame as the PO / receipt printouts.
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { usePrintCompany } from '@/composables/usePrintCompany'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintPaper from '@/components/print/PrintPaper.vue'
import PrintDocHeader from '@/components/print/PrintDocHeader.vue'
import { printTd as td } from '@/components/print/styles'
import type { SupplierAdvance } from '@/utils/types'

const route = useRoute()
const advance = ref<SupplierAdvance>()
const { company, load: loadCompany } = usePrintCompany()
const loading = ref(true)
const notFound = ref(false)
// Print figures follow the other purchasing printouts: comma thousands, up to 2 decimals.
const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const amount = (value: number) => amountFormat.format(value)

onMounted(async () => {
	try {
		const [res] = await Promise.all([api.get<{ data: SupplierAdvance }>(`/supplier-advance/${route.params.id}`), loadCompany()])
		advance.value = res.data.data
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
		:not-found="notFound || !advance || !company"
		not-found-title="Uang muka supplier tidak ditemukan"
		:doc-number="advance?.number"
		portrait
	>
		<PrintPaper v-if="advance && company">
			<PrintDocHeader :company="company" title="UANG MUKA SUPPLIER" :doc-date="advance.date" number-label="No. Dokumen" :number="advance.number" />

			<div class="mb-4 mt-4 flex gap-4">
				<dl class="grid w-1/2 grid-cols-[30mm_2mm_1fr] content-start gap-y-0.5">
					<dt>Supplier</dt>
					<dd>:</dd>
					<dd>{{ advance.supplier_code }} {{ advance.supplier_name }}</dd>
					<dt>Departemen</dt>
					<dd>:</dd>
					<dd>{{ advance.department_code }} — {{ advance.department_name }}</dd>
					<dt>Jenis Uang Muka</dt>
					<dd>:</dd>
					<dd>{{ advance.advance_type }}</dd>
				</dl>
				<dl class="grid w-1/2 grid-cols-[30mm_2mm_1fr] content-start gap-y-0.5">
					<dt>Akun Kas / Bank</dt>
					<dd>:</dd>
					<dd>{{ advance.cash_account_code }} {{ advance.cash_account_name }}</dd>
					<dt>Arus Kas</dt>
					<dd>:</dd>
					<dd>{{ advance.cash_flow_name ?? advance.cash_flow ?? '-' }}</dd>
					<dt>Hutang Terakhir</dt>
					<dd>:</dd>
					<dd>{{ advance.last_payable_number ?? '-' }}</dd>
				</dl>
			</div>

			<div class="flex items-start justify-between">
				<div class="w-1/2">
					<span class="inline-block bg-[#0b6b5a] px-1 py-0.5 text-white">Keterangan</span>
					<div class="h-[72px] whitespace-pre-line border border-black p-1">{{ advance.description }}</div>
				</div>
				<table class="w-[42%] border-collapse">
					<tbody>
						<tr>
							<td :class="[td, 'font-bold']">NOMINAL</td>
							<td :class="[td, 'text-right']">{{ amount(advance.amount) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'font-bold']">TERPAKAI</td>
							<td :class="[td, 'text-right']">{{ amount(advance.used) }}</td>
						</tr>
						<tr>
							<td :class="[td, 'bg-[#0b6b5a] font-bold text-white']">SALDO TERSEDIA</td>
							<td :class="[td, 'bg-[#0b6b5a] text-right font-bold text-white']">{{ amount(advance.remaining) }}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="mt-9 flex justify-between text-center">
				<div class="w-[40%]">
					<p>Diterima,</p>
					<p class="mx-auto mt-[18mm] w-32 border-t border-black pt-0.5 font-bold">Supplier</p>
				</div>
				<div class="w-[40%]">
					<p>Hormat Kami,</p>
					<p>{{ company.legal_name }}</p>
					<p class="mx-auto mt-[14mm] w-32 border-t border-black pt-0.5 font-bold">Keuangan</p>
				</div>
			</div>
		</PrintPaper>
	</PrintLayout>
</template>
