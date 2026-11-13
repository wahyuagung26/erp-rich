<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import FormPurchaseInvoice from '@/views/purchase-invoice/components/FormPurchaseInvoice.vue'
import type { PurchaseInvoiceRequest } from '@/utils/types'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormPurchaseInvoice>>()
async function save(payload: PurchaseInvoiceRequest) {
	if (saving.value) return
	saving.value = true
	try {
		await api.post('/purchase-invoice', payload)
		toast.success('Invoice pembelian ditambahkan')
		router.push('/purchase-invoice')
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 422 && error.response.data?.errors) {
			formRef.value?.setServerErrors(error.response.data.errors)
			toast.error('Data belum tersimpan. Periksa isian yang ditandai merah.')
			return
		}
		toast.error(errorMessage(error, 'Invoice pembelian tidak dapat disimpan'))
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Tambah Invoice Pembelian" subtitle="Pembelian" /><FormPurchaseInvoice ref="formRef" :loading="saving" @submit="save" />
	</div>
</template>
