<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormCabang from '@/views/cabang/components/FormCabang.vue'
import type { CabangForm } from '@/views/cabang/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormCabang>>()

async function save(payload: CabangForm) {
	saving.value = true
	try {
		await api.post('/cabang', payload)
		toast.success('Cabang ditambahkan')
		router.push('/cabang')
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
		<PageHeader title="Tambah Cabang" subtitle="Master data cabang perusahaan" />
		<FormCabang ref="formRef" :loading="saving" submit-label="Simpan Cabang" @submit="save" />
	</div>
</template>
