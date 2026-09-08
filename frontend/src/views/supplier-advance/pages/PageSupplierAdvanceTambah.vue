<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormSupplierAdvance from '@/views/supplier-advance/components/FormSupplierAdvance.vue'
import type { SupplierAdvanceRequest } from '@/views/supplier-advance/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSupplierAdvance>>()

async function save(payload: SupplierAdvanceRequest) {
	saving.value = true
	try {
		await api.post('/supplier-advance', payload)
		toast.success('Uang muka supplier ditambahkan')
		router.push('/supplier-advance')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) {
			const errors = err.response.data?.errors
			if (errors) formRef.value?.setServerErrors(errors)
			else toast.error(err.response.data?.message ?? 'Uang muka supplier tidak dapat disimpan')
			return
		}
		if (axios.isAxiosError(err)) {
			toast.error(err.response?.data?.message ?? 'Uang muka supplier tidak dapat disimpan')
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
		<PageHeader title="Uang Muka Supplier" subtitle="Pembelian" />
		<FormSupplierAdvance ref="formRef" :loading="saving" @submit="save" />
	</div>
</template>
