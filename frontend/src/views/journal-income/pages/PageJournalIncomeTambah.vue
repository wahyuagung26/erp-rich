<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Badge from '@/components/base/Badge.vue'
import FormJournalIncome from '@/views/journal-income/components/FormJournalIncome.vue'
import type { JournalIncomeForm } from '@/views/journal-income/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)

async function save(payload: JournalIncomeForm) {
	saving.value = true
	try {
		await api.post('/journal-income', payload)
		toast.success('Jurnal pemasukan diajukan')
		router.push('/journal-income')
	} catch (err) {
		if (axios.isAxiosError(err)) {
			toast.error(err.response?.data?.message ?? 'Jurnal pemasukan tidak dapat disimpan')
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
		<PageHeader title="Buat Jurnal Pemasukan" subtitle="Jurnal Pemasukan">
			<template #actions>
				<div class="flex items-center gap-2"><Badge tone="warning">Belum Disetujui</Badge></div>
			</template>
		</PageHeader>
		<FormJournalIncome :loading="saving" @submit="save" />
	</div>
</template>
