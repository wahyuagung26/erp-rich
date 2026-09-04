<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormKategori from '@/views/kategori/components/FormKategori.vue'
import type { KategoriForm } from '@/views/kategori/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormKategori>>()

async function save(payload: KategoriForm) {
	saving.value = true
	try {
		await api.post('/kategori', payload)
		toast.success('Kategori ditambahkan')
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
		<PageHeader title="Tambah Kategori" subtitle="Master data kategori produk" />
		<FormKategori ref="formRef" :loading="saving" submit-label="Simpan Kategori" @submit="save" />
	</div>
</template>
