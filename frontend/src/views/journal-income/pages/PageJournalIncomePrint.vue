<script setup lang="ts">
// Print view of one journal pemasukan ("Dokumen Jurnal Pemasukan"): sheet 1 = the document, then one sheet per image attachment.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintJournalSheet, { type PrintEntry } from '@/components/print/PrintJournalSheet.vue'
import type { JournalIncome } from '@/utils/types'

const route = useRoute()
const journal = ref<JournalIncome>()
const loading = ref(true)
const notFound = ref(false)

const amount = computed(() => journal.value?.cash_in ?? 0)
const entry =
	(side: 'D' | 'C') =>
	(line: JournalIncome['lines'][number]): PrintEntry => ({
		side,
		code: line.account_code,
		name: line.account_name,
		amount: side === 'D' ? line.debit : line.credit
	})
// Income lines (credit, then deductions at debit), then the cash/bank debit appended by the server.
const entries = computed<PrintEntry[]>(() => {
	const j = journal.value
	if (!j) return []
	return [
		...j.lines.filter((l) => l.credit > 0).map(entry('C')),
		...j.lines.filter((l) => l.debit > 0).map(entry('D')),
		{ side: 'D', code: j.cash_account_code, name: j.cash_account_name, amount: j.cash_in }
	]
})

onMounted(async () => {
	useCompanyStore()
		.load()
		.catch(() => undefined)
	try {
		journal.value = (await api.get<{ data: JournalIncome }>(`/journal-income/${route.params.id}`)).data.data
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
			title="Dokumen Jurnal Pemasukan"
			:doc-number="journal.number"
			:doc-date="journal.date"
			:voucher="journal.voucher"
			:created-by="journal.created_by"
			:approved-by="journal.approved_by"
			:departments="journal.department_code ?? '-'"
			:amount="amount"
			:description="journal.description"
			source-label="Sumber Pemasukan"
			:sources="[{ name: journal.cash_account_name, amount }]"
			:entries="entries"
		/>
	</PrintLayout>
</template>
