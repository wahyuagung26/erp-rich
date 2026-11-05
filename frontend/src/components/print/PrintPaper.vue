<script setup lang="ts">
// One A4 portrait sheet for printed purchasing documents (PO, receipt…); `watermark` stamps a big diagonal word.
defineProps<{ watermark?: string }>()
</script>

<template>
	<section
		class="sheet relative mx-auto min-h-[297mm] w-[210mm] max-w-full overflow-hidden bg-white px-[10mm] py-[12mm] text-[12px] leading-snug text-black print:min-h-0 print:w-full print:max-w-none"
		style="font-family: Tahoma, Verdana, Segoe, sans-serif; print-color-adjust: exact; -webkit-print-color-adjust: exact"
	>
		<div v-if="watermark" class="pointer-events-none absolute inset-0 z-10 grid place-items-center print:fixed" aria-hidden="true">
			<span class="-rotate-[35deg] select-none text-[150px] font-bold uppercase tracking-widest text-black/10">{{ watermark }}</span>
		</div>
		<slot />
	</section>
</template>
