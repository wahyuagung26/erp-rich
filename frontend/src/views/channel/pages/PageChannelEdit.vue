<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import FormChannel from '@/views/channel/components/FormChannel.vue'
import type { Channel } from '@/utils/types'
import type { ChannelForm } from '@/views/channel/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const channel = ref<Channel>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormChannel>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Channel }>(`/channel/${route.params.id}`)
		channel.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: ChannelForm) {
	saving.value = true
	try {
		await api.put(`/channel/${route.params.id}`, payload)
		toast.success('Channel diperbarui')
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
		<PageHeader title="Edit Channel" subtitle="Master data channel penjualan" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !channel">
			<EmptyState title="Channel tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/channel')">Kembali</Button>
			</div>
		</Panel>
		<FormChannel v-else ref="formRef" :initial="channel" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
