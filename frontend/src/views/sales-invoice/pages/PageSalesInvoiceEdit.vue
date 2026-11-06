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
import ApprovalBadge from '@/components/common/ApprovalBadge.vue'
import FormSalesInvoice from '@/views/sales-invoice/components/FormSalesInvoice.vue'
import { toSalesInvoiceDraft } from '@/views/sales-invoice/mappers'
import type { SalesInvoice, SalesInvoiceRequest } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const invoice = ref<SalesInvoice>()
const loading = ref(true)
const saving = ref(false)
const notFound = ref(false)
const formRef = ref<InstanceType<typeof FormSalesInvoice>>()
onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: SalesInvoice }>(`/sales-invoice/${route.params.id}`)
		invoice.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}
const blocked = computed(() => !invoice.value || invoice.value.approval_status === 'approved')
async function save(payload: SalesInvoiceRequest) {
	saving.value = true
	try {
		await api.put(`/sales-invoice/${route.params.id}`, payload)
		toast.success('Invoice penjualan diperbarui')
		router.push(`/sales-invoice/${route.params.id}`)
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 422) {
				const errors = error.response.data?.errors
				if (errors) formRef.value?.setServerErrors(errors)
				else toast.error(error.response.data?.message ?? 'Invoice penjualan tidak dapat diperbarui')
				return
			}
			toast.error(error.response?.data?.message ?? 'Invoice penjualan tidak dapat diperbarui')
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
		<PageHeader title="Edit Invoice Penjualan" subtitle="Penjualan"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<ApprovalBadge v-if="invoice" :status="invoice.approval_status" /><Button
						size="sm"
						variant="subtle"
						@click="router.push(invoice ? `/sales-invoice/${invoice.id}` : '/sales-invoice')"
						><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="8" /></Panel
		><Panel v-else-if="notFound || !invoice"><EmptyState title="Invoice penjualan tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel
		><Panel v-else-if="invoice.locked"
			><EmptyState title="Invoice penjualan tidak dapat diubah" description="Periode invoice sudah closing, invoice tidak bisa diubah." /></Panel
		><Panel v-else-if="blocked"
			><EmptyState title="Invoice penjualan tidak dapat diubah" description="Invoice yang sudah disetujui tidak boleh diubah." /></Panel
		><FormSalesInvoice
			v-else
			ref="formRef"
			:initial="toSalesInvoiceDraft(invoice)"
			:initial-labels="{
				customer: `${invoice.customer_code} — ${invoice.customer_name}`,
				sales: `${invoice.sales_code} — ${invoice.sales_name}`,
				department: `${invoice.department_code} — ${invoice.department_name}`,
				salesOrder: invoice.sales_order_number ?? undefined
			}"
			:transaction-number="invoice.number"
			:loading="saving"
			submit-label="Simpan Perubahan"
			@submit="save"
		/>
	</div>
</template>
