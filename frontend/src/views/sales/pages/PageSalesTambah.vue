<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormSales from '@/views/sales/components/FormSales.vue'
import type { SalesForm } from '@/views/sales/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSales>>()

async function save(payload: SalesForm) {
	saving.value = true
	try {
		await api.post('/sales', payload)
		toast.success('Sales ditambahkan')
		router.push('/sales')
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
		<PageHeader title="Tambah Sales" subtitle="Master data sales" />
		<FormSales ref="formRef" :loading="saving" submit-label="Simpan Sales" @submit="save" />
	</div>
</template>
