<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormSatuan from '@/views/satuan/components/FormSatuan.vue'
import type { SatuanForm } from '@/views/satuan/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSatuan>>()

async function save(payload: SatuanForm) {
	saving.value = true
	try {
		await api.post('/satuan', payload)
		toast.success('Satuan ditambahkan')
		router.push('/satuan')
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
		<PageHeader title="Tambah Satuan" subtitle="Master data satuan produk" />
		<FormSatuan ref="formRef" :loading="saving" submit-label="Simpan Satuan" @submit="save" />
	</div>
</template>
