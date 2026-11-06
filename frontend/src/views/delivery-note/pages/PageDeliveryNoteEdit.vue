<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import FormDeliveryNote from '@/views/delivery-note/components/FormDeliveryNote.vue'
import { toDeliveryNoteDraft } from '@/views/delivery-note/mappers'
import type { DeliveryNote, DeliveryNoteRequest } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const note = ref<DeliveryNote>()
const loading = ref(true)
const saving = ref(false)
const notFound = ref(false)
const formRef = ref<InstanceType<typeof FormDeliveryNote>>()
onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: DeliveryNote }>(`/delivery-note/${route.params.id}`)
		note.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}
async function save(payload: DeliveryNoteRequest) {
	saving.value = true
	try {
		await api.put(`/delivery-note/${route.params.id}`, payload)
		toast.success('Surat jalan diperbarui')
		router.push(`/delivery-note/${route.params.id}`)
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 422 && error.response.data?.errors) {
				formRef.value?.setServerErrors(error.response.data.errors)
				return
			}
			toast.error(error.response?.data?.message ?? 'Surat jalan tidak dapat diperbarui')
			return
		}
		throw error
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Edit Surat Jalan" subtitle="Penjualan"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<Button size="sm" variant="subtle" @click="router.push(note ? `/delivery-note/${note.id}` : '/delivery-note')"
						><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="8" /></Panel
		><Panel v-else-if="notFound || !note"><EmptyState title="Surat jalan tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel
		><FormDeliveryNote
			v-else
			ref="formRef"
			:initial="toDeliveryNoteDraft(note)"
			:initial-invoice-label="`${note.sales_invoice_number} — ${note.customer_name}`"
			:invoice-reference="{
				number: note.sales_invoice_number ?? '',
				date: note.sales_invoice_date ?? '',
				customerLabel: `${note.customer_code} — ${note.customer_name}`,
				departmentLabel: `${note.department_code} — ${note.department_name}`
			}"
			invoice-locked
			:transaction-number="note.number"
			:loading="saving"
			submit-label="Simpan Perubahan"
			@submit="save"
		/>
	</div>
</template>
