<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormPerusahaan from '@/views/perusahaan/components/FormPerusahaan.vue'
import type { PerusahaanForm } from '@/views/perusahaan/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormPerusahaan>>()

async function save(payload: PerusahaanForm) {
	saving.value = true
	try {
		await api.post('/perusahaan', payload)
		toast.success('Perusahaan ditambahkan')
		router.push('/perusahaan')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) {
			formRef.value?.setServerErrors(err.response.data?.errors ?? {})
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
		<PageHeader title="Tambah Perusahaan" subtitle="Master data perusahaan / badan usaha" />
		<FormPerusahaan ref="formRef" :loading="saving" submit-label="Simpan Perusahaan" @submit="save" />
	</div>
</template>
