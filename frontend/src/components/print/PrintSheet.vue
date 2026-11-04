<script setup lang="ts">
// First sheet of a printed finance document (cash advance, journal, …): company + document-control header, title bar,
// the body (default slot) and the three signature blocks.
import { computed } from 'vue'
import { useCompanyStore } from '@/stores/company'

// `signatures` = the signature blocks left to right (`name` prints small under the line); defaults to Legacy's
// Penerima / Dibuat Oleh / Disetujui built from recipient / createdBy / approvedBy.
interface Signature {
	label: string
	name?: string | null
}
const props = defineProps<{
	title: string
	docNumber: string
	effectiveDate: string
	docLabel?: string
	recipient?: string
	createdBy?: string
	approvedBy?: string | null
	signatures?: Signature[]
}>()

const blocks = computed<Signature[]>(
	() =>
		props.signatures ?? [
			{ label: 'Penerima', name: props.recipient },
			{ label: 'Dibuat Oleh', name: props.createdBy },
			{ label: 'Disetujui', name: props.approvedBy }
		]
)

const company = computed(() => useCompanyStore().active?.legal_name ?? '')
</script>

<template>
	<section
		class="sheet mx-auto w-[277mm] max-w-full break-after-page bg-white p-2 text-[11px] leading-snug text-black last:break-after-auto print:w-full print:p-0"
	>
		<div class="flex border border-black">
			<!-- Legacy logo is gold on transparent, so it sits on a dark cell -->
			<div class="grid w-[22mm] shrink-0 place-items-center border-r border-black bg-[#121925] p-1">
				<img src="/logo.png" alt="Logo" class="h-full max-h-[19mm] w-full object-contain" />
			</div>
			<div class="flex flex-1 items-center justify-center border-r border-black px-4 py-4 text-center text-[18px] font-bold uppercase text-[#e8923b]">
				{{ company }}
			</div>
			<dl class="w-[75mm] shrink-0 space-y-0.5 px-2 py-2 font-serif text-[12px]">
				<div class="flex">
					<dt class="w-[22mm] shrink-0">{{ docLabel ?? 'No Dok' }}</dt>
					<dd>: {{ docNumber }}</dd>
				</div>
				<div class="flex">
					<dt class="w-[22mm] shrink-0">No Revisi</dt>
					<dd>: -</dd>
				</div>
				<div class="flex">
					<dt class="w-[22mm] shrink-0">Tgl Efektif</dt>
					<dd>: {{ effectiveDate }}</dd>
				</div>
			</dl>
		</div>

		<h1 class="border-x border-b border-black bg-[#f9dfd0] py-2 text-center font-serif text-[22px] font-bold uppercase tracking-wide">{{ title }}</h1>

		<div class="space-y-1 border-x border-b border-black px-3 py-2">
			<slot />

			<div class="flex justify-around gap-4 pt-4 text-center font-serif text-[12px]">
				<div v-for="block in blocks" :key="block.label">
					<p>{{ block.label ? `${block.label},` : '&nbsp;' }}</p>
					<div class="mx-auto mt-6 w-24 border-b border-black" />
					<p class="mt-0.5 font-sans text-[11px]">{{ block.name ?? '' }}&nbsp;</p>
				</div>
			</div>
		</div>
	</section>
</template>
