<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormChannel from '@/views/channel/components/FormChannel.vue'
import type { ChannelForm } from '@/views/channel/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormChannel>>()

async function save(payload: ChannelForm) {
	saving.value = true
	try {
		await api.post('/channel', payload)
		toast.success('Channel ditambahkan')
		router.push('/channel')
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
		<PageHeader title="Tambah Channel" subtitle="Master data channel penjualan" />
		<FormChannel ref="formRef" :loading="saving" submit-label="Simpan Channel" @submit="save" />
	</div>
</template>
