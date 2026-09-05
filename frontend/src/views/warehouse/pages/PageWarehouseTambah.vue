<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormWarehouse from '@/views/warehouse/components/FormWarehouse.vue'
import type { WarehouseForm } from '@/views/warehouse/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormWarehouse>>()

async function save(payload: WarehouseForm) {
	saving.value = true
	try {
		await api.post('/warehouse', payload)
		toast.success('Gudang ditambahkan')
		router.push('/warehouse')
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
		<PageHeader title="Tambah Gudang" subtitle="Master data gudang" />
		<FormWarehouse ref="formRef" :loading="saving" submit-label="Simpan Gudang" @submit="save" />
	</div>
</template>
