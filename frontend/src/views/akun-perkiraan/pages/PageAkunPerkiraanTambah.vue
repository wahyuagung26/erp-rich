<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormAkunPerkiraan from '@/views/akun-perkiraan/components/FormAkunPerkiraan.vue'
import type { AkunPerkiraanForm } from '@/views/akun-perkiraan/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormAkunPerkiraan>>()

async function save(payload: AkunPerkiraanForm) {
	saving.value = true
	try {
		await api.post('/akun-perkiraan', payload)
		toast.success('Akun perkiraan ditambahkan')
		router.push('/akun-perkiraan')
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
		<PageHeader title="Tambah Akun Perkiraan" subtitle="Master data akun perkiraan" />
		<FormAkunPerkiraan ref="formRef" :loading="saving" submit-label="Simpan Akun Perkiraan" @submit="save" />
	</div>
</template>
