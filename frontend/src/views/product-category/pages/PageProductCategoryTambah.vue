<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormProductCategory from '@/views/product-category/components/FormProductCategory.vue'
import type { ProductCategoryForm } from '@/views/product-category/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormProductCategory>>()

async function save(payload: ProductCategoryForm) {
	saving.value = true
	try {
		await api.post('/product-category', payload)
		toast.success('Kategori ditambahkan')
		router.push('/product-category')
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
		<PageHeader title="Tambah Kategori" subtitle="Master data kategori produk" />
		<FormProductCategory ref="formRef" :loading="saving" submit-label="Simpan Kategori" @submit="save" />
	</div>
</template>
