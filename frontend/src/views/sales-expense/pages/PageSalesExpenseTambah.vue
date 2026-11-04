<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormSalesExpense from '@/views/sales-expense/components/FormSalesExpense.vue'
import type { SalesExpenseForm } from '@/views/sales-expense/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSalesExpense>>()

async function save(payload: SalesExpenseForm) {
	saving.value = true
	try {
		await api.post('/sales-expense', payload)
		toast.success('Biaya penjualan ditambahkan')
		router.push('/sales-expense')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) {
			const errors = err.response.data?.errors
			if (errors) formRef.value?.setServerErrors(errors)
			else toast.error(err.response.data?.message ?? 'Pilih perusahaan aktif terlebih dahulu')
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
		<PageHeader title="Tambah Biaya Penjualan" subtitle="Master data biaya penjualan" />
		<FormSalesExpense ref="formRef" :loading="saving" submit-label="Simpan Biaya Penjualan" @submit="save" />
	</div>
</template>
