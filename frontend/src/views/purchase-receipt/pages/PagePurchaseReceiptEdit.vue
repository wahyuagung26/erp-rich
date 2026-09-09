<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
import Badge from '@/components/base/Badge.vue'
import FormPurchaseReceipt from '@/views/purchase-receipt/components/FormPurchaseReceipt.vue'
import { invoiceStatusLabel, invoiceStatusTone } from '@/views/purchase-receipt/schema'
import { toPurchaseReceiptDraft } from '@/views/purchase-receipt/mappers'
import type { PurchaseReceipt, PurchaseReceiptRequest } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const receipt = ref<PurchaseReceipt>()
const loading = ref(true)
const saving = ref(false)
const notFound = ref(false)
const formRef = ref<InstanceType<typeof FormPurchaseReceipt>>()
onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: PurchaseReceipt }>(`/purchase-receipt/${route.params.id}`)
		receipt.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}
const blocked = computed(() => !receipt.value || receipt.value.invoice_status === 'invoiced')
async function save(payload: PurchaseReceiptRequest) {
	saving.value = true
	try {
		await api.put(`/purchase-receipt/${route.params.id}`, payload)
		toast.success('Penerimaan pembelian diperbarui')
		router.push(`/purchase-receipt/${route.params.id}`)
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 422) {
				const errors = error.response.data?.errors
				if (errors) formRef.value?.setServerErrors(errors)
				else toast.error(error.response.data?.message ?? 'Penerimaan pembelian tidak dapat diperbarui')
				return
			}
			toast.error(error.response?.data?.message ?? 'Penerimaan pembelian tidak dapat diperbarui')
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
		<PageHeader title="Edit Penerimaan Pembelian" subtitle="Pembelian"
			><template #actions
				><div class="flex items-center gap-2">
					<Badge v-if="receipt" :tone="invoiceStatusTone[receipt.invoice_status]">{{ invoiceStatusLabel[receipt.invoice_status] }}</Badge
					><Button size="sm" variant="subtle" @click="router.push(receipt ? `/purchase-receipt/${receipt.id}` : '/purchase-receipt')"
						><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="8" /></Panel
		><Panel v-else-if="notFound || !receipt"
			><EmptyState title="Penerimaan pembelian tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel
		><Panel v-else-if="blocked"
			><EmptyState title="Penerimaan pembelian tidak dapat diubah" description="Penerimaan yang sudah dibuat invoice tidak boleh diubah." /></Panel
		><FormPurchaseReceipt
			v-else
			ref="formRef"
			:initial="toPurchaseReceiptDraft(receipt)"
			:initial-labels="{
				purchaseOrder: `${receipt.purchase_order_number} — ${receipt.supplier_name}`,
				department: `${receipt.department_code} — ${receipt.department_name}`
			}"
			:po-reference="{
				date: receipt.purchase_order_date ?? '',
				description: receipt.purchase_order_description ?? '',
				supplierLabel: `${receipt.supplier_code} — ${receipt.supplier_name}`
			}"
			po-locked
			:transaction-number="receipt.number"
			:invoice-status="receipt.invoice_status"
			:loading="saving"
			submit-label="Simpan Perubahan"
			@submit="save"
		/>
	</div>
</template>
