<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ApprovalBadge from '@/components/common/ApprovalBadge.vue'
import FormSalesOrder from '@/views/sales-order/components/FormSalesOrder.vue'
import { toSalesOrderDraft } from '@/views/sales-order/mappers'
import type { SalesOrder, SalesOrderRequest } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const order = ref<SalesOrder>()
const loading = ref(true)
const saving = ref(false)
const notFound = ref(false)
const formRef = ref<InstanceType<typeof FormSalesOrder>>()
onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: SalesOrder }>(`/sales-order/${route.params.id}`)
		order.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}
const blocked = computed(() => !order.value || order.value.approval_status === 'approved')
async function save(payload: SalesOrderRequest) {
	if (saving.value) return
	saving.value = true
	try {
		await api.put(`/sales-order/${route.params.id}`, payload)
		toast.success('Sales order diperbarui')
		router.push(`/sales-order/${route.params.id}`)
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 422 && error.response.data?.errors) {
			formRef.value?.setServerErrors(error.response.data.errors)
			toast.error('Data belum tersimpan. Periksa isian yang ditandai merah.')
			return
		}
		toast.error(errorMessage(error, 'Sales order tidak dapat diperbarui'))
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Edit Sales Order" subtitle="Penjualan"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<ApprovalBadge v-if="order" :status="order.approval_status" /><Button
						size="sm"
						variant="subtle"
						@click="router.push(order ? `/sales-order/${order.id}` : '/sales-order')"
						><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="8" /></Panel
		><Panel v-else-if="notFound || !order"><EmptyState title="Sales order tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel
		><Panel v-else-if="order.locked"
			><EmptyState title="Sales order tidak dapat diubah" description="Periode sales order sudah closing, sales order tidak bisa diubah." /></Panel
		><Panel v-else-if="blocked"
			><EmptyState
				title="Sales order tidak dapat diubah"
				description="Sales order yang sudah disetujui tidak boleh diubah. Batalkan persetujuan dulu bila belum dibuatkan invoice."
		/></Panel>
		<FormSalesOrder
			v-else
			ref="formRef"
			:initial="toSalesOrderDraft(order)"
			:initial-labels="{
				customer: `${order.customer_code} — ${order.customer_name}`,
				sales: `${order.sales_code} — ${order.sales_name}`,
				department: `${order.department_code} — ${order.department_name}`
			}"
			:transaction-number="order.number"
			:loading="saving"
			submit-label="Simpan Perubahan"
			@submit="save"
		/>
	</div>
</template>
