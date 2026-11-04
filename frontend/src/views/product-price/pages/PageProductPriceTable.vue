<script setup lang="ts">
import { reactive } from 'vue'
import axios from 'axios'
import api from '@/utils/api'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import Input from '@/components/base/Input.vue'
import InlineEdit from '@/components/base/InlineEdit.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Table from '@/components/base/Table.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import type { Brand, Product, ProductCategory, TableRow } from '@/utils/types'

const toast = useToast()

// List reuses GET /product (see docs/product-price/index.md). Inline price edits
// go through PATCH /product/:id/price.
const { columns, pagination, loading, fetchList, handleSort, pageTo, applyFilters } = useTableList<Product>({
	endpoint: '/product',
	scopedToCompany: true
})

const filters = reactive({ q: '', brand_id: null as number | string | null, product_category_id: null as number | string | null })
const runSearch = useDebounce(() => applyFilters({ ...filters }), 250)
function onFilter<K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) {
	filters[key] = value
	runSearch()
}

const marginValue = (row: Product) => row.selling_price - row.hpp_avg
const marginPct = (row: Product) => (row.hpp_avg > 0 ? `${((marginValue(row) / row.hpp_avg) * 100).toFixed(2)}%` : '—')

// Each price saves on its own: send the row's current prices with the one field that changed.
async function save(row: Product, field: 'selling_price' | 'last_purchase_price', value: number) {
	if (!Number.isInteger(value) || value < 0) {
		toast.error('Harga harus bilangan bulat dan tidak negatif')
		return
	}
	try {
		await api.patch(`/product/${row.id}/price`, { selling_price: row.selling_price, last_purchase_price: row.last_purchase_price, [field]: value })
		toast.success(`Harga "${row.name}" diperbarui`)
		fetchList()
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) {
			toast.error(err.response.data?.message ?? 'Harga harus bilangan bulat dan tidak negatif')
		} else if (axios.isAxiosError(err) && err.response?.status === 404) {
			toast.error(err.response.data?.message ?? 'Produk tidak ditemukan')
		} else {
			toast.error('Harga produk gagal diperbarui')
		}
	}
}

// AsyncSelect isn't generic — type each picker's row here (same pattern as PageProductTable.vue).
const brandLabel = (item: Record<string, unknown>) => {
	const b = item as unknown as Brand
	return `${b.code} — ${b.name}`
}
const categoryLabel = (item: Record<string, unknown>) => {
	const c = item as unknown as ProductCategory
	return `${c.code} — ${c.name}`
}

const rows: TableRow[] = [
	{ label: 'Kode', field: 'code', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Produk', field: 'name', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'HPP Rata-rata', field: 'hpp_avg', align: 'right' },
	{ label: 'Harga Beli Sebelum Pajak', field: 'last_purchase_price', align: 'right' },
	{ label: 'Harga Jual Sebelum Pajak', field: 'selling_price', align: 'right' },
	{ label: 'Margin', field: 'margin', align: 'right' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Harga Produk" subtitle="Atur harga jual & harga beli produk langsung dari tabel" />

		<Panel>
			<FilterBar class="mb-3" :loading="loading" @refresh="runSearch">
				<Input :model-value="filters.q" placeholder="Cari kode / nama produk…" class="!w-64" @update:model-value="(v) => onFilter('q', v)" />
				<AsyncSelect
					:model-value="filters.brand_id"
					endpoint="/brand"
					:option-label="brandLabel"
					placeholder="Semua merk"
					class="!w-52"
					@update:model-value="(v) => onFilter('brand_id', v)"
				/>
				<AsyncSelect
					:model-value="filters.product_category_id"
					endpoint="/product-category"
					:option-label="categoryLabel"
					placeholder="Semua kategori"
					class="!w-52"
					@update:model-value="(v) => onFilter('product_category_id', v)"
				/>
			</FilterBar>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'code'" class="text-ink">{{ column.code }}</span>
					<span v-else-if="row.field === 'name'" class="text-ink">{{ column.name }}</span>
					<span v-else-if="row.field === 'hpp_avg'"><Amount :value="column.hpp_avg as number" muted /></span>
					<InlineEdit
						v-else-if="row.field === 'last_purchase_price' || row.field === 'selling_price'"
						kind="money"
						:label="`${row.label} ${column.name}`"
						:model-value="column[row.field] as number"
						@save="(v) => save(column as unknown as Product, row.field as 'selling_price' | 'last_purchase_price', v as number)"
					>
						<Amount :value="column[row.field] as number" />
					</InlineEdit>
					<span v-else-if="row.field === 'margin'" class="whitespace-nowrap">
						<Amount :value="marginValue(column as unknown as Product)" />
						<span class="ml-1 text-s text-ink-subtle">{{ marginPct(column as unknown as Product) }}</span>
					</span>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>

			<div class="mt-3">
				<TablePagination :pagination="pagination" @page-to="pageTo" />
			</div>
		</Panel>
	</div>
</template>
