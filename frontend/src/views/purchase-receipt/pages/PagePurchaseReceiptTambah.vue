<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormPurchaseReceipt from '@/views/purchase-receipt/components/FormPurchaseReceipt.vue'
import type { PurchaseReceiptRequest } from '@/utils/types'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormPurchaseReceipt>>()
async function save(payload: PurchaseReceiptRequest) {
	saving.value = true
	try {
		await api.post('/purchase-receipt', payload)
		toast.success('Penerimaan pembelian ditambahkan')
		router.push('/purchase-receipt')
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 422) {
				const errors = error.response.data?.errors
				if (errors) formRef.value?.setServerErrors(errors)
				else toast.error(error.response.data?.message ?? 'Penerimaan pembelian tidak dapat disimpan')
				return
			}
			toast.error(error.response?.data?.message ?? 'Penerimaan pembelian tidak dapat disimpan')
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
		<PageHeader title="Tambah Penerimaan Pembelian" subtitle="Pembelian" /><FormPurchaseReceipt ref="formRef" :loading="saving" @submit="save" />
	</div>
</template>
