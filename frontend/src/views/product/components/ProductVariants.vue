<script setup lang="ts">
import { computed, onMounted, reactive, ref, useId, watch } from 'vue'
import { IconAlertTriangle, IconPlus, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import HelpTip from '@/components/base/HelpTip.vue'
import Input from '@/components/base/Input.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import TagInput from '@/components/base/TagInput.vue'
import Switch from '@/components/base/Switch.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import type { ApiList, ProductVariantAttribute, ProductVariantOption } from '@/utils/types'
import type { ProductForm } from '@/views/product/schema'

// Variant editor: attributes (name + chip values) generate every combination as a SKU row with its own price;
// the default "Standar" variant is always kept. Without variants the product sells through Standar at `basePrice`.
type VariantDraft = ProductForm['variants'][number]
interface Row {
	key: string
	id?: number
	sku: string
	values: string[] // positional, one per complete attribute; [] for Standar
	price: number
	is_active: boolean
	auto: boolean // SKU still follows the suggestion (not typed by the user)
}

const props = defineProps<{ code: string; basePrice: number; productId?: number; error?: string }>()
const optionNames = defineModel<string[]>('optionNames', { required: true })
const variants = defineModel<VariantDraft[]>('variants', { required: true })
const enabled = defineModel<boolean>('enabled', { required: true })

const MAX_ATTRS = 3
const DEFAULT_KEY = '__default'
const LOCKED_HELP =
	'Varian produk ini sudah tersimpan, jadi pilihan varian dan nama atribut tidak bisa diubah. Nilai baru tetap bisa ditambah; nonaktifkan varian yang tidak dijual lagi.'
const keyOf = (values: string[]) => values.map((v) => v.toLowerCase()).join('\u0001')
// No code yet → no SKU: a value-only SKU ("S-MERAH") would clash with other products.
const suggest = (values: string[]) => (props.code.trim() ? [props.code.trim(), ...values].join('-').toUpperCase().replace(/\s+/g, '') : '')

const stored = variants.value.filter((v) => !v.is_default)
const storedDefault = variants.value.find((v) => v.is_default)
const defaultRow = reactive<Row>({
	key: DEFAULT_KEY,
	id: storedDefault?.id,
	sku: storedDefault?.sku ?? '',
	values: [],
	price: storedDefault?.selling_price ?? props.basePrice,
	is_active: storedDefault?.is_active ?? true,
	auto: false
})
const attrs = ref(optionNames.value.map((name) => ({ name, values: [...new Set(stored.map((v) => v.option_values[name]).filter(Boolean))] })))
const savedRows: Row[] = stored.map((v) => {
	const values = optionNames.value.map((name) => v.option_values[name] ?? '')
	return { key: keyOf(values), id: v.id, sku: v.sku, values, price: v.selling_price, is_active: v.is_active, auto: false }
})
const rows = ref<Row[]>(savedRows.map((r) => ({ ...r, values: [...r.values] })))
// Saved variants freeze the attribute structure (add/remove/turn off) — their option values are keyed by it.
const hasSaved = savedRows.length > 0

const complete = computed(() => attrs.value.filter((a) => a.name.trim() && a.values.length))
const allRows = computed(() => [defaultRow, ...rows.value])
const removedSaved = computed(() => savedRows.filter((r) => !rows.value.some((x) => x.id === r.id)))
const activeCount = computed(() => allRows.value.filter((r) => r.is_active).length)

function regenerate() {
	const lists = complete.value.map((a) => a.values)
	const combos = lists.length ? lists.reduce<string[][]>((acc, list) => acc.flatMap((head) => list.map((v) => [...head, v])), [[]]) : []
	const old = new Map(rows.value.map((r) => [r.key, r]))
	rows.value = combos.map((values) => {
		const key = keyOf(values)
		return old.get(key) ?? { key, sku: suggest(values), values, price: defaultRow.price, is_active: true, auto: true }
	})
	selected.value = selected.value.filter((key) => key === DEFAULT_KEY || rows.value.some((r) => r.key === key))
}

// Mirror the editor into the form fields the API takes (option_names + variants).
function sync() {
	const on = enabled.value
	const names = on ? complete.value.map((a) => a.name.trim()) : []
	optionNames.value = names
	variants.value = [
		{
			id: defaultRow.id,
			sku: defaultRow.sku,
			option_values: {},
			is_default: true,
			is_active: on ? defaultRow.is_active : true,
			selling_price: on ? defaultRow.price : props.basePrice
		},
		...(on
			? rows.value.map((r) => ({
					id: r.id,
					sku: r.sku,
					option_values: Object.fromEntries(names.map((n, i) => [n, r.values[i]])),
					is_default: false,
					is_active: r.is_active,
					selling_price: r.price
				}))
			: [])
	]
}

watch(attrs, regenerate, { deep: true })
watch([rows, defaultRow, enabled, () => props.basePrice], sync, { deep: true })
watch(enabled, (on) => {
	if (!on) return
	if (!attrs.value.length) attrs.value.push({ name: '', values: [] })
	defaultRow.price = props.basePrice
	// A new product sold per variant usually has no parent-level sales; Standar starts inactive (it can be switched on).
	if (!defaultRow.id) defaultRow.is_active = false
})
watch(
	() => props.code,
	() => rows.value.forEach((r) => r.auto && (r.sku = suggest(r.values)))
)

// Attribute suggestions: names and values already used by other products of the company.
const used = ref<ProductVariantAttribute[]>([])
const namesListId = useId()
onMounted(async () => {
	try {
		used.value = (await api.get<ApiList<ProductVariantAttribute>>('/product-variant-option')).data.data
	} catch {
		used.value = [] // suggestions are optional; free text still works
	}
})
const valuesFor = (name: string) => used.value.find((u) => u.name.toLowerCase() === name.trim().toLowerCase())?.values ?? []

// Selection + bulk actions over the SKU rows (Standar included).
const selected = ref<string[]>([])
const bulkPrice = ref(0)
const allSelected = computed(() => selected.value.length === allRows.value.length)
const isSelected = (row: Row) => selected.value.includes(row.key)
function toggle(row: Row, on: boolean) {
	selected.value = on ? [...selected.value, row.key] : selected.value.filter((key) => key !== row.key)
}
const pickedRows = () => allRows.value.filter(isSelected)
function applyPrice() {
	pickedRows().forEach((r) => (r.price = bulkPrice.value))
}
function setActive(active: boolean) {
	pickedRows().forEach((r) => (r.is_active = active))
}
function autoSku() {
	pickedRows()
		.filter((r) => r.key !== DEFAULT_KEY && !r.id)
		.forEach((r) => {
			r.sku = suggest(r.values)
			r.auto = true
		})
}

// SKU feedback before saving: duplicates in this list now, SKUs of other products on blur. The server re-checks on save.
const takenBy = reactive<Record<string, string>>({})
const skuError = (row: Row) => {
	const sku = row.sku.trim().toLowerCase()
	if (!sku) return ''
	if (allRows.value.filter((r) => r.sku.trim().toLowerCase() === sku).length > 1) return 'SKU dobel di daftar ini'
	return takenBy[sku] ? `Sudah dipakai ${takenBy[sku]}` : ''
}
async function checkSku(row: Row) {
	const sku = row.sku.trim()
	if (!sku) return
	try {
		const found = (await api.get<ApiList<ProductVariantOption>>('/product-variant', { params: { q: sku, per_page: 20 } })).data.data
		const other = found.find((v) => v.sku.toLowerCase() === sku.toLowerCase() && v.product_id !== props.productId)
		if (other) takenBy[sku.toLowerCase()] = other.product_code
		else delete takenBy[sku.toLowerCase()]
	} catch {
		// best effort; the server validates on save
	}
}
function typeSku(row: Row, value: string) {
	row.sku = value
	row.auto = false
}

// Client-side check the schema can't see; null when fine.
function check(): string | null {
	if (!enabled.value) return null
	const names = attrs.value.map((a) => a.name.trim().toLowerCase())
	if (attrs.value.some((a) => !a.name.trim() || !a.values.length))
		return 'Lengkapi nama dan nilai setiap atribut varian, atau hapus atribut yang tidak dipakai'
	if (new Set(names).size !== names.length) return 'Nama atribut varian tidak boleh sama'
	if (rows.value.some((r) => !r.sku.trim())) return 'Lengkapi SKU semua varian (isi Kode Produk untuk SKU otomatis)'
	if (allRows.value.some((r) => skuError(r))) return 'Perbaiki SKU yang ditandai merah'
	return null
}
defineExpose({ check })
</script>

<template>
	<section class="space-y-3">
		<h3 class="subhead">Varian</h3>
		<div class="flex items-center gap-1">
			<Switch v-model="enabled" :disabled="hasSaved" label="Produk ini dijual dalam beberapa varian (mis. ukuran atau warna)" />
			<HelpTip v-if="hasSaved" :text="LOCKED_HELP" />
		</div>
		<p v-if="!enabled" class="text-s text-ink-subtle">
			Dijual dengan satu SKU<template v-if="code.trim()">: {{ defaultRow.sku || code }}</template
			>. Harga jual diisi di bagian Harga &amp; Stok.
		</p>

		<template v-else>
			<datalist :id="namesListId">
				<option v-for="item in used" :key="item.name" :value="item.name" />
			</datalist>
			<div class="space-y-2">
				<div class="hidden grid-cols-[220px_1fr_36px] gap-3 text-s font-medium text-ink-muted sm:grid">
					<span class="flex items-center gap-1">
						<span>Nama Atribut<span class="text-danger">*</span></span>
						<HelpTip v-if="hasSaved" :text="LOCKED_HELP" />
					</span>
					<span>Nilai<span class="text-danger">*</span></span>
				</div>
				<div v-for="(attr, index) in attrs" :key="index" class="grid grid-cols-1 items-start gap-2 sm:grid-cols-[220px_1fr_36px] sm:gap-3">
					<Input v-model="attr.name" :disabled="hasSaved" :list="namesListId" placeholder="mis. Ukuran" />
					<TagInput v-model="attr.values" :suggestions="valuesFor(attr.name)" placeholder="Ketik nilai lalu Enter, mis. S, M, L" />
					<button
						v-if="!hasSaved && attrs.length > 1"
						type="button"
						class="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-fill hover:text-danger"
						title="Hapus atribut"
						@click="attrs.splice(index, 1)"
					>
						<IconTrash class="h-4 w-4 shrink-0" />
					</button>
				</div>
				<Button
					v-if="!hasSaved && attrs.length < MAX_ATTRS"
					type="button"
					size="sm"
					variant="secondary"
					@click="attrs.push({ name: '', values: [] })"
				>
					<IconPlus class="h-4 w-4" /> Tambah Atribut
				</Button>
			</div>

			<div class="space-y-2 pt-2">
				<!-- Toolbar: select-all + bulk actions for the picked SKUs -->
				<div class="flex min-h-9 flex-wrap items-center justify-between gap-2">
					<div class="flex items-center gap-3 pl-3">
						<Checkbox :model-value="allSelected" @update:model-value="(on) => (selected = on ? allRows.map((r) => r.key) : [])" />
						<span v-if="selected.length" class="text-s font-medium text-ink">{{ selected.length }} SKU dipilih</span>
						<span v-else class="text-s text-ink-muted">{{ allRows.length }} SKU · {{ activeCount }} aktif</span>
					</div>
					<div v-if="selected.length" class="flex flex-wrap items-center gap-2">
						<div class="w-44"><MoneyInput v-model="bulkPrice" blank-zero placeholder="Harga jual" /></div>
						<Button type="button" size="sm" variant="secondary" @click="applyPrice">Terapkan Harga</Button>
						<Button type="button" size="sm" variant="subtle" @click="setActive(true)">Aktifkan</Button>
						<Button type="button" size="sm" variant="subtle" @click="setActive(false)">Nonaktifkan</Button>
						<Button type="button" size="sm" variant="subtle" @click="autoSku">SKU Otomatis</Button>
					</div>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full min-w-[720px] text-m">
						<thead>
							<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
								<th class="w-10 px-3 py-2" />
								<th v-for="attr in complete" :key="attr.name" class="px-3 py-2">{{ attr.name }}</th>
								<th v-if="!complete.length" class="px-3 py-2">Varian</th>
								<th class="w-[240px] px-3 py-2">SKU<span class="text-danger">*</span></th>
								<th class="w-[200px] px-3 py-2 text-right">Harga Jual<span class="text-danger">*</span></th>
								<th class="w-20 px-3 py-2">Aktif</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="row in allRows"
								:key="row.key"
								class="border-b border-hairline align-top last:border-0"
								:class="{ 'bg-primary/5': isSelected(row) }"
							>
								<td class="px-3 py-3.5"><Checkbox :model-value="isSelected(row)" @update:model-value="(on) => toggle(row, on)" /></td>
								<td v-if="row.key === DEFAULT_KEY" :colspan="Math.max(complete.length, 1)" class="px-3 py-2.5">
									<div class="flex items-center gap-1">
										<Badge>Standar</Badge>
										<HelpTip
											text="SKU tanpa varian: dipakai transaksi lama dan penjualan yang tidak memilih ukuran/warna. Nonaktifkan bila produk hanya dijual per varian."
										/>
									</div>
								</td>
								<template v-else>
									<td v-for="(value, i) in row.values" :key="i" class="px-3 py-3 text-ink">
										{{ value }}
										<span v-if="hasSaved && !row.id && i === row.values.length - 1" class="ml-1 text-s text-ink-subtle">· baru</span>
									</td>
								</template>
								<td class="px-3 py-2">
									<Input
										:model-value="row.sku"
										mono
										:placeholder="row.key === DEFAULT_KEY ? code || 'Sama dengan kode produk' : 'Isi Kode Produk dulu'"
										:class="skuError(row) && '[&_input]:border-danger'"
										@update:model-value="(v) => typeSku(row, v)"
										@blur="checkSku(row)"
									/>
									<p v-if="skuError(row)" class="mt-1 text-s text-danger">{{ skuError(row) }}</p>
								</td>
								<td class="px-3 py-2"><MoneyInput v-model="row.price" /></td>
								<td class="px-3 py-3"><Switch v-model="row.is_active" /></td>
							</tr>
							<tr v-if="!rows.length">
								<td :colspan="5" class="px-3 py-5 text-center text-s text-ink-muted">
									Isi nama atribut dan nilainya, kombinasi SKU dibuat otomatis di sini.
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p v-if="removedSaved.length" class="flex items-start gap-1.5 text-s text-warning">
					<IconAlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
					{{ removedSaved.map((r) => r.values.join(' / ')).join(', ') }} akan dihapus saat disimpan. Riwayat transaksinya tetap tersimpan; pakai
					Nonaktif bila varian hanya berhenti dijual.
				</p>
			</div>
		</template>
		<p v-if="error" class="text-s text-danger">{{ error }}</p>
	</section>
</template>
