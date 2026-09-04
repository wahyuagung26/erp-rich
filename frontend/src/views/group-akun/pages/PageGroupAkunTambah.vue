<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormGroupAkun from '@/views/group-akun/components/FormGroupAkun.vue'
import type { GroupAkunForm } from '@/views/group-akun/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormGroupAkun>>()

async function save(payload: GroupAkunForm) {
	saving.value = true
	try {
		await api.post('/group-akun', payload)
		toast.success('Group akun ditambahkan')
		router.push('/group-akun')
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
		<PageHeader title="Tambah Group Akun" subtitle="Master data group akun" />
		<FormGroupAkun ref="formRef" :loading="saving" submit-label="Simpan Group Akun" @submit="save" />
	</div>
</template>
