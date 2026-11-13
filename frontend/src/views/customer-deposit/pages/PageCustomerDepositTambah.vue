<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import FormCustomerDeposit from '@/views/customer-deposit/components/FormCustomerDeposit.vue'
import type { CustomerDepositRequest } from '@/views/customer-deposit/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormCustomerDeposit>>()

async function save(payload: CustomerDepositRequest) {
	if (saving.value) return
	saving.value = true
	try {
		await api.post('/customer-deposit', payload)
		toast.success('Titipan customer ditambahkan')
		router.push('/customer-deposit')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422 && err.response.data?.errors) {
			formRef.value?.setServerErrors(err.response.data.errors)
			toast.error('Data belum tersimpan. Periksa isian yang ditandai merah.')
			return
		}
		toast.error(errorMessage(err, 'Titipan customer tidak dapat disimpan'))
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Tambah Titipan Customer" subtitle="Penjualan" />
		<FormCustomerDeposit ref="formRef" :loading="saving" @submit="save" />
	</div>
</template>
