<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormProduct from '@/views/product/components/FormProduct.vue'
import type { ProductForm } from '@/views/product/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormProduct>>()

async function save(payload: ProductForm) {
	saving.value = true
	try {
		await api.post('/product', payload)
		toast.success('Produk ditambahkan')
		router.push('/product')
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
		<PageHeader title="Tambah Produk" subtitle="Master data produk" />
		<FormProduct ref="formRef" :loading="saving" submit-label="Simpan Produk" @submit="save" />
	</div>
</template>
