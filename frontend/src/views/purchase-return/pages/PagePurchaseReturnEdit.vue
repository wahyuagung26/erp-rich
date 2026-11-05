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
import FormPurchaseReturn from '@/views/purchase-return/components/FormPurchaseReturn.vue'
import { toPurchaseReturnDraft } from '@/views/purchase-return/mappers'
import type { PurchaseReturn, PurchaseReturnRequest } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const row = ref<PurchaseReturn>()
const loading = ref(true)
const saving = ref(false)
const notFound = ref(false)
const formRef = ref<InstanceType<typeof FormPurchaseReturn>>()
onMounted(async () => {
	try {
		const res = await api.get<{ data: PurchaseReturn }>(`/purchase-return/${route.params.id}`)
		row.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})
const blocked = computed(() => !row.value || row.value.approval_status === 'approved')
async function save(payload: PurchaseReturnRequest) {
	saving.value = true
	try {
		await api.put(`/purchase-return/${route.params.id}`, payload)
		toast.success('Retur pembelian diperbarui')
		router.push(`/purchase-return/${route.params.id}`)
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 422) {
				const errors = error.response.data?.errors
				if (errors) formRef.value?.setServerErrors(errors)
				else toast.error(error.response.data?.message ?? 'Retur pembelian tidak dapat diperbarui')
				return
			}
			toast.error(error.response?.data?.message ?? 'Retur pembelian tidak dapat diperbarui')
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
		<PageHeader title="Edit Retur Pembelian" subtitle="Pembelian"
			><template #actions
				><div class="flex flex-wrap items-center gap-2">
					<ApprovalBadge v-if="row" :status="row.approval_status" /><Button
						size="sm"
						variant="subtle"
						@click="router.push(row ? `/purchase-return/${row.id}` : '/purchase-return')"
						><IconArrowLeft class="h-4 w-4" /> Kembali</Button
					>
				</div></template
			></PageHeader
		>
		<Panel v-if="loading"><Skeleton :lines="8" /></Panel>
		<Panel v-else-if="notFound || !row"><EmptyState title="Retur pembelian tidak ditemukan" description="Data mungkin sudah dihapus." /></Panel>
		<Panel v-else-if="row?.locked"
			><EmptyState title="Retur pembelian tidak dapat diubah" description="Periode retur sudah closing, retur tidak bisa diubah." /></Panel
		><Panel v-else-if="blocked"
			><EmptyState
				title="Retur pembelian tidak dapat diubah"
				description="Retur yang sudah disetujui tidak boleh diubah. Batalkan persetujuan lebih dulu."
		/></Panel>
		<FormPurchaseReturn
			v-else
			ref="formRef"
			:initial="toPurchaseReturnDraft(row)"
			:initial-labels="{
				invoice: `${row.purchase_invoice_number} — ${row.supplier_name}`,
				warehouse: `${row.warehouse_code} — ${row.warehouse_name}`
			}"
			:reference="{
				supplierInvoice: row.supplier_invoice_number ?? '–',
				supplier: `${row.supplier_code} — ${row.supplier_name}`,
				department: `${row.department_code} — ${row.department_name}`,
				pkp: row.pkp_active
			}"
			:return-id="row.id"
			:transaction-number="row.number"
			:cancel-to="`/purchase-return/${row.id}`"
			:loading="saving"
			submit-label="Simpan Perubahan"
			@submit="save"
		/>
	</div>
</template>
