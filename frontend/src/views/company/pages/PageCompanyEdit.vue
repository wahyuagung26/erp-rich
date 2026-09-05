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
import FormCompany from '@/views/company/components/FormCompany.vue'
import type { Company } from '@/utils/types'
import type { CompanyForm } from '@/views/company/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const company = ref<Company>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormCompany>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Company }>(`/company/${route.params.id}`)
		company.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: CompanyForm) {
	saving.value = true
	try {
		await api.put(`/company/${route.params.id}`, payload)
		toast.success('Perusahaan diperbarui')
		router.push('/company')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) {
			formRef.value?.setServerErrors(err.response.data?.errors ?? {})
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
		<PageHeader title="Edit Perusahaan" subtitle="Master data company / badan usaha" />
		<Panel v-if="loading" class="max-w-5xl"><Skeleton :lines="6" /></Panel>
		<Panel v-else-if="notFound || !company" class="max-w-5xl">
			<EmptyState title="Perusahaan tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/company')">Kembali</Button>
			</div>
		</Panel>
		<FormPerusahaan v-else ref="formRef" :initial="company" :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
