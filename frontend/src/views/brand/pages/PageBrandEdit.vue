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
import FormBrand from '@/views/brand/components/FormBrand.vue'
import type { Brand } from '@/utils/types'
import type { BrandForm } from '@/views/brand/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const brand = ref<Brand>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormBrand>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Brand }>(`/brand/${route.params.id}`)
		brand.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: BrandForm) {
	saving.value = true
	try {
		await api.put(`/brand/${route.params.id}`, payload)
		toast.success('Merk diperbarui')
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
		<PageHeader title="Edit Merk" subtitle="Master data merk produk" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !brand">
			<EmptyState title="Merk tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/brand')">Kembali</Button>
			</div>
		</Panel>
		<FormBrand v-else ref="formRef" :initial="brand" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
