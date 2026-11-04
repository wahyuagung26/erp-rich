<script setup lang="ts">
// Print view of one settlement ("Dokumen Penyelesaian Uang Muka Operasional"): sheet 1 = the document,
// then one sheet per image attachment of the settlement (via PrintLayout).
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import { date, money } from '@/utils/format'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintSheet from '@/components/print/PrintSheet.vue'
import type { CashAdvance, CashAdvanceSettlement } from '@/utils/types'

const route = useRoute()
const advance = ref<CashAdvance>()
const settlement = ref<CashAdvanceSettlement>()
const loading = ref(true)
const notFound = ref(false)
const rp = (value: number) => `Rp. ${money(value)}`
// Zero cells print as a dash, like Legacy.
const cell = (value: number) => (value ? money(value) : '-')

const totalDebit = computed(() => settlement.value?.lines.reduce((sum, l) => sum + l.debit, 0) ?? 0)
const totalCredit = computed(() => settlement.value?.lines.reduce((sum, l) => sum + l.credit, 0) ?? 0)

onMounted(async () => {
	useCompanyStore()
		.load()
		.catch(() => undefined)
	try {
		const id = route.params.id
		const [adv, list] = await Promise.all([
			api.get<{ data: CashAdvance }>(`/cash-advance/${id}`),
			api.get<{ data: CashAdvanceSettlement[] }>(`/cash-advance/${id}/settlement`)
		])
		advance.value = adv.data.data
		settlement.value = list.data.data.find((row) => row.id === Number(route.params.settlementId))
		if (!settlement.value) notFound.value = true
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
		:not-found="notFound || !advance || !settlement"
		not-found-title="Penyelesaian uang muka tidak ditemukan"
		:doc-number="settlement?.number"
		:attachments="settlement?.attachments"
	>
		<PrintSheet
			v-if="advance && settlement"
			title="Dokumen Penyelesaian Uang Muka Operasional"
			:doc-number="settlement.number"
			:effective-date="date(settlement.date, 'DD/MM/YYYY')"
			:recipient="advance.recipient"
			:created-by="settlement.created_by"
		>
			<div class="flex items-end gap-6">
				<div class="flex flex-1 items-end">
					<span class="w-40 shrink-0 font-bold uppercase">Diajukan</span>:&nbsp;<span class="flex-1 border-b border-black px-1">{{
						settlement.created_by
					}}</span>
				</div>
				<div class="flex flex-1 items-end">
					<span class="shrink-0 font-bold uppercase">No. Dokumen</span>&nbsp;:&nbsp;<span class="flex-1 border-b border-black px-1">{{
						settlement.number
					}}</span>
				</div>
			</div>
			<div class="flex items-end">
				<span class="w-40 shrink-0 font-bold">Nomor Uang Muka</span>:&nbsp;<span class="w-[55mm] border-b border-black px-1">{{
					advance.number
				}}</span>
			</div>
			<div class="flex items-end">
				<span class="w-40 shrink-0 font-bold">Nama Penerima</span>:&nbsp;<span class="w-[55mm] border-b border-black px-1">{{
					advance.recipient
				}}</span>
			</div>
			<div class="flex items-center">
				<span class="w-40 shrink-0 font-bold">Nilai Penyelesaian</span>:&nbsp;
				<span class="ml-1 flex-1 border-2 border-black px-3 py-1 font-serif text-[22px] italic">{{ rp(settlement.amount) }}</span>
			</div>
			<div class="flex items-end">
				<span class="w-40 shrink-0 font-bold uppercase italic">Keterangan</span>:&nbsp;<span class="flex-1 border-b border-black px-1"
					>{{ settlement.description }}&nbsp;</span
				>
			</div>

			<table class="mt-3 w-full border-collapse border border-black text-[10px]">
				<thead>
					<tr class="border-b border-black">
						<th class="w-10 border-r border-black px-1 py-0.5">No</th>
						<th class="border-r border-black px-1 py-0.5">Akun</th>
						<th class="border-r border-black px-1 py-0.5">Keterangan</th>
						<th class="w-28 border-r border-black px-1 py-0.5">Debit</th>
						<th class="w-28 px-1 py-0.5">Kredit</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(line, index) in settlement.lines" :key="index" class="border-b border-black">
						<td class="border-r border-black px-1 py-0.5 text-center">{{ index + 1 }}</td>
						<td class="border-r border-black px-1 py-0.5">{{ line.account_code }} - {{ line.account_name }}</td>
						<td class="border-r border-black px-1 py-0.5">{{ line.detail_description || '-' }}</td>
						<td class="border-r border-black px-1 py-0.5 text-right">{{ cell(line.debit) }}</td>
						<td class="px-1 py-0.5 text-right">{{ cell(line.credit) }}</td>
					</tr>
				</tbody>
				<tfoot>
					<tr class="font-bold">
						<td colspan="3" class="border-r border-black px-1 py-0.5">Total</td>
						<td class="border-r border-black px-1 py-0.5 text-right">{{ money(totalDebit) }}</td>
						<td class="px-1 py-0.5 text-right">{{ money(totalCredit) }}</td>
					</tr>
				</tfoot>
			</table>
		</PrintSheet>
	</PrintLayout>
</template>
