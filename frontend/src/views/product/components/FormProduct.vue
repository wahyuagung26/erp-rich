<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconTrash, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import Textarea from '@/components/base/Textarea.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import RadioGroup from '@/components/base/RadioGroup.vue'
import Button from '@/components/base/Button.vue'
import FileDrop from '@/components/base/FileDrop.vue'
import { useToast } from '@/composables/useToast'
import ProductVariants from '@/views/product/components/ProductVariants.vue'
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
	photo_url: props.initial?.photo_url ?? '',
	option_names: [...(props.initial?.option_names ?? [])],
	// Plain copies (§2: never structuredClone a reactive prop); a new product starts with only the default variant.
	variants: (props.initial?.variants ?? [{ sku: '', option_values: {}, is_default: true, is_active: true, selling_price: 0 }]).map((item) => ({
		id: 'id' in item ? item.id : undefined,
		sku: item.sku,
		option_values: { ...item.option_values },
		is_default: item.is_default,
		is_active: item.is_active,
		selling_price: item.selling_price
	}))
})

const isService = computed(() => form.type === 'service')
// Jasa has no size/colour and no stock: variants and Stok Minimal are hidden unless the product already has saved variants.
const hasSavedVariants = (props.initial?.option_names?.length ?? 0) > 0
const showVariants = computed(() => !isService.value || hasSavedVariants)
const variantMode = ref(hasSavedVariants)
const sellsPerVariant = computed(() => showVariants.value && variantMode.value)
const skuSummary = computed(() => {
	const sellable = form.variants.filter((item) => item.is_active).length
	return `${form.variants.length} SKU · ${sellable} aktif`
})

const errors = ref<Record<string, string>>({})
const variantsRef = ref<InstanceType<typeof ProductVariants>>()

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
const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

// ponytail: the photo is kept as a data URL; swap photo_url for a real upload endpoint when the backend lands.
function onPhotoPick(file: File | undefined) {
	if (!file) return
	if (!PHOTO_TYPES.includes(file.type)) return toast.error('Foto harus JPG, PNG, GIF, atau WEBP')
	if (file.size > MAX_PHOTO) return toast.error('Ukuran foto maksimal 2 MB')
	const reader = new FileReader()
	reader.onload = () => (form.photo_url = String(reader.result))
	reader.readAsDataURL(file)
}

// The request body: one Standar SKU at Harga Jual without variants; with variants Harga Jual mirrors the Standar price.
function payload(): ProductForm {
	const standar = form.variants.find((item) => item.is_default)!
	const variants = sellsPerVariant.value
		? form.variants.map((item) => ({ ...item, option_values: { ...item.option_values } }))
		: [{ ...standar, option_values: {}, is_active: true, selling_price: form.selling_price }]
	return {
		...form,
		min_stock: isService.value ? 0 : form.min_stock,
		selling_price: sellsPerVariant.value ? standar.selling_price : form.selling_price,
		option_names: sellsPerVariant.value ? [...form.option_names] : [],
		variants
	}
}

function onSubmit() {
	const body = payload()
	const variantError = sellsPerVariant.value ? variantsRef.value?.check() : null
	const found = validateProduct(body) ?? (variantError ? {} : null)
	if (found && variantError) found.variants = variantError
	errors.value = found ?? {}
	if (found) return toast.error('Periksa kembali isian yang ditandai merah')
	emit('submit', body)
}

// server-side errors (e.g. duplicate code) — parent calls this on a 422
function setServerErrors(serverErrors: Record<string, string[]>) {
	errors.value = { ...errors.value, ...Object.fromEntries(Object.entries(serverErrors).map(([k, msgs]) => [k, msgs[0]])) }
}
defineExpose({ setServerErrors })
</script>

<template>
	<!-- Left edge aligns with the breadcrumb / page title / list panel. -->
	<Panel>
		<form class="space-y-8" @submit.prevent="onSubmit">
			<section class="space-y-3">
				<h3 class="subhead">Informasi Produk</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
					<FormField
						label="Kode Produk"
						required
						:error="errors.code"
						:hint="isEdit ? undefined : 'Harus unik.'"
						:help="
							isEdit
								? 'Kode dikunci setelah data dibuat supaya transaksi yang sudah memakainya tidak berubah. Untuk memakai kode lain, buat data baru.'
								: undefined
						"
					>
						<Input v-model="form.code" mono :disabled="isEdit" placeholder="mis. PRD001" />
					</FormField>
					<FormField label="Nama Produk" required :error="errors.name">
						<Input v-model="form.name" placeholder="mis. Kulkas 2 Pintu" />
					</FormField>
					<FormField class="sm:col-span-2" label="Jenis Produk" required :error="errors.type">
						<RadioGroup v-model="form.type" inline :options="[...PRODUCT_TYPES]" />
					</FormField>
					<FormField class="sm:col-span-2" label="Keterangan" :error="errors.notes">
						<Textarea v-model="form.notes" :rows="2" placeholder="mis. spesifikasi singkat atau catatan gudang" />
					</FormField>
					<FormField class="sm:col-span-2" label="Foto Produk" :error="errors.photo_url">
						<div v-if="form.photo_url" class="flex items-center gap-4">
							<img :src="form.photo_url" alt="Foto produk" class="h-24 w-24 rounded-md bg-fill object-contain" />
							<Button type="button" size="sm" variant="subtle" @click="form.photo_url = ''"><IconTrash class="h-4 w-4" /> Hapus Foto</Button>
						</div>
						<FileDrop
							v-else
							class="max-w-md"
							accept="image/png,image/jpeg,image/gif,image/webp"
							hint="JPG, PNG, GIF, atau WEBP. Maksimal 2 MB."
							@update:model-value="onPhotoPick"
						/>
					</FormField>
				</div>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Klasifikasi</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
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
					<FormField class="sm:col-span-2" label="Satuan" required :error="errors.unit_id">
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

			<ProductVariants
				v-if="showVariants"
				ref="variantsRef"
				v-model:enabled="variantMode"
				v-model:option-names="form.option_names"
				v-model:variants="form.variants"
				:code="form.code"
				:base-price="form.selling_price"
				:product-id="initial?.id"
				:error="errors.variants"
			/>

			<section class="space-y-3">
				<h3 class="subhead">Harga &amp; Stok</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
					<FormField
						label="Harga Beli Terakhir"
						required
						:error="errors.last_purchase_price"
						:hint="sellsPerVariant ? 'Berlaku untuk semua varian produk ini.' : undefined"
					>
						<MoneyInput v-model="form.last_purchase_price" />
					</FormField>
					<FormField v-if="!sellsPerVariant" label="Harga Jual" required :error="errors.selling_price" hint="Sebelum pajak.">
						<MoneyInput v-model="form.selling_price" />
					</FormField>
					<FormField v-else label="Harga Jual">
						<p class="py-2 text-m text-ink-muted">Diatur per SKU di tabel Varian.</p>
					</FormField>
					<FormField v-if="isEdit" label="HPP Rata-rata" help="Dihitung otomatis dari transaksi pembelian, jadi tidak bisa diubah manual.">
						<MoneyInput :model-value="props.initial?.hpp_avg ?? 0" disabled />
					</FormField>
					<FormField
						v-if="!isService"
						:class="!isEdit && 'sm:col-span-2'"
						label="Stok Minimal"
						required
						:error="errors.min_stock"
						hint="Batas stok untuk peringatan restock."
					>
						<Input
							:model-value="form.min_stock"
							type="number"
							mono
							align="right"
							class="max-w-[200px]"
							:addon="initial?.unit_name"
							@update:model-value="(v) => (form.min_stock = Number(v))"
						/>
					</FormField>
				</div>
			</section>

			<!-- Sticky action bar: Simpan stays in reach however long the variant table gets. -->
			<div class="sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-panel px-4 py-3">
				<p class="text-s text-ink-muted">{{ sellsPerVariant ? skuSummary : '' }}</p>
				<div class="flex flex-wrap justify-end gap-2">
					<Button variant="secondary" type="button" @click="router.push('/product')"> <IconX class="h-4 w-4" /> Batal </Button>
					<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				</div>
			</div>
		</form>
	</Panel>
</template>
