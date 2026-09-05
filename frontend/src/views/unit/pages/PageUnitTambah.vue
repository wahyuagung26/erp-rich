<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormUnit from '@/views/unit/components/FormUnit.vue'
import type { UnitForm } from '@/views/unit/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormUnit>>()

async function save(payload: UnitForm) {
	saving.value = true
	try {
		await api.post('/unit', payload)
		toast.success('Satuan ditambahkan')
		router.push('/unit')
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
		<FormUnit ref="formRef" :loading="saving" submit-label="Simpan Satuan" @submit="save" />
	</div>
</template>
