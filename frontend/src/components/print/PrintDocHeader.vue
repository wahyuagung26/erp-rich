<script setup lang="ts">
// Company block (logo, name, address, NPWP) + document title / date / number, then the heavy divider.
import { date } from '@/utils/format'
import type { Company } from '@/utils/types'

defineProps<{ company: Company; title: string; docDate: string; numberLabel: string; number: string }>()
</script>

<template>
	<div class="flex items-center gap-3">
		<div class="grid h-[55px] w-[55px] shrink-0 place-items-center bg-[#121925]">
			<img src="/logo.png" alt="Logo" class="h-full w-full object-contain p-1" />
		</div>
		<div class="flex-1 text-[11px]">
			<div class="text-[16px] font-bold text-[#9b4f1a]">{{ company.legal_name }}</div>
			<div>{{ company.address }}</div>
			<div v-if="company.npwp">NPWP : {{ company.npwp }}</div>
		</div>
		<div class="w-[85mm] shrink-0">
			<div class="whitespace-nowrap text-right font-bold leading-none" :class="title.length > 16 ? 'text-[22px]' : 'text-[26px]'">{{ title }}</div>
			<dl class="mt-5 grid grid-cols-[22mm_2mm_1fr] gap-y-0.5">
				<dt>Tanggal</dt>
				<dd>:</dd>
				<dd>{{ date(docDate, 'dddd, DD MMMM YYYY') }}</dd>
				<dt>{{ numberLabel }}</dt>
				<dd>:</dd>
				<dd class="font-bold">{{ number }}</dd>
			</dl>
		</div>
	</div>
	<div class="mb-3 mt-2 border-t-2 border-black" />
</template>
