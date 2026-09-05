<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormBrand from '@/views/brand/components/FormBrand.vue'
import type { BrandForm } from '@/views/brand/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormBrand>>()

async function save(payload: BrandForm) {
	saving.value = true
	try {
		await api.post('/brand', payload)
		toast.success('Merk ditambahkan')
		router.push('/brand')
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
		<PageHeader title="Tambah Merk" subtitle="Master data merk produk" />
		<FormBrand ref="formRef" :loading="saving" submit-label="Simpan Merk" @submit="save" />
	</div>
</template>
