<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import FormJournalExpense from '@/views/journal-expense/components/FormJournalExpense.vue'
import { journalStatusLabel, journalStatusTone, type JournalExpenseForm } from '@/views/journal-expense/schema'
import type { JournalExpense } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const journal = ref<JournalExpense>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: JournalExpense }>(`/journal-expense/${route.params.id}`)
		journal.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

const toForm = (value: JournalExpense): JournalExpenseForm => ({
	number: value.number,
	date: value.date,
	voucher: value.voucher,
	description: value.description,
	attachment: value.attachment,
	cash_account_id: value.cash_account_id,
	cash_account_code: value.cash_account_code,
	cash_account_name: value.cash_account_name,
	department_id: value.department_id,
	department_code: value.department_code,
	department_name: value.department_name,
	cash_flow: value.cash_flow,
	cash_flow_name: value.cash_flow_name,
	lines: value.lines.map((line) => ({ ...line }))
})

async function save(payload: JournalExpenseForm) {
	saving.value = true
	try {
		await api.put(`/journal-expense/${route.params.id}`, payload)
		toast.success('Jurnal pengeluaran diperbarui')
		router.push(`/journal-expense/${route.params.id}`)
	} catch (err) {
		if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Jurnal pengeluaran tidak dapat diperbarui')
		else throw err
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Edit Jurnal Pengeluaran" subtitle="Jurnal Pengeluaran">
			<template v-if="journal" #actions>
				<div class="flex items-center gap-2">
					<Badge :tone="journalStatusTone[journal.status]">{{ journalStatusLabel[journal.status] }}</Badge>
				</div>
			</template>
		</PageHeader>
		<Panel v-if="loading" class="max-w-5xl"><Skeleton :lines="5" /></Panel>
		<Panel v-else-if="notFound || !journal" class="max-w-5xl">
			<EmptyState title="Jurnal pengeluaran tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center"><Button variant="secondary" @click="router.push('/journal-expense')">Kembali</Button></div>
		</Panel>
		<Panel v-else-if="journal.status !== 'submitted'" class="max-w-5xl">
			<EmptyState title="Jurnal tidak dapat diedit" description="Hanya jurnal dengan status Menunggu Persetujuan yang dapat diedit." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push(`/journal-expense/${journal.id}`)">Lihat Detail</Button>
			</div>
		</Panel>
		<FormJournalExpense v-else :initial-value="toForm(journal)" :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
