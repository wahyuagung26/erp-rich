<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import FormPaymentType from '@/views/payment-type/components/FormPaymentType.vue'
import type { PaymentTypeForm } from '@/views/payment-type/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormPaymentType>>()

async function save(payload: PaymentTypeForm) {
	if (saving.value) return
	saving.value = true
	try {
		await api.post('/payment-type', payload)
		toast.success('Tipe pembayaran ditambahkan')
		router.push('/payment-type')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) {
			const errors = err.response.data?.errors
			if (errors) {
				formRef.value?.setServerErrors(errors)
				toast.error('Data belum tersimpan. Periksa isian yang ditandai merah.')
			} else toast.error(err.response.data?.message ?? 'Pilih perusahaan aktif terlebih dahulu')
			return
		}
		toast.error(errorMessage(err))
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Tambah Tipe Pembayaran" subtitle="Master data tipe pembayaran" />
		<FormPaymentType ref="formRef" :loading="saving" submit-label="Simpan Tipe Pembayaran" @submit="save" />
	</div>
</template>
