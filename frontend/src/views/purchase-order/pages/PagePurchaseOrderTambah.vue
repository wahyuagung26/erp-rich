<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormPurchaseOrder from '@/views/purchase-order/components/FormPurchaseOrder.vue'
import type { PurchaseOrderRequest } from '@/utils/types'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormPurchaseOrder>>()
async function save(payload: PurchaseOrderRequest) {
	saving.value = true
	try {
		await api.post('/purchase-order', payload)
		toast.success('Order pembelian ditambahkan')
		router.push('/purchase-order')
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 422) {
			formRef.value?.setServerErrors(error.response.data?.errors ?? {})
			return
		}
		throw error
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Tambah Order Pembelian" subtitle="Pembelian" /><FormPurchaseOrder ref="formRef" :loading="saving" @submit="save" />
	</div>
</template>
