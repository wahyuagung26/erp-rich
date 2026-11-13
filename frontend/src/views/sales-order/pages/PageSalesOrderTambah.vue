<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import FormSalesOrder from '@/views/sales-order/components/FormSalesOrder.vue'
import type { SalesOrderRequest } from '@/utils/types'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSalesOrder>>()
async function save(payload: SalesOrderRequest) {
	if (saving.value) return
	saving.value = true
	try {
		await api.post('/sales-order', payload)
		toast.success('Sales order ditambahkan')
		router.push('/sales-order')
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 422 && error.response.data?.errors) {
			formRef.value?.setServerErrors(error.response.data.errors)
			toast.error('Data belum tersimpan. Periksa isian yang ditandai merah.')
			return
		}
		toast.error(errorMessage(error, 'Sales order tidak dapat disimpan'))
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Tambah Sales Order" subtitle="Penjualan" /><FormSalesOrder ref="formRef" :loading="saving" @submit="save" />
	</div>
</template>
