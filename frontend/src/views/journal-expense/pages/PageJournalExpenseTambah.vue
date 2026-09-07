<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Badge from '@/components/base/Badge.vue'
import FormJournalExpense from '@/views/journal-expense/components/FormJournalExpense.vue'
import type { JournalExpenseForm } from '@/views/journal-expense/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)

async function save(payload: JournalExpenseForm) {
	saving.value = true
	try {
		await api.post('/journal-expense', payload)
		toast.success('Jurnal pengeluaran diajukan')
		router.push('/journal-expense')
	} catch (err) {
		if (axios.isAxiosError(err)) {
			toast.error(err.response?.data?.message ?? 'Jurnal pengeluaran tidak dapat disimpan')
			return
		}
		throw err
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Buat Jurnal Pengeluaran" subtitle="Jurnal Pengeluaran">
			<template #actions>
				<div class="flex items-center gap-2"><Badge tone="warning">Belum Disetujui</Badge></div>
			</template>
		</PageHeader>
		<FormJournalExpense :loading="saving" @submit="save" />
	</div>
</template>
