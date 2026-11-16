<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useTableList } from '@/composables/useTableList'
import { useDebounce } from '@/composables/useDebounce'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import FilterBar from '@/components/base/FilterBar.vue'
import FormField from '@/components/base/FormField.vue'
import AdvancedFilter from '@/components/common/AdvancedFilter.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Badge from '@/components/base/Badge.vue'
import Table from '@/components/base/Table.vue'
import TablePagination from '@/components/base/TablePagination.vue'
import Amount from '@/components/base/Amount.vue'
import { number } from '@/utils/format'
import type { Brand, PriceListRow, ProductCategory, TableRow, Warehouse } from '@/utils/types'

// Read-only list: prices are edited in Master → Harga Produk (docs/price-list/).
const { columns, pagination, loading, handleSort, pageTo, applyFilters } = useTableList<PriceListRow>({
	endpoint: '/price-list',
	scopedToCompany: true
})

const filters = reactive({
	q: '',
	price_status: '',
	brand_id: null as number | string | null,
	product_category_id: null as number | string | null,
	warehouse_id: null as number | string | null
})
const runSearch = useDebounce(() => applyFilters({ ...filters }), 250)

// Filters beyond the toolbar's 3 controls live in the Filter Lanjutan drawer; the badge counts the active ones.
const advancedCount = computed(() => (filters.warehouse_id ? 1 : 0) + (filters.price_status ? 1 : 0))
function resetAdvanced() {
	filters.warehouse_id = null
	filters.price_status = ''
	runSearch()
}
function onFilter<K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) {
	filters[key] = value
	runSearch()
}

// AsyncSelect isn't generic — type each picker's row here (same pattern as PageProductPriceTable.vue).
const brandLabel = (item: Record<string, unknown>) => {
	const b = item as unknown as Brand
	return `${b.code} — ${b.name}`
}
const categoryLabel = (item: Record<string, unknown>) => {
	const c = item as unknown as ProductCategory
	return `${c.code} — ${c.name}`
}
const warehouseLabel = (item: Record<string, unknown>) => {
	const w = item as unknown as Warehouse
	return `${w.code} — ${w.name}`
}

const rows: TableRow[] = [
	{ label: 'Kode', field: 'code', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Produk', field: 'name', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Merk / Kategori', field: 'brand', align: 'left' },
	{ label: 'Satuan', field: 'unit_name', align: 'left' },
	{ label: 'Harga Jual Sebelum Pajak', field: 'selling_price', align: 'right', isSort: { activeSort: 'asc' } },
	{ label: 'Stok Tersedia', field: 'stock_qty', align: 'right', isSort: { activeSort: 'asc' } }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Daftar Harga" subtitle="Harga jual dan stok tersedia produk — acuan sales saat membuat Sales Order atau Invoice" />

		<Panel>
			<FilterBar class="mb-3" :loading="loading" @refresh="runSearch">
				<Input :model-value="filters.q" placeholder="Cari kode / nama produk…" class="!w-56" @update:model-value="(v) => onFilter('q', v)" />
				<AsyncSelect
					:model-value="filters.brand_id"
					endpoint="/brand"
					:option-label="brandLabel"
					placeholder="Semua merk"
					class="!w-48"
					@update:model-value="(v) => onFilter('brand_id', v)"
				/>
				<AsyncSelect
					:model-value="filters.product_category_id"
					endpoint="/product-category"
					:option-label="categoryLabel"
					placeholder="Semua kategori"
					class="!w-48"
					@update:model-value="(v) => onFilter('product_category_id', v)"
				/>
				<AdvancedFilter :count="advancedCount" @reset="resetAdvanced">
					<FormField label="Gudang">
						<AsyncSelect
							:model-value="filters.warehouse_id"
							endpoint="/warehouse"
							:option-label="warehouseLabel"
							placeholder="Semua gudang"
							@update:model-value="(v) => onFilter('warehouse_id', v)"
						/>
					</FormField>
					<FormField label="Status Harga">
						<Select
							:model-value="filters.price_status"
							placeholder="Semua harga"
							:options="[{ label: 'Harga belum diset', value: 'unset' }]"
							@update:model-value="(v) => onFilter('price_status', v)"
						/>
					</FormField>
				</AdvancedFilter>
			</FilterBar>

			<Table :rows="rows" :columns="columns as unknown as Record<string, unknown>[]" :loading="loading" @handle-sort="handleSort">
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'code'" class="whitespace-nowrap text-ink">{{ column.code }}</span>
					<span v-else-if="row.field === 'name'" class="text-ink">{{ column.name }}</span>
					<div v-else-if="row.field === 'brand'" class="leading-snug">
						<p class="text-ink">{{ column.brand_name }}</p>
						<p class="text-s text-ink-muted">{{ column.product_category_name }}</p>
					</div>
					<span v-else-if="row.field === 'selling_price'" class="whitespace-nowrap">
						<Badge v-if="!column.has_price" tone="warning">Harga belum diset</Badge>
						<template v-else>
							<Amount :value="column.selling_price as number" />
							<template v-if="column.selling_price_max !== column.selling_price"> – <Amount :value="column.selling_price_max as number" /></template>
						</template>
					</span>
					<span v-else-if="row.field === 'stock_qty'" class="inline-flex items-center justify-end gap-2 whitespace-nowrap">
						<Badge v-if="column.stock_warning === 'empty'" tone="danger">Stok habis</Badge>
						<Badge v-else-if="column.stock_warning === 'low'" tone="warning">Di bawah minimum</Badge>
						<span v-if="column.stock_qty === null" class="text-ink-subtle">—</span>
						<span v-else class="tnum text-ink">{{ number(column.stock_qty as number) }}</span>
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
