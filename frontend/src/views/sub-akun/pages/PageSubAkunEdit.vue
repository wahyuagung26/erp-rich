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
import FormSubAkun from '@/views/sub-akun/components/FormSubAkun.vue'
import type { SubAkun } from '@/utils/types'
import type { SubAkunForm } from '@/views/sub-akun/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const subAkun = ref<SubAkun>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSubAkun>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: SubAkun }>(`/sub-akun/${route.params.id}`)
		subAkun.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: SubAkunForm) {
	saving.value = true
	try {
		await api.put(`/sub-akun/${route.params.id}`, payload)
		toast.success('Sub akun diperbarui')
		router.push('/sub-akun')
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
		<PageHeader title="Edit Sub Akun" subtitle="Master data sub akun" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !subAkun">
			<EmptyState title="Sub akun tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/sub-akun')">Kembali</Button>
			</div>
		</Panel>
		<FormSubAkun v-else ref="formRef" :initial="subAkun" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
