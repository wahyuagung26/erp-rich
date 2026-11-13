<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import ApprovalBadge from '@/components/common/ApprovalBadge.vue'
import FormJournalExpense from '@/views/journal-expense/components/FormJournalExpense.vue'
import type { JournalExpenseForm } from '@/views/journal-expense/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormJournalExpense>>()

async function save(payload: JournalExpenseForm) {
	if (saving.value) return
	saving.value = true
	try {
		await api.post('/journal-expense', payload)
		toast.success('Jurnal pengeluaran diajukan')
		router.push('/journal-expense')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422 && err.response.data?.errors) {
			formRef.value?.setServerErrors(err.response.data.errors)
			toast.error('Data belum tersimpan. Periksa isian yang ditandai merah.')
			return
		}
		toast.error(errorMessage(err, 'Jurnal pengeluaran tidak dapat disimpan'))
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Buat Jurnal Pengeluaran" subtitle="Jurnal Pengeluaran">
			<template #actions>
				<div class="flex items-center gap-2 self-start"><ApprovalBadge status="submitted" /></div>
			</template>
		</PageHeader>
		<FormJournalExpense ref="formRef" :loading="saving" @submit="save" />
	</div>
</template>
