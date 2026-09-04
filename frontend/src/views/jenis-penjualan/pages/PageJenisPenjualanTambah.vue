<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormJenisPenjualan from '@/views/jenis-penjualan/components/FormJenisPenjualan.vue'
import type { JenisPenjualanForm } from '@/views/jenis-penjualan/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormJenisPenjualan>>()

async function save(payload: JenisPenjualanForm) {
	saving.value = true
	try {
		await api.post('/jenis-penjualan', payload)
		toast.success('Jenis penjualan ditambahkan')
		router.push('/jenis-penjualan')
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
		<PageHeader title="Tambah Jenis Penjualan" subtitle="Master data jenis penjualan" />
		<FormJenisPenjualan ref="formRef" :loading="saving" submit-label="Simpan Jenis Penjualan" @submit="save" />
	</div>
</template>
