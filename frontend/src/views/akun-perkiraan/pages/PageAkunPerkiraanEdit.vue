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
import FormAkunPerkiraan from '@/views/akun-perkiraan/components/FormAkunPerkiraan.vue'
import type { AkunPerkiraan } from '@/utils/types'
import type { AkunPerkiraanForm } from '@/views/akun-perkiraan/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const akunPerkiraan = ref<AkunPerkiraan>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormAkunPerkiraan>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: AkunPerkiraan }>(`/akun-perkiraan/${route.params.id}`)
		akunPerkiraan.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: AkunPerkiraanForm) {
	saving.value = true
	try {
		await api.put(`/akun-perkiraan/${route.params.id}`, payload)
		toast.success('Akun perkiraan diperbarui')
		router.push('/akun-perkiraan')
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
		<PageHeader title="Edit Akun Perkiraan" subtitle="Master data akun perkiraan" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !akunPerkiraan">
			<EmptyState title="Akun perkiraan tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/akun-perkiraan')">Kembali</Button>
			</div>
		</Panel>
		<FormAkunPerkiraan v-else ref="formRef" :initial="akunPerkiraan" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
