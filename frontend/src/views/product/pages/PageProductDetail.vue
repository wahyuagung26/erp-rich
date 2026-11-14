<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconArrowLeft, IconPencil, IconTrash } from '@tabler/icons-vue'
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

const dash = (v: string) => v || '–'
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
				<section class="space-y-3">
					<h3 class="subhead">Informasi Produk</h3>
					<dl class="grid grid-cols-[110px_1fr] sm:grid-cols-[180px_1fr] gap-x-4 gap-y-2.5 text-m">
						<dt class="text-ink-muted">Kode Produk</dt>
						<dd class="text-ink">{{ product.code }}</dd>
						<template v-if="!product.option_names.length">
							<dt class="text-ink-muted">SKU</dt>
							<dd class="text-ink">{{ product.variants[0]?.sku ?? product.code }}</dd>
						</template>
						<dt class="text-ink-muted">Nama Produk</dt>
						<dd class="text-ink">{{ product.name }}</dd>
						<dt class="text-ink-muted">Jenis Produk</dt>
						<dd class="text-ink">{{ typeLabel(product.type) }}</dd>
						<dt class="text-ink-muted">Merk</dt>
						<dd class="text-ink">{{ product.brand_code }} — {{ product.brand_name }}</dd>
						<dt class="text-ink-muted">Kategori Produk</dt>
						<dd class="text-ink">{{ product.product_category_code }} — {{ product.product_category_name }}</dd>
						<dt class="text-ink-muted">Jenis Penjualan</dt>
						<dd class="text-ink">{{ product.sales_type_code }} — {{ product.sales_type_name }}</dd>
						<dt class="text-ink-muted">Supplier Utama</dt>
						<dd class="text-ink">{{ product.supplier_code }} — {{ product.supplier_name }}</dd>
						<dt class="text-ink-muted">Satuan</dt>
						<dd class="text-ink">{{ product.unit_code }} — {{ product.unit_name }}</dd>
						<dt class="text-ink-muted">Stok Minimal</dt>
						<dd class="text-ink">{{ product.min_stock }}</dd>
						<dt class="text-ink-muted">Keterangan</dt>
						<dd class="whitespace-pre-line text-ink">{{ dash(product.notes) }}</dd>
					</dl>
				</section>

				<section v-if="product.option_names.length" class="space-y-3">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<h3 class="subhead">Varian</h3>
						<p class="text-s text-ink-muted">
							{{ product.variants.length }} SKU · {{ product.variants.filter((variant) => variant.is_active).length }} aktif
						</p>
					</div>
					<div class="overflow-x-auto">
						<table class="w-full text-m">
							<thead>
								<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
									<th v-for="name in product.option_names" :key="name" class="px-3 py-2">{{ name }}</th>
									<th class="px-3 py-2">SKU</th>
									<th class="px-3 py-2 text-right">Harga Jual</th>
									<th class="w-28 px-3 py-2">Status</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="variant in product.variants" :key="variant.id" class="border-b border-hairline last:border-0">
									<td v-if="variant.is_default" :colspan="product.option_names.length" class="px-3 py-2.5"><Badge>Standar</Badge></td>
									<template v-else>
										<td v-for="name in product.option_names" :key="name" class="px-3 py-2.5 text-ink">{{ variant.option_values[name] }}</td>
									</template>
									<td class="px-3 py-2.5 text-ink">{{ variant.sku }}</td>
									<td class="px-3 py-2.5 text-right"><Amount :value="variant.selling_price" /></td>
									<td class="px-3 py-2.5">
										<Badge :tone="variant.is_active ? 'success' : 'neutral'">{{ variant.is_active ? 'Aktif' : 'Nonaktif' }}</Badge>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Harga</h3>
					<dl class="grid grid-cols-[110px_1fr] sm:grid-cols-[180px_1fr] gap-x-4 gap-y-2.5 text-m">
						<dt class="text-ink-muted">Harga Beli Terakhir</dt>
						<dd class="text-ink"><Amount :value="product.last_purchase_price" /></dd>
						<template v-if="!product.option_names.length">
							<dt class="text-ink-muted">Harga Jual</dt>
							<dd class="text-ink"><Amount :value="product.selling_price" /></dd>
						</template>
						<dt class="text-ink-muted">HPP Rata-rata</dt>
						<dd class="text-ink"><Amount :value="product.hpp_avg" /></dd>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Foto Produk</h3>
					<img v-if="product.photo_url" :src="product.photo_url" alt="Foto produk" class="h-32 w-32 rounded-md object-contain" />
					<div v-else class="grid h-32 w-32 place-items-center rounded-md bg-fill text-xs text-ink-subtle">Tidak ada foto</div>
				</section>
			</div>
		</Panel>
	</div>
</template>
