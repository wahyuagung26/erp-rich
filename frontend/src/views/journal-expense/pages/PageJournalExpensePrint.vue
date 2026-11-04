<script setup lang="ts">
// Print view of one journal pengeluaran ("Dokumen Jurnal Pengeluaran"): sheet 1 = the document, then one sheet per image attachment.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import PrintLayout from '@/components/print/PrintLayout.vue'
import PrintJournalSheet, { type PrintEntry } from '@/components/print/PrintJournalSheet.vue'
import type { JournalExpense } from '@/utils/types'

const route = useRoute()
const journal = ref<JournalExpense>()
const loading = ref(true)
const notFound = ref(false)

const amount = computed(() => journal.value?.cash_out ?? 0)
const entry =
	(side: 'D' | 'C') =>
	(line: JournalExpense['lines'][number]): PrintEntry => ({
		side,
		code: line.account_code,
		name: line.account_name,
		amount: side === 'D' ? line.debit : line.credit
	})
// Expense lines (debit, then deductions at credit), then the cash/bank credit appended by the server.
const entries = computed<PrintEntry[]>(() => {
	const j = journal.value
	if (!j) return []
	return [
		...j.lines.filter((l) => l.debit > 0).map(entry('D')),
		...j.lines.filter((l) => l.credit > 0).map(entry('C')),
		{ side: 'C', code: j.cash_account_code, name: j.cash_account_name, amount: j.cash_out }
	]
})

onMounted(async () => {
	useCompanyStore()
		.load()
		.catch(() => undefined)
	try {
		journal.value = (await api.get<{ data: JournalExpense }>(`/journal-expense/${route.params.id}`)).data.data
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
			title="Dokumen Jurnal Pengeluaran"
			:doc-number="journal.number"
			:doc-date="journal.date"
			:voucher="journal.voucher"
			:created-by="journal.created_by"
			:approved-by="journal.approved_by"
			:departments="journal.department_code ?? '-'"
			:amount="amount"
			:description="journal.description"
			source-label="Sumber Pengeluaran"
			:sources="[{ name: journal.cash_account_name, amount }]"
			:entries="entries"
		/>
	</PrintLayout>
</template>
