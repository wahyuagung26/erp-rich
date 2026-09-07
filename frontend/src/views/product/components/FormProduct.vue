<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import RadioGroup from '@/components/base/RadioGroup.vue'
import Button from '@/components/base/Button.vue'
import { useToast } from '@/composables/useToast'
import { validateProduct, PRODUCT_TYPES, type ProductForm } from '@/views/product/schema'
import type { Brand, Product, ProductCategory, SalesType, Supplier, Unit } from '@/utils/types'

const props = defineProps<{ initial?: Partial<Product>; isEdit?: boolean; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [ProductForm] }>()

const router = useRouter()
const toast = useToast()

const form = reactive<ProductForm>({
	code: props.initial?.code ?? '',
	name: props.initial?.name ?? '',
	type: props.initial?.type ?? 'finished_good',
	brand_id: props.initial?.brand_id ?? 0,
	product_category_id: props.initial?.product_category_id ?? 0,
	sales_type_id: props.initial?.sales_type_id ?? 0,
	supplier_id: props.initial?.supplier_id ?? 0,
	unit_id: props.initial?.unit_id ?? 0,
	min_stock: props.initial?.min_stock ?? 0,
	notes: props.initial?.notes ?? '',
	last_purchase_price: props.initial?.last_purchase_price ?? 0,
	selling_price: props.initial?.selling_price ?? 0,
	photo_url: props.initial?.photo_url ?? ''
})

const errors = ref<Record<string, string>>({})

// Already-denormalized on the entity (see docs/product/) — no resolve-by-id fetch needed on edit.
const initialBrandLabel = props.initial?.brand_code ? `${props.initial.brand_code} — ${props.initial.brand_name}` : undefined
const initialCategoryLabel = props.initial?.product_category_code
	? `${props.initial.product_category_code} — ${props.initial.product_category_name}`
	: undefined
const initialSalesTypeLabel = props.initial?.sales_type_code ? `${props.initial.sales_type_code} — ${props.initial.sales_type_name}` : undefined
const initialSupplierLabel = props.initial?.supplier_code ? `${props.initial.supplier_code} — ${props.initial.supplier_name}` : undefined
const initialUnitLabel = props.initial?.unit_code ? `${props.initial.unit_code} — ${props.initial.unit_name}` : undefined

// AsyncSelect isn't generic (see its own comment) — type each picker's row here instead.
const brandLabel = (item: Record<string, unknown>) => {
	const b = item as unknown as Brand
	return `${b.code} — ${b.name}`
}
const categoryLabel = (item: Record<string, unknown>) => {
	const c = item as unknown as ProductCategory
	return `${c.code} — ${c.name}`
}
const salesTypeLabel = (item: Record<string, unknown>) => {
	const s = item as unknown as SalesType
	return `${s.code} — ${s.name}`
}
const supplierLabel = (item: Record<string, unknown>) => {
	const s = item as unknown as Supplier
	return `${s.code} — ${s.name}`
}
const unitLabel = (item: Record<string, unknown>) => {
	const u = item as unknown as Unit
	return `${u.code} — ${u.name}`
}

const MAX_PHOTO = 2 * 1024 * 1024

// ponytail: no FileUpload base component exists; raw input + FileReader to a data
// URL is the whole feature. Swap photo_url for a real upload endpoint when the backend lands.
function onPhotoPick(e: Event) {
	const file = (e.target as HTMLInputElement).files?.[0]
	if (!file) return
	if (file.size > MAX_PHOTO) {
		toast.error('Ukuran foto maksimal 2 MB')
		;(e.target as HTMLInputElement).value = ''
		return
	}
	const reader = new FileReader()
	reader.onload = () => (form.photo_url = String(reader.result))
	reader.readAsDataURL(file)
}

function onSubmit() {
	const found = validateProduct(form)
	errors.value = found ?? {}
	if (!found) emit('submit', { ...form })
}

// server-side errors (e.g. duplicate code) — parent calls this on a 422
function setServerErrors(serverErrors: Record<string, string[]>) {
	errors.value = { ...errors.value, ...Object.fromEntries(Object.entries(serverErrors).map(([k, msgs]) => [k, msgs[0]])) }
}
defineExpose({ setServerErrors })
</script>

<template>
	<!-- Left edge aligns with the breadcrumb / page title / list panel. -->
	<Panel class="max-w-5xl">
		<form class="space-y-8" @submit.prevent="onSubmit">
			<section class="space-y-3">
				<h3 class="subhead">Informasi Produk</h3>
				<div class="grid grid-cols-2 gap-x-5 gap-y-4">
					<FormField label="Kode Produk" required :error="errors.code" :hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : 'Harus unik.'">
						<Input v-model="form.code" mono :disabled="isEdit" placeholder="mis. PRD001" />
					</FormField>
					<FormField label="Nama Produk" required :error="errors.name">
						<Input v-model="form.name" placeholder="mis. Kulkas 2 Pintu" />
					</FormField>
					<FormField class="col-span-2" label="Jenis Produk" required :error="errors.type">
						<RadioGroup v-model="form.type" inline :options="[...PRODUCT_TYPES]" />
					</FormField>
					<FormField class="col-span-2" label="Foto Produk" :error="errors.photo_url" hint="JPG, PNG, GIF, atau WEBP. Maksimal 2 MB.">
						<div class="flex items-center gap-3">
							<img v-if="form.photo_url" :src="form.photo_url" alt="Foto produk" class="h-14 w-14 rounded-md object-contain" />
							<div v-else class="grid h-14 w-14 place-items-center rounded-md bg-fill text-xs text-ink-subtle">Foto</div>
							<input
								type="file"
								accept="image/png,image/jpeg,image/gif,image/webp"
								class="text-s text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-fill file:px-3 file:py-1.5 file:text-s file:text-ink"
								@change="onPhotoPick"
							/>
							<button v-if="form.photo_url" type="button" class="text-s text-danger hover:underline" @click="form.photo_url = ''">Hapus</button>
						</div>
					</FormField>
				</div>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Klasifikasi</h3>
				<div class="grid grid-cols-2 gap-x-5 gap-y-4">
					<FormField label="Merk" required :error="errors.brand_id">
						<AsyncSelect
							:model-value="form.brand_id || null"
							endpoint="/brand"
							:option-label="brandLabel"
							:initial-label="initialBrandLabel"
							placeholder="Cari merk…"
							@update:model-value="(v) => (form.brand_id = Number(v))"
						/>
					</FormField>
					<FormField label="Kategori Produk" required :error="errors.product_category_id">
						<AsyncSelect
							:model-value="form.product_category_id || null"
							endpoint="/product-category"
							:option-label="categoryLabel"
							:initial-label="initialCategoryLabel"
							placeholder="Cari kategori produk…"
							@update:model-value="(v) => (form.product_category_id = Number(v))"
						/>
					</FormField>
					<FormField label="Jenis Penjualan" required :error="errors.sales_type_id">
						<AsyncSelect
							:model-value="form.sales_type_id || null"
							endpoint="/sales-type"
							:option-label="salesTypeLabel"
							:initial-label="initialSalesTypeLabel"
							placeholder="Cari jenis penjualan…"
							@update:model-value="(v) => (form.sales_type_id = Number(v))"
						/>
					</FormField>
					<FormField label="Supplier Utama" required :error="errors.supplier_id">
						<AsyncSelect
							:model-value="form.supplier_id || null"
							endpoint="/supplier"
							:option-label="supplierLabel"
							:initial-label="initialSupplierLabel"
							placeholder="Cari supplier utama…"
							@update:model-value="(v) => (form.supplier_id = Number(v))"
						/>
					</FormField>
					<FormField class="col-span-2" label="Satuan" required :error="errors.unit_id">
						<AsyncSelect
							:model-value="form.unit_id || null"
							endpoint="/unit"
							:option-label="unitLabel"
							:initial-label="initialUnitLabel"
							class="max-w-xs"
							placeholder="Cari satuan…"
							@update:model-value="(v) => (form.unit_id = Number(v))"
						/>
					</FormField>
				</div>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Stok &amp; Harga</h3>
				<div class="grid grid-cols-2 gap-x-5 gap-y-4">
					<FormField class="col-span-2" label="Stok Minimal" required :error="errors.min_stock" hint="Batas stok minimal untuk peringatan restock.">
						<Input
							:model-value="form.min_stock"
							type="number"
							mono
							align="right"
							class="max-w-[200px]"
							@update:model-value="(v) => (form.min_stock = Number(v))"
						/>
					</FormField>
					<FormField label="Harga Beli Terakhir (Rp)" required :error="errors.last_purchase_price" hint="Angka saja, tanpa titik/koma.">
						<Input
							:model-value="form.last_purchase_price"
							type="number"
							mono
							align="right"
							@update:model-value="(v) => (form.last_purchase_price = Number(v))"
						/>
					</FormField>
					<FormField label="Harga Jual (Rp)" required :error="errors.selling_price" hint="Angka saja, tanpa titik/koma.">
						<Input :model-value="form.selling_price" type="number" mono align="right" @update:model-value="(v) => (form.selling_price = Number(v))" />
					</FormField>
					<FormField class="col-span-2" label="HPP Rata-rata (Rp)" hint="Dihitung otomatis dari transaksi pembelian. Tidak bisa diubah manual.">
						<Input :model-value="props.initial?.hpp_avg ?? 0" type="number" mono align="right" disabled class="max-w-[240px]" />
					</FormField>
					<FormField class="col-span-2" label="Keterangan" :error="errors.notes">
						<Textarea v-model="form.notes" :rows="2" placeholder="Keterangan produk" />
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/product')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
