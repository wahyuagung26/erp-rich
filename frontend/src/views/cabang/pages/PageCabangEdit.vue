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
import FormCabang from '@/views/cabang/components/FormCabang.vue'
import type { Cabang } from '@/utils/types'
import type { CabangForm } from '@/views/cabang/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const cabang = ref<Cabang>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormCabang>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Cabang }>(`/cabang/${route.params.id}`)
		cabang.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: CabangForm) {
	saving.value = true
	try {
		await api.put(`/cabang/${route.params.id}`, payload)
		toast.success('Cabang diperbarui')
		router.push('/cabang')
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
		<PageHeader title="Edit Cabang" subtitle="Master data cabang perusahaan" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !cabang">
			<EmptyState title="Cabang tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/cabang')">Kembali</Button>
			</div>
		</Panel>
		<FormCabang v-else ref="formRef" :initial="cabang" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
