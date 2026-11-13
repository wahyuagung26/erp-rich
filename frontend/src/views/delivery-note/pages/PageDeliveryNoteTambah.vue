<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import FormDeliveryNote from '@/views/delivery-note/components/FormDeliveryNote.vue'
import type { DeliveryNoteRequest } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormDeliveryNote>>()
const presetInvoiceId = Number(route.query.sales_invoice_id) || null

async function save(payload: DeliveryNoteRequest) {
	if (saving.value) return
	saving.value = true
	try {
		await api.post('/delivery-note', payload)
		toast.success('Surat jalan ditambahkan')
		router.push('/delivery-note')
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 422 && error.response.data?.errors) {
			formRef.value?.setServerErrors(error.response.data.errors)
			toast.error('Data belum tersimpan. Periksa isian yang ditandai merah.')
			return
		}
		toast.error(errorMessage(error, 'Surat jalan tidak dapat disimpan'))
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Tambah Surat Jalan" subtitle="Penjualan" /><FormDeliveryNote
			ref="formRef"
			:loading="saving"
			:preset-invoice-id="presetInvoiceId"
			@submit="save"
		/>
	</div>
</template>
