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
import FormKategori from '@/views/kategori/components/FormKategori.vue'
import type { Kategori } from '@/utils/types'
import type { KategoriForm } from '@/views/kategori/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const kategori = ref<Kategori>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormKategori>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Kategori }>(`/kategori/${route.params.id}`)
		kategori.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: KategoriForm) {
	saving.value = true
	try {
		await api.put(`/kategori/${route.params.id}`, payload)
		toast.success('Kategori diperbarui')
		router.push('/kategori')
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
		<Panel v-else-if="notFound || !kategori">
			<EmptyState title="Kategori tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/kategori')">Kembali</Button>
			</div>
		</Panel>
		<FormKategori v-else ref="formRef" :initial="kategori" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
