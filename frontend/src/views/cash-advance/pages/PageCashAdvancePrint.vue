<script setup lang="ts">
// Print view of one cash advance: sheet 1 = the document (Legacy "Dokumen Uang Muka Operasional"),
// then one sheet per image attachment (via PrintLayout).
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import { date, money } from '@/utils/format'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintSheet from '@/components/print/PrintSheet.vue'
import type { CashAdvance } from '@/utils/types'

const route = useRoute()
const advance = ref<CashAdvance>()
const loading = ref(true)
const notFound = ref(false)
const rp = (value: number) => `Rp. ${money(value)}`

onMounted(async () => {
	useCompanyStore()
		.load()
		.catch(() => undefined)
	try {
		advance.value = (await api.get<{ data: CashAdvance }>(`/cash-advance/${route.params.id}`)).data.data
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
		:not-found="notFound || !advance"
		not-found-title="Uang muka operasional tidak ditemukan"
		:doc-number="advance?.number"
		:attachments="advance?.attachments"
	>
		<PrintSheet
			v-if="advance"
			title="Dokumen Uang Muka Operasional"
			:doc-number="advance.number"
			:effective-date="date(advance.date, 'DD/MM/YYYY')"
			:recipient="advance.recipient"
			:created-by="advance.created_by"
			:approved-by="advance.approved_by"
		>
			<div class="flex items-end gap-6">
				<div class="flex flex-1 items-end">
					<span class="w-40 shrink-0 font-bold uppercase">Diajukan</span>:&nbsp;<span class="flex-1 border-b border-black px-1">{{
						advance.created_by
					}}</span>
				</div>
				<div class="flex flex-1 items-end">
					<span class="shrink-0 font-bold uppercase">No. Dokumen</span>&nbsp;:&nbsp;<span class="flex-1 border-b border-black px-1">{{
						advance.number
					}}</span>
				</div>
			</div>
			<div class="flex items-end">
				<span class="w-40 shrink-0 font-bold uppercase">No. Voucher</span>:&nbsp;<span class="w-[55mm] border-b border-black px-1">{{
					advance.voucher
				}}</span>
			</div>
			<div class="flex items-end">
				<span class="w-40 shrink-0 font-bold">Nama Penerima</span>:&nbsp;<span class="w-[55mm] border-b border-black px-1">{{
					advance.recipient
				}}</span>
			</div>
			<div class="flex items-center">
				<span class="w-40 shrink-0 font-bold">Banyaknya Uang</span>:&nbsp;
				<span class="ml-1 flex-1 border-2 border-black px-3 py-1 font-serif text-[22px] italic">{{ rp(advance.amount) }}</span>
			</div>
			<div class="flex items-end">
				<span class="w-40 shrink-0 font-bold italic uppercase">Keterangan</span>:&nbsp;<span class="flex-1 border-b border-black px-1"
					>{{ advance.description }}&nbsp;</span
				>
			</div>
			<div class="flex items-end">
				<span class="w-40 shrink-0 font-bold uppercase">Sumber Pengeluaran</span>:&nbsp;
				<span class="px-1">{{ advance.cash_account_name }}</span>
				<span class="ml-4">Rp.</span>
				<span class="ml-1 w-[40mm] border-b border-black px-1 text-right">{{ money(advance.amount) }}</span>
			</div>

			<div class="flex justify-end pt-2">
				<div class="flex w-[185mm] items-start gap-3">
					<p class="shrink-0 pt-0.5 font-bold uppercase">Jurnal Terbentuk</p>
					<div class="flex-1">
						<div class="border border-black">
							<div class="flex border-b border-black">
								<span class="w-8 shrink-0 border-r border-black text-center">D</span>
								<span class="flex-1 px-1">CoA : {{ advance.advance_account_code }} - {{ advance.advance_account_name }}</span>
								<span class="px-1">{{ rp(advance.amount) }}</span>
							</div>
							<div class="flex">
								<span class="w-8 shrink-0 border-r border-black text-center">C</span>
								<span class="flex-1 px-1">CoA : {{ advance.cash_account_code }} - {{ advance.cash_account_name }}</span>
								<span class="px-1">{{ rp(advance.amount) }}</span>
							</div>
						</div>
						<p class="mt-1 text-center font-serif text-[12px]">Tanggal : {{ date(advance.date, 'DD/MM/YYYY') }}</p>
					</div>
				</div>
			</div>
		</PrintSheet>
	</PrintLayout>
</template>
