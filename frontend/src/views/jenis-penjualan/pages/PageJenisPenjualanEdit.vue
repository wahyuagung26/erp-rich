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
import FormJenisPenjualan from '@/views/jenis-penjualan/components/FormJenisPenjualan.vue'
import type { JenisPenjualan } from '@/utils/types'
import type { JenisPenjualanForm } from '@/views/jenis-penjualan/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const jenisPenjualan = ref<JenisPenjualan>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormJenisPenjualan>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: JenisPenjualan }>(`/jenis-penjualan/${route.params.id}`)
		jenisPenjualan.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: JenisPenjualanForm) {
	saving.value = true
	try {
		await api.put(`/jenis-penjualan/${route.params.id}`, payload)
		toast.success('Jenis penjualan diperbarui')
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
		<PageHeader title="Edit Jenis Penjualan" subtitle="Master data jenis penjualan" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !jenisPenjualan">
			<EmptyState title="Jenis penjualan tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/jenis-penjualan')">Kembali</Button>
			</div>
		</Panel>
		<FormJenisPenjualan v-else ref="formRef" :initial="jenisPenjualan" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
