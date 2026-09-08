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
import FormCustomer from '@/views/customer/components/FormCustomer.vue'
import type { Customer } from '@/utils/types'
import type { CustomerForm } from '@/views/customer/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const customer = ref<Customer>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormCustomer>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Customer }>(`/customer/${route.params.id}`)
		customer.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: CustomerForm) {
	saving.value = true
	try {
		await api.put(`/customer/${route.params.id}`, payload)
		toast.success('Customer diperbarui')
		router.push('/customer')
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
		<PageHeader title="Edit Customer" subtitle="Master data pelanggan" />
		<Panel v-if="loading" class="max-w-5xl"><Skeleton :lines="6" /></Panel>
		<Panel v-else-if="notFound || !customer" class="max-w-5xl">
			<EmptyState title="Customer tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/customer')">Kembali</Button>
			</div>
		</Panel>
		<FormCustomer v-else ref="formRef" :initial="customer" :code="customer.code" :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
