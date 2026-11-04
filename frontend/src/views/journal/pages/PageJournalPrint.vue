<script setup lang="ts">
// Print view of one general journal ("Dokumen Jurnal Umum"): sheet 1 = the document, then one sheet per
// image attachment (via PrintLayout). Same Legacy frame as the cash-advance printouts.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintJournalSheet, { type PrintEntry } from '@/components/print/PrintJournalSheet.vue'
import type { Journal } from '@/utils/types'

const route = useRoute()
const journal = ref<Journal>()
const loading = ref(true)
const notFound = ref(false)

// "Sumber Pengeluaran" = the cash/bank accounts touched, with the amount moved on each.
const sources = computed(() =>
	(journal.value?.lines ?? [])
		.filter((line) => line.account_type === 'cash_bank')
		.map((line) => ({ name: line.account_name, amount: line.debit || line.credit }))
)
const departments = computed(() => [...new Set((journal.value?.lines ?? []).map((line) => line.department_code).filter(Boolean))].join(', ') || '-')
// Debit lines first, then credit lines — Legacy prints D rows above C rows.
const entries = computed<PrintEntry[]>(() => {
	const lines = journal.value?.lines ?? []
	return [
		...lines
			.filter((line) => line.debit > 0)
			.map((line) => ({ side: 'D' as const, code: line.account_code, name: line.account_name, amount: line.debit })),
		...lines
			.filter((line) => line.credit > 0)
			.map((line) => ({ side: 'C' as const, code: line.account_code, name: line.account_name, amount: line.credit }))
	]
})

onMounted(async () => {
	useCompanyStore()
		.load()
		.catch(() => undefined)
	try {
		journal.value = (await api.get<{ data: Journal }>(`/journal/${route.params.id}`)).data.data
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
		:not-found="notFound || !journal"
		not-found-title="Jurnal tidak ditemukan"
		:doc-number="journal?.number"
		:attachments="journal?.attachments"
	>
		<PrintJournalSheet
			v-if="journal"
			title="Dokumen Jurnal Umum"
			:doc-number="journal.number"
			:doc-date="journal.date"
			:voucher="journal.voucher"
			:created-by="journal.created_by"
			:approved-by="journal.approved_by"
			:departments="departments"
			:amount="journal.total"
			:description="journal.description"
			source-label="Sumber Pengeluaran"
			:sources="sources"
			:entries="entries"
		/>
	</PrintLayout>
</template>
