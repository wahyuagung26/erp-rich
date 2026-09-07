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
import FormSales from '@/views/sales/components/FormSales.vue'
import type { Sales } from '@/utils/types'
import type { SalesForm } from '@/views/sales/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const sales = ref<Sales>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSales>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Sales }>(`/sales/${route.params.id}`)
		sales.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: SalesForm) {
	saving.value = true
	try {
		await api.put(`/sales/${route.params.id}`, payload)
		toast.success('Sales diperbarui')
		router.push('/sales')
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
		<PageHeader title="Edit Sales" subtitle="Master data sales" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !sales">
			<EmptyState title="Sales tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/sales')">Kembali</Button>
			</div>
		</Panel>
		<FormSales v-else ref="formRef" :initial="sales" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
