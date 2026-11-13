<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import FormSalesInvoice from '@/views/sales-invoice/components/FormSalesInvoice.vue'
import type { SalesInvoiceRequest } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSalesInvoice>>()
// "Buat Invoice" on a Sales Order lands here with ?sales_order_id=<id>.
const salesOrderId = Number(route.query.sales_order_id) || null

async function save(payload: SalesInvoiceRequest) {
	if (saving.value) return
	saving.value = true
	try {
		const res = await api.post<{ data: { id: number } }>('/sales-invoice', payload)
		toast.success('Invoice penjualan ditambahkan')
		router.push(`/sales-invoice/${res.data.data.id}`)
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 422 && error.response.data?.errors) {
			formRef.value?.setServerErrors(error.response.data.errors)
			toast.error('Data belum tersimpan. Periksa isian yang ditandai merah.')
			return
		}
		toast.error(errorMessage(error, 'Invoice penjualan tidak dapat disimpan'))
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Tambah Invoice Penjualan" subtitle="Penjualan" /><FormSalesInvoice
			ref="formRef"
			:sales-order-id="salesOrderId"
			:loading="saving"
			@submit="save"
		/>
	</div>
</template>
