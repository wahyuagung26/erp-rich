<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormCustomerDeposit from '@/views/customer-deposit/components/FormCustomerDeposit.vue'
import type { CustomerDepositRequest } from '@/views/customer-deposit/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormCustomerDeposit>>()

async function save(payload: CustomerDepositRequest) {
	saving.value = true
	try {
		await api.post('/customer-deposit', payload)
		toast.success('Titipan customer ditambahkan')
		router.push('/customer-deposit')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) {
			const errors = err.response.data?.errors
			if (errors) formRef.value?.setServerErrors(errors)
			else toast.error(err.response.data?.message ?? 'Titipan customer tidak dapat disimpan')
			return
		}
		if (axios.isAxiosError(err)) {
			toast.error(err.response?.data?.message ?? 'Titipan customer tidak dapat disimpan')
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
		<PageHeader title="Tambah Titipan Customer" subtitle="Penjualan" />
		<FormCustomerDeposit ref="formRef" :loading="saving" @submit="save" />
	</div>
</template>
