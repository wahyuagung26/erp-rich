<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormDepartemen from '@/views/departemen/components/FormDepartemen.vue'
import type { DepartemenForm } from '@/views/departemen/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormDepartemen>>()

async function save(payload: DepartemenForm) {
	saving.value = true
	try {
		await api.post('/departemen', payload)
		toast.success('Departemen ditambahkan')
		router.push('/departemen')
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
		<PageHeader title="Tambah Departemen" subtitle="Master data departemen" />
		<FormDepartemen ref="formRef" :loading="saving" submit-label="Simpan Departemen" @submit="save" />
	</div>
</template>
