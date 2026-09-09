<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { IconEye, IconPencil, IconPlus, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import Table from '@/components/base/Table.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import {
	approvalOptions,
	approvalStatusLabel,
	approvalStatusTone,
	deliveryOptions,
	deliveryStatusLabel,
	deliveryStatusTone,
	limitOptions,
	searchFieldOptions,
	sortFieldOptions,
	sortOrderOptions
} from '@/views/purchase-order/schema'
import type { PurchaseOrder, PurchaseOrderApprovalStatus, PurchaseOrderDeliveryStatus, TableRow } from '@/utils/types'

const router = useRouter()
const { columns, pagination, loading, limit, fetchList, pageTo, applyFilters } = useTableList<PurchaseOrder>({
	endpoint: '/purchase-order',
	defaultLimit: 20
})
const { ask } = useConfirm()
const toast = useToast()
const field = ref('')
const q = ref('')
const productQ = ref('')
const approvalStatus = ref('')
const deliveryStatus = ref('')
const sortBy = ref('date')
const sortOrder = ref('desc')
const limitSel = ref('20')

function applyAll() {
	applyFilters({
		field: field.value,
		q: q.value,
		product_q: productQ.value,
		approval_status: approvalStatus.value,
		delivery_status: deliveryStatus.value,
		sort_by: sortBy.value,
		sort_order: sortOrder.value
	})
}
const runSearch = useDebounce(applyAll, 250)
function onLimitChange() {
	pageTo({ limit: limitSel.value === 'all' ? 9999 : Number(limitSel.value) })
}
function canWrite(row: PurchaseOrder) {
	return row.approval_status !== 'approved' && row.delivery_status === 'not_received'
}
function remove(row: PurchaseOrder) {
	ask({ title: 'Hapus order pembelian', message: `Hapus order pembelian “${row.number}”?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/purchase-order/${row.id}`)
			toast.success('Order pembelian dihapus')
			fetchList()
		} catch (error) {
			if (axios.isAxiosError(error)) toast.error(error.response?.data?.message ?? 'Order pembelian tidak dapat dihapus')
			else toast.error('Order pembelian tidak dapat dihapus')
		}
	})
}

const rows: TableRow[] = [
	{ label: 'No', field: 'no' },
	{ label: 'Nomor', field: 'number' },
	{ label: 'Tanggal', field: 'date' },
	{ label: 'Departemen', field: 'department_name' },
	{ label: 'Pembuat', field: 'created_by' },
	{ label: 'Supplier', field: 'supplier_name' },
	{ label: 'Keterangan', field: 'description' },
	{ label: 'Total', field: 'total', align: 'right' },
	{ label: 'Status Barang', field: 'delivery_status' },
	{ label: 'Status', field: 'approval_status' },
	{ label: '', field: 'action', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Order Pembelian" subtitle="Pembelian"
			><template #actions
				><Button size="sm" @click="router.push('/purchase-order/tambah')"><IconPlus class="h-4 w-4" /> Tambah</Button></template
			></PageHeader
		>
		<Panel>
			<FilterBar class="mb-3" :loading="loading" @refresh="applyAll">
				<Select v-model="field" :options="searchFieldOptions" class="!w-44" @update:model-value="applyAll" />
				<Input v-model="q" placeholder="Cari…" class="!w-52" @update:model-value="runSearch" />
				<Input v-model="productQ" placeholder="Cari produk/merk…" class="!w-52" @update:model-value="runSearch" />
				<Select v-model="approvalStatus" :options="approvalOptions" class="!w-52" @update:model-value="applyAll" />
				<Select v-model="deliveryStatus" :options="deliveryOptions" class="!w-48" @update:model-value="applyAll" />
				<Select v-model="sortBy" :options="sortFieldOptions" class="!w-40" @update:model-value="applyAll" />
				<Select v-model="sortOrder" :options="sortOrderOptions" class="!w-32" @update:model-value="applyAll" />
				<Select v-model="limitSel" :options="limitOptions" class="!w-36" @update:model-value="onLimitChange" />
			</FilterBar>
			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading">
				<template #table-content="{ row, column, rowIndex }">
					<span v-if="row.field === 'no'" class="font-mono tnum text-ink-muted">{{
						((pagination?.page ?? 1) - 1) * (pagination?.per_page ?? 20) + rowIndex + 1
					}}</span>
					<button v-else-if="row.field === 'number'" class="text-primary-dark hover:underline" @click="router.push(`/purchase-order/${column.id}`)">
						{{ column.number }}
					</button>
					<span v-else-if="row.field === 'date'" class="font-mono tnum text-ink-muted">{{ date(column.date as string) }}</span>
					<span v-else-if="row.field === 'department_name'">{{ column.department_code }} — {{ column.department_name }}</span>
					<span v-else-if="row.field === 'supplier_name'">{{ column.supplier_code }} — {{ column.supplier_name }}</span>
					<span v-else-if="row.field === 'description'" class="text-ink-muted">{{ column.description || '–' }}</span>
					<Amount v-else-if="row.field === 'total'" :value="column.total as number" />
					<Badge v-else-if="row.field === 'delivery_status'" :tone="deliveryStatusTone[column.delivery_status as PurchaseOrderDeliveryStatus]">{{
						deliveryStatusLabel[column.delivery_status as PurchaseOrderDeliveryStatus]
					}}</Badge>
					<Badge v-else-if="row.field === 'approval_status'" :tone="approvalStatusTone[column.approval_status as PurchaseOrderApprovalStatus]">{{
						approvalStatusLabel[column.approval_status as PurchaseOrderApprovalStatus]
					}}</Badge>
					<div v-else-if="row.field === 'action'" class="flex justify-end gap-1">
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
							title="Lihat detail"
							@click="router.push(`/purchase-order/${column.id}`)"
						>
							<IconEye class="h-4 w-4" /></button
						><template v-if="canWrite(column as unknown as PurchaseOrder)"
							><button
								class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
								title="Edit order pembelian"
								@click="router.push(`/purchase-order/edit/${column.id}`)"
							>
								<IconPencil class="h-4 w-4" /></button
							><button
								class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
								title="Hapus order pembelian"
								@click="remove(column as unknown as PurchaseOrder)"
							>
								<IconTrash class="h-4 w-4" /></button
						></template>
					</div>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<div class="mt-3"><TablePagination :pagination="pagination" :limit-options="[limit]" @page-to="pageTo" /></div>
		</Panel>
	</div>
</template>
