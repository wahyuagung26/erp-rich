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
import FormProduct from '@/views/product/components/FormProduct.vue'
import type { Product } from '@/utils/types'
import type { ProductForm } from '@/views/product/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const product = ref<Product>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormProduct>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Product }>(`/product/${route.params.id}`)
		product.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: ProductForm) {
	saving.value = true
	try {
		await api.put(`/product/${route.params.id}`, payload)
		toast.success('Produk diperbarui')
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
		<PageHeader title="Edit Produk" subtitle="Master data produk" />
		<Panel v-if="loading" class="max-w-5xl"><Skeleton :lines="4" /></Panel>
		<Panel v-else-if="notFound || !product" class="max-w-5xl">
			<EmptyState title="Produk tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/product')">Kembali</Button>
			</div>
		</Panel>
		<FormProduct v-else ref="formRef" :initial="product" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
