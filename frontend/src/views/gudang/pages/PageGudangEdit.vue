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
import FormGudang from '@/views/gudang/components/FormGudang.vue'
import type { Gudang } from '@/utils/types'
import type { GudangForm } from '@/views/gudang/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const gudang = ref<Gudang>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormGudang>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Gudang }>(`/gudang/${route.params.id}`)
		gudang.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: GudangForm) {
	saving.value = true
	try {
		await api.put(`/gudang/${route.params.id}`, payload)
		toast.success('Gudang diperbarui')
		router.push('/gudang')
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
		<PageHeader title="Edit Gudang" subtitle="Master data gudang" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !gudang">
			<EmptyState title="Gudang tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/gudang')">Kembali</Button>
			</div>
		</Panel>
		<FormGudang v-else ref="formRef" :initial="gudang" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
