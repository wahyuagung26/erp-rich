<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import FormSubAccount from '@/views/sub-account/components/FormSubAccount.vue'
import type { SubAccountForm } from '@/views/sub-account/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSubAccount>>()

async function save(payload: SubAccountForm) {
	if (saving.value) return
	saving.value = true
	try {
		await api.post('/sub-account', payload)
		toast.success('Sub akun ditambahkan')
		router.push('/sub-account')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) {
			const errors = err.response.data?.errors
			if (errors) {
				formRef.value?.setServerErrors(errors)
				toast.error('Data belum tersimpan. Periksa isian yang ditandai merah.')
			} else toast.error(err.response.data?.message ?? 'Pilih perusahaan aktif terlebih dahulu')
			return
		}
		toast.error(errorMessage(err))
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Tambah Sub Akun" subtitle="Master data sub akun" />
		<FormSubAccount ref="formRef" :loading="saving" submit-label="Simpan Sub Akun" @submit="save" />
	</div>
</template>
