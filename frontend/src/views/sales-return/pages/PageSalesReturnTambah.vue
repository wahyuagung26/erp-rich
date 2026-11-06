<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormSalesReturn from '@/views/sales-return/components/FormSalesReturn.vue'
import type { SalesReturnRequest } from '@/utils/types'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSalesReturn>>()
async function save(payload: SalesReturnRequest) {
	saving.value = true
	try {
		await api.post('/sales-return', payload)
		toast.success('Retur penjualan ditambahkan')
		router.push('/sales-return')
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 422) {
				const errors = error.response.data?.errors
				if (errors) formRef.value?.setServerErrors(errors)
				else toast.error(error.response.data?.message ?? 'Retur penjualan tidak dapat disimpan')
				return
			}
			toast.error(error.response?.data?.message ?? 'Retur penjualan tidak dapat disimpan')
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
		<PageHeader title="Tambah Retur Penjualan" subtitle="Penjualan" />
		<FormSalesReturn ref="formRef" :loading="saving" @submit="save" />
	</div>
</template>
