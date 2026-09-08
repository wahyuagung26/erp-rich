<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormCustomer from '@/views/customer/components/FormCustomer.vue'
import type { CustomerForm } from '@/views/customer/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormCustomer>>()

async function save(payload: CustomerForm) {
	saving.value = true
	try {
		await api.post('/customer', payload)
		toast.success('Customer ditambahkan')
		router.push('/customer')
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
		<PageHeader title="Tambah Customer" subtitle="Master data pelanggan" />
		<FormCustomer ref="formRef" :loading="saving" submit-label="Simpan Customer" @submit="save" />
	</div>
</template>
