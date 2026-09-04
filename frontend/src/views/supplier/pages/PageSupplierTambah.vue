<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormSupplier from '@/views/supplier/components/FormSupplier.vue'
import type { SupplierForm } from '@/views/supplier/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)

async function save(payload: SupplierForm) {
	saving.value = true
	try {
		await api.post('/supplier', payload)
		toast.success('Supplier ditambahkan')
		router.push('/supplier')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) {
			toast.error(err.response.data?.message ?? 'Pilih perusahaan aktif terlebih dahulu')
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
		<PageHeader title="Tambah Supplier" subtitle="Master data vendor" />
		<FormSupplier :loading="saving" submit-label="Simpan Supplier" @submit="save" />
	</div>
</template>
