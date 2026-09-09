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
import FormPurchaseOrder from '@/views/purchase-order/components/FormPurchaseOrder.vue'
import { approvalStatusLabel, approvalStatusTone } from '@/views/purchase-order/schema'
import { toPurchaseOrderDraft } from '@/views/purchase-order/mappers'
import type { PurchaseOrder, PurchaseOrderRequest } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const order = ref<PurchaseOrder>()
const loading = ref(true)
const saving = ref(false)
const notFound = ref(false)
const formRef = ref<InstanceType<typeof FormPurchaseOrder>>()
onMounted(load)
async function load() {
	try {
		const res = await api.get<{ data: PurchaseOrder }>(`/purchase-order/${route.params.id}`)
		order.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}
const blocked = computed(() => !order.value || order.value.approval_status === 'approved' || order.value.delivery_status !== 'not_received')
async function save(payload: PurchaseOrderRequest) {
	saving.value = true
	try {
		await api.put(`/purchase-order/${route.params.id}`, payload)
		toast.success('Order pembelian diperbarui')
		router.push(`/purchase-order/${route.params.id}`)
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 422) {
			formRef.value?.setServerErrors(error.response.data?.errors ?? {})
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
		<PageHeader title="Edit Order Pembelian" subtitle="Pembelian"
			><template #actions
				><div class="flex items-center gap-2">
					<Badge v-if="order" :tone="approvalStatusTone[order.approval_status]">{{ approvalStatusLabel[order.approval_status] }}</Badge
					><Button size="sm" variant="subtle" @click="router.push(order ? `/purchase-order/${order.id}` : '/purchase-order')"
						><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					>
				</div></template
			></PageHeader
		><Panel v-if="loading"><Skeleton :lines="8" /></Panel
		><Panel v-else-if="notFound || !order"><EmptyState title="Order pembelian tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel
		><Panel v-else-if="blocked"
			><EmptyState
				title="Order pembelian tidak dapat diubah"
				description="PO yang disetujui atau sudah memiliki penerimaan barang tidak boleh diubah." /></Panel
		><FormPurchaseOrder
			v-else
			ref="formRef"
			:initial="toPurchaseOrderDraft(order)"
			:initial-labels="{
				supplier: `${order.supplier_code} — ${order.supplier_name}`,
				department: `${order.department_code} — ${order.department_name}`,
				warehouse: `${order.warehouse_code} — ${order.warehouse_name}`
			}"
			:transaction-number="order.number"
			:loading="saving"
			submit-label="Simpan Perubahan"
			@submit="save"
		/>
	</div>
</template>
