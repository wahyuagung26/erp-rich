<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconPlus, IconEye, IconPencil, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Button from '@/components/base/Button.vue'
import Table from '@/components/base/Table.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import { PRODUCT_TYPES } from '@/views/product/schema'
import type { Product, ProductCategory, TableRow } from '@/utils/types'

const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<Product>({
	endpoint: '/product',
	scopedToCompany: true
})

const q = ref('')
const type = ref('')
const productCategoryId = ref<number | string | null>(null)
const runSearch = useDebounce(() => applyFilters({ q: q.value, type: type.value, product_category_id: productCategoryId.value }), 250)

function onCategoryChange(v: number | string | null) {
	productCategoryId.value = v
	runSearch()
}

// AsyncSelect isn't generic (see its own comment) — typed here, same pattern as FormProduct.vue.
const categoryLabel = (item: Record<string, unknown>) => {
	const c = item as unknown as ProductCategory
	return `${c.code} — ${c.name}`
}

const rows: TableRow[] = [
	{ label: 'Kode', field: 'code', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Nama Produk', field: 'name', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Jenis', field: 'type', align: 'left' },
	{ label: 'Kategori Produk', field: 'product_category_name', align: 'left' },
	{ label: 'Satuan', field: 'unit_name', align: 'left' },
	{ label: 'Harga Jual', field: 'selling_price', align: 'right' },
	{ label: '', field: 'action', align: 'right' }
]

const typeLabel = (v: string) => PRODUCT_TYPES.find((t) => t.value === v)?.label ?? v

function remove(row: Product) {
	ask({ title: 'Hapus produk', message: `Hapus "${row.code} — ${row.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/product/${row.id}`)
		toast.success('Produk dihapus')
		fetchList()
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Produk" subtitle="Master data produk">
			<template #actions>
				<Button size="sm" @click="router.push('/product/tambah')"> <IconPlus class="h-4 w-4" /> Tambah Produk </Button>
			</template>
		</PageHeader>

		<Panel>
			<FilterBar class="mb-3" :loading="loading" @refresh="runSearch">
				<Input v-model="q" placeholder="Cari kode / nama…" class="!w-64" @update:model-value="runSearch" />
				<Select v-model="type" class="!w-44" placeholder="Semua jenis" :options="[...PRODUCT_TYPES]" @update:model-value="runSearch" />
				<AsyncSelect
					:model-value="productCategoryId"
					endpoint="/product-category"
					:option-label="categoryLabel"
					placeholder="Semua kategori"
					class="!w-52"
					@update:model-value="onCategoryChange"
				/>
			</FilterBar>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column }">
					<button v-if="row.field === 'code'" class="text-primary-dark hover:underline" @click="router.push(`/product/${column.id}`)">
						{{ column.code }}
					</button>
					<span v-else-if="row.field === 'type'">{{ typeLabel(column.type as string) }}</span>
					<span v-else-if="row.field === 'selling_price'"><Amount :value="column.selling_price as number" /></span>
					<div v-else-if="row.field === 'action'" class="flex justify-end gap-1">
						<button class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill" @click="router.push(`/product/${column.id}`)">
							<IconEye class="h-4 w-4" />
						</button>
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-fill"
							@click="router.push(`/product/edit/${column.id}`)"
						>
							<IconPencil class="h-4 w-4" />
						</button>
						<button
							class="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
							@click="remove(column as unknown as Product)"
						>
							<IconTrash class="h-4 w-4" />
						</button>
					</div>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>

			<div class="mt-3">
				<TablePagination :pagination="pagination" @page-to="pageTo" />
			</div>
		</Panel>
	</div>
</template>
