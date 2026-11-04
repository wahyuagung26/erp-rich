<script setup lang="ts">
// First sheet of a printed journal ("Dokumen Jurnal Umum / Pengeluaran / Pemasukan"): header fields, the
// cash/bank source(s), the formed entries (D/C) and the Diajukan / Disetujui signatures. Data comes from the page.
import { date, money } from '@/utils/format'
import PrintSheet from './PrintSheet.vue'

export interface PrintEntry {
	side: 'D' | 'C'
	code?: string
	name?: string
	amount: number
}

defineProps<{
	title: string
	docNumber: string
	docDate: string
	voucher: string
	createdBy: string
	approvedBy: string | null
	departments: string
	amount: number
	description: string
	sourceLabel: string
	sources: { name?: string; amount: number }[]
	entries: PrintEntry[]
}>()

const rp = (value: number) => `Rp. ${money(value)}`
</script>

<template>
	<PrintSheet
		:title="title"
		doc-label="No Jurnal"
		:doc-number="docNumber"
		:effective-date="date(docDate, 'DD/MM/YYYY')"
		:signatures="[
			{ label: 'Diajukan', name: createdBy },
			{ label: 'Disetujui', name: approvedBy }
		]"
	>
		<div class="flex items-end gap-6">
			<div class="flex flex-1 items-end">
				<span class="w-40 shrink-0 font-bold uppercase">Diajukan</span>:&nbsp;<span class="flex-1 border-b border-black px-1">{{ createdBy }}</span>
			</div>
			<div class="flex flex-1 items-end">
				<span class="shrink-0 font-bold uppercase">No. Voucher</span>&nbsp;:&nbsp;<span class="flex-1 border-b border-black px-1">{{ voucher }}</span>
			</div>
		</div>
		<div class="flex items-end">
			<span class="w-40 shrink-0 font-bold uppercase">Departemen</span>:&nbsp;<span class="w-[55mm] border-b border-black px-1">{{
				departments
			}}</span>
		</div>
		<div class="flex items-center">
			<span class="w-40 shrink-0 font-bold">Banyaknya Uang</span>:&nbsp;
			<span class="ml-1 flex-1 border-2 border-black px-3 py-1 font-serif text-[22px] italic">{{ rp(amount) }}</span>
		</div>
		<div class="flex items-end">
			<span class="w-40 shrink-0 font-bold uppercase italic">Keterangan</span>:&nbsp;<span class="flex-1 border-b border-black px-1"
				>{{ description }}&nbsp;</span
			>
		</div>
		<div class="flex items-start">
			<span class="w-40 shrink-0 font-bold uppercase">{{ sourceLabel }}</span
			>:&nbsp;
			<div class="space-y-0.5">
				<div v-for="(source, index) in sources" :key="index" class="flex items-end">
					<span class="w-[60mm] px-1">{{ source.name }}</span>
					<span class="ml-4">Rp.</span>
					<span class="ml-1 w-[40mm] border-b border-black px-1 text-right">{{ money(source.amount) }}</span>
				</div>
				<span v-if="!sources.length" class="px-1">-</span>
			</div>
		</div>

		<div class="flex justify-end pt-2">
			<div class="flex w-[185mm] items-start gap-3">
				<p class="shrink-0 pt-0.5 font-bold uppercase">Jurnal Terbentuk</p>
				<div class="flex-1">
					<div class="border border-black">
						<div v-for="(entry, index) in entries" :key="index" class="flex" :class="{ 'border-b border-black': index < entries.length - 1 }">
							<span class="w-8 shrink-0 border-r border-black text-center">{{ entry.side }}</span>
							<span class="flex-1 px-1">CoA : {{ entry.code }} - {{ entry.name }}</span>
							<span class="px-1">{{ rp(entry.amount) }}</span>
						</div>
					</div>
					<p class="mt-1 text-center font-serif text-[12px]">Tanggal : {{ date(docDate, 'DD/MM/YYYY') }}</p>
				</div>
			</div>
		</div>
	</PrintSheet>
</template>
