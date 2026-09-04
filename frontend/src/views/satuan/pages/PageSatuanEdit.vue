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
import FormSatuan from '@/views/satuan/components/FormSatuan.vue'
import type { Satuan } from '@/utils/types'
import type { SatuanForm } from '@/views/satuan/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const satuan = ref<Satuan>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSatuan>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Satuan }>(`/satuan/${route.params.id}`)
		satuan.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: SatuanForm) {
	saving.value = true
	try {
		await api.put(`/satuan/${route.params.id}`, payload)
		toast.success('Satuan diperbarui')
		router.push('/satuan')
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
		<PageHeader title="Edit Satuan" subtitle="Master data satuan produk" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !satuan">
			<EmptyState title="Satuan tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/satuan')">Kembali</Button>
			</div>
		</Panel>
		<FormSatuan v-else ref="formRef" :initial="satuan" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
