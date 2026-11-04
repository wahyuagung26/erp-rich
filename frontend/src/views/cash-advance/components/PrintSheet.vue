<script setup lang="ts">
// First sheet of a printed cash-advance document: company + document-control header, title bar,
// the body (default slot) and the three signature blocks.
import { computed } from 'vue'
import { useCompanyStore } from '@/stores/company'

defineProps<{ title: string; docNumber: string; effectiveDate: string; recipient: string; createdBy: string; approvedBy?: string | null }>()

const company = computed(() => useCompanyStore().active?.legal_name ?? '')
</script>

<template>
	<section
		class="sheet mx-auto w-[277mm] max-w-full break-after-page bg-white p-2 text-[11px] leading-snug text-black last:break-after-auto print:w-full print:p-0"
	>
		<div class="flex border border-black">
			<div class="flex flex-1 items-center justify-center border-r border-black px-4 py-6 text-center text-[16px] font-bold uppercase text-[#e8923b]">
				{{ company }}
			</div>
			<dl class="w-[70mm] shrink-0 space-y-0.5 px-2 py-2 text-[11px]">
				<div class="flex">
					<dt class="w-16 shrink-0">No Dok</dt>
					<dd>: {{ docNumber }}</dd>
				</div>
				<div class="flex">
					<dt class="w-16 shrink-0">No Revisi</dt>
					<dd>: -</dd>
				</div>
				<div class="flex">
					<dt class="w-16 shrink-0">Tgl Efektif</dt>
					<dd>: {{ effectiveDate }}</dd>
				</div>
			</dl>
		</div>

		<h1 class="border-x border-b border-black bg-[#f9dfd0] py-2 text-center font-serif text-[22px] font-bold uppercase tracking-wide">{{ title }}</h1>

		<div class="space-y-1.5 border-x border-b border-black px-3 py-3">
			<slot />

			<div class="grid grid-cols-3 gap-6 pt-6 text-center">
				<div>
					<p>Penerima,</p>
					<div class="mx-auto mt-10 w-40 border-b border-black" />
					<p class="text-[9px]">{{ recipient }}</p>
				</div>
				<div>
					<p>Dibuat Oleh,</p>
					<div class="mx-auto mt-10 w-40 border-b border-black" />
					<p class="text-[9px]">{{ createdBy }}</p>
				</div>
				<div>
					<p>Disetujui,</p>
					<div class="mx-auto mt-10 w-40 border-b border-black" />
					<p class="text-[9px]">{{ approvedBy ?? '' }}&nbsp;</p>
				</div>
			</div>
		</div>
	</section>
</template>
