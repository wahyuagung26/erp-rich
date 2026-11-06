<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
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
	saving.value = true
	try {
		const res = await api.post<{ data: { id: number } }>('/sales-invoice', payload)
		toast.success('Invoice penjualan ditambahkan')
		router.push(`/sales-invoice/${res.data.data.id}`)
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 422) {
			const errors = error.response.data?.errors
			if (errors) formRef.value?.setServerErrors(errors)
			else toast.error(error.response.data?.message ?? 'Invoice penjualan tidak dapat disimpan')
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
		<PageHeader title="Tambah Invoice Penjualan" subtitle="Penjualan" /><FormSalesInvoice
			ref="formRef"
			:sales-order-id="salesOrderId"
			:loading="saving"
			@submit="save"
		/>
	</div>
</template>
