<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconArrowLeft, IconPencil, IconPhoto, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import Amount from '@/components/base/Amount.vue'
import Badge from '@/components/base/Badge.vue'
import { PRODUCT_TYPES } from '@/views/product/schema'
import type { Product } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const product = ref<Product>()
// An inactive "tanpa varian" SKU is not sold anymore (and is hidden on new variant products), so the table leaves it out.
const shownVariants = computed(() => product.value?.variants.filter((variant) => !variant.is_default || variant.is_active) ?? [])
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: Product }>(`/product/${route.params.id}`)
		product.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

const hasVariants = computed(() => (product.value?.option_names.length ?? 0) > 0)
// A product without variants sells through one SKU; it is shown only when it differs from the code.
const singleSku = computed(() => (hasVariants.value ? '' : (product.value?.variants[0]?.sku ?? '')))
const classification = computed(() => {
	const p = product.value
	if (!p) return []
	return [
		{ label: 'Merk', value: `${p.brand_code} — ${p.brand_name}` },
		{ label: 'Kategori Produk', value: `${p.product_category_code} — ${p.product_category_name}` },
		{ label: 'Jenis Penjualan', value: `${p.sales_type_code} — ${p.sales_type_name}` },
		{ label: 'Supplier Utama', value: `${p.supplier_code} — ${p.supplier_name}` },
		{ label: 'Satuan', value: `${p.unit_code} — ${p.unit_name}` }
	]
})
// Margin over the product's HPP (same formula as the Harga Produk screen).
const margin = (price: number) => price - (product.value?.hpp_avg ?? 0)
const marginPct = (price: number) => {
	const hpp = product.value?.hpp_avg ?? 0
	return hpp > 0 ? `${((margin(price) / hpp) * 100).toFixed(2)}%` : '—'
}
const typeLabel = (v: string) => PRODUCT_TYPES.find((t) => t.value === v)?.label ?? v

function remove() {
	const p = product.value
	if (!p) return
	ask({ title: 'Hapus produk', message: `Hapus "${p.code} — ${p.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/product/${p.id}`)
		toast.success('Produk dihapus')
		router.push('/product')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Produk" subtitle="Master data produk">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/product')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="product">
						<Button size="sm" @click="router.push(`/product/edit/${product.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="8" /></Panel>

		<Panel v-else-if="notFound || !product">
			<EmptyState title="Produk tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<div class="space-y-8">
				<!-- Identity first, same order as the form: photo beside code / name / type, Keterangan under them. -->
				<section class="space-y-3">
					<h3 class="subhead">Informasi Produk</h3>
					<div class="flex flex-col gap-5 sm:flex-row sm:items-start">
						<img v-if="product.photo_url" :src="product.photo_url" alt="Foto produk" class="h-24 w-24 shrink-0 rounded-md bg-fill object-contain" />
						<div v-else class="grid h-24 w-24 shrink-0 place-items-center rounded-md bg-fill text-ink-subtle" title="Belum ada foto">
							<IconPhoto class="h-8 w-8" />
						</div>
						<div class="min-w-0 flex-1 space-y-2">
							<h2 class="text-heading-s font-semibold text-ink">{{ product.name }}</h2>
							<p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-m text-ink-muted">
								<span>{{ product.code }}</span>
								<Badge tone="primary">{{ typeLabel(product.type) }}</Badge>
								<span v-if="singleSku && singleSku !== product.code">SKU {{ singleSku }}</span>
							</p>
							<dl v-if="product.notes">
								<dt class="text-s text-ink-muted">Keterangan</dt>
								<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ product.notes }}</dd>
							</dl>
						</div>
					</div>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Klasifikasi</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div v-for="item in classification" :key="item.label">
							<dt class="text-s text-ink-muted">{{ item.label }}</dt>
							<dd class="mt-1 text-m text-ink">{{ item.value }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Harga &amp; Stok</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Harga Beli Terakhir</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="product.last_purchase_price" /></dd>
						</div>
						<div v-if="!hasVariants">
							<dt class="text-s text-ink-muted">Harga Jual</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="product.selling_price" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">HPP Rata-rata</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="product.hpp_avg" /></dd>
						</div>
						<div v-if="!hasVariants">
							<dt class="text-s text-ink-muted">Margin</dt>
							<dd class="mt-1 whitespace-nowrap text-m text-ink">
								<Amount :value="margin(product.selling_price)" />
								<span class="ml-1 text-s text-ink-muted">{{ marginPct(product.selling_price) }}</span>
							</dd>
						</div>
						<div v-if="product.type !== 'service'">
							<dt class="text-s text-ink-muted">Stok Minimal</dt>
							<dd class="mt-1 text-m text-ink">{{ product.min_stock }} {{ product.unit_name }}</dd>
						</div>
					</dl>
				</section>

				<section v-if="hasVariants" class="space-y-3">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<h3 class="subhead">Varian</h3>
						<p class="text-s text-ink-muted">
							{{ shownVariants.length }} SKU · {{ shownVariants.filter((variant) => variant.is_active).length }} aktif
						</p>
					</div>
					<div class="overflow-x-auto">
						<table class="w-full text-m">
							<thead>
								<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
									<th v-for="name in product.option_names" :key="name" class="px-3 py-2">{{ name }}</th>
									<th class="px-3 py-2">SKU</th>
									<th class="px-3 py-2 text-right">Harga Jual</th>
									<th class="px-3 py-2 text-right">Margin</th>
									<th class="w-28 px-3 py-2">Status</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="variant in shownVariants" :key="variant.id" class="border-b border-hairline last:border-0">
									<td v-if="variant.is_default" :colspan="product.option_names.length" class="px-3 py-2.5"><Badge>Tanpa varian</Badge></td>
									<template v-else>
										<td v-for="name in product.option_names" :key="name" class="px-3 py-2.5 text-ink">{{ variant.option_values[name] }}</td>
									</template>
									<td class="px-3 py-2.5 text-ink">{{ variant.sku }}</td>
									<td class="px-3 py-2.5 text-right"><Amount :value="variant.selling_price" /></td>
									<td class="whitespace-nowrap px-3 py-2.5 text-right">
										<Amount :value="margin(variant.selling_price)" />
										<span class="ml-1 text-s text-ink-muted">{{ marginPct(variant.selling_price) }}</span>
									</td>
									<td class="px-3 py-2.5">
										<Badge :tone="variant.is_active ? 'success' : 'neutral'">{{ variant.is_active ? 'Aktif' : 'Nonaktif' }}</Badge>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</Panel>
	</div>
</template>
