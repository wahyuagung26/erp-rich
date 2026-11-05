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
import FormPurchaseInvoice from '@/views/purchase-invoice/components/FormPurchaseInvoice.vue'
import { approvalStatusLabel, approvalStatusTone } from '@/views/purchase-invoice/schema'
import { toPurchaseInvoiceDraft } from '@/views/purchase-invoice/mappers'
import type { PurchaseInvoice, PurchaseInvoiceRequest } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const invoice = ref<PurchaseInvoice>()
const loading = ref(true)
const saving = ref(false)
const notFound = ref(false)
const formRef = ref<InstanceType<typeof FormPurchaseInvoice>>()
onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: PurchaseInvoice }>(`/purchase-invoice/${route.params.id}`)
		invoice.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}
const blocked = computed(() => !invoice.value || invoice.value.approval_status === 'approved')
async function save(payload: PurchaseInvoiceRequest) {
	saving.value = true
	try {
		await api.put(`/purchase-invoice/${route.params.id}`, payload)
		toast.success('Invoice pembelian diperbarui')
		router.push(`/purchase-invoice/${route.params.id}`)
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 422) {
				const errors = error.response.data?.errors
				if (errors) formRef.value?.setServerErrors(errors)
				else toast.error(error.response.data?.message ?? 'Invoice pembelian tidak dapat diperbarui')
				return
			}
			toast.error(error.response?.data?.message ?? 'Invoice pembelian tidak dapat diperbarui')
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
		<PageHeader title="Edit Invoice Pembelian" subtitle="Pembelian"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<Badge v-if="invoice" :tone="approvalStatusTone[invoice.approval_status]">{{ approvalStatusLabel[invoice.approval_status] }}</Badge
					><Button size="sm" variant="subtle" @click="router.push(invoice ? `/purchase-invoice/${invoice.id}` : '/purchase-invoice')"
						><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="8" /></Panel
		><Panel v-else-if="notFound || !invoice"><EmptyState title="Invoice pembelian tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel
		><Panel v-else-if="blocked"
			><EmptyState title="Invoice pembelian tidak dapat diubah" description="Invoice yang sudah disetujui tidak boleh diubah." /></Panel
		><FormPurchaseInvoice
			v-else
			ref="formRef"
			:initial="toPurchaseInvoiceDraft(invoice)"
			:initial-labels="{ receipt: `${invoice.purchase_receipt_number} — ${invoice.supplier_name}` }"
			:reference="{
				purchaseOrder: invoice.purchase_order_number ?? '–',
				supplier: `${invoice.supplier_code} — ${invoice.supplier_name}`,
				department: `${invoice.department_code} — ${invoice.department_name}`,
				pkp: invoice.pkp_active
			}"
			receipt-locked
			:transaction-number="invoice.number"
			:loading="saving"
			submit-label="Simpan Perubahan"
			@submit="save"
		/>
	</div>
</template>
