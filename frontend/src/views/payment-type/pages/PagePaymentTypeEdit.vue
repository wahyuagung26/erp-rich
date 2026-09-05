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
import FormPaymentType from '@/views/payment-type/components/FormPaymentType.vue'
import type { PaymentType } from '@/utils/types'
import type { PaymentTypeForm } from '@/views/payment-type/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const paymentType = ref<PaymentType>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormPaymentType>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: PaymentType }>(`/payment-type/${route.params.id}`)
		paymentType.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: PaymentTypeForm) {
	saving.value = true
	try {
		await api.put(`/payment-type/${route.params.id}`, payload)
		toast.success('Tipe pembayaran diperbarui')
		router.push('/payment-type')
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
		<PageHeader title="Edit Tipe Pembayaran" subtitle="Master data tipe pembayaran" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !paymentType">
			<EmptyState title="Tipe pembayaran tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/payment-type')">Kembali</Button>
			</div>
		</Panel>
		<FormPaymentType v-else ref="formRef" :initial="paymentType" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
