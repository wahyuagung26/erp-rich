<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import FormSupplierAdvance from '@/views/supplier-advance/components/FormSupplierAdvance.vue'
import type { SupplierAdvanceRequest } from '@/views/supplier-advance/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSupplierAdvance>>()

async function save(payload: SupplierAdvanceRequest) {
	if (saving.value) return
	saving.value = true
	try {
		await api.post('/supplier-advance', payload)
		toast.success('Uang muka supplier ditambahkan')
		router.push('/supplier-advance')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422 && err.response.data?.errors) {
			formRef.value?.setServerErrors(err.response.data.errors)
			toast.error('Data belum tersimpan. Periksa isian yang ditandai merah.')
			return
		}
		toast.error(errorMessage(err, 'Uang muka supplier tidak dapat disimpan'))
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Tambah Uang Muka Supplier" subtitle="Pembelian" />
		<FormSupplierAdvance ref="formRef" :loading="saving" @submit="save" />
	</div>
</template>
