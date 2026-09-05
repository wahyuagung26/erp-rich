<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import FormProductCategory from '@/views/product-category/components/FormProductCategory.vue'
import type { ProductCategory } from '@/utils/types'
import type { ProductCategoryForm } from '@/views/product-category/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const productCategory = ref<ProductCategory>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormProductCategory>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: ProductCategory }>(`/product-category/${route.params.id}`)
		productCategory.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: ProductCategoryForm) {
	saving.value = true
	try {
		await api.put(`/product-category/${route.params.id}`, payload)
		toast.success('Kategori diperbarui')
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
		<PageHeader title="Edit Kategori" subtitle="Master data kategori produk" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !productCategory">
			<EmptyState title="Kategori tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/product-category')">Kembali</Button>
			</div>
		</Panel>
		<FormProductCategory v-else ref="formRef" :initial="productCategory" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
