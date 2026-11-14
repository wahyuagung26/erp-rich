<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, useId, watch } from 'vue'
import { IconAlertTriangle, IconPlus, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { money } from '@/utils/format'
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

// Variant editor in two steps: ① attributes (name + chip values) → ② every combination as a SKU row.
// Prices inherit the product's Harga Jual (`basePrice`) until a row is given its own; Standar always sells at `basePrice`.
type VariantDraft = ProductForm['variants'][number]
interface Row {
	key: string
	id?: number
	sku: string
	values: string[] // positional, one per complete attribute; [] for Standar
	price: number | null // null = follows basePrice
	is_active: boolean
	auto: boolean // SKU still follows the suggestion (not typed by the user)
}

const props = defineProps<{ code: string; basePrice: number; productId?: number; error?: string }>()
const optionNames = defineModel<string[]>('optionNames', { required: true })
const variants = defineModel<VariantDraft[]>('variants', { required: true })
const enabled = defineModel<boolean>('enabled', { required: true })

const MAX_ATTRS = 3
const DEFAULT_KEY = '__default'
const PRESETS = [
	{ name: 'Ukuran', values: ['S', 'M', 'L', 'XL'] },
	{ name: 'Warna', values: [] }
]
const SWITCH_HELP = [
	'Aktifkan bila produk dijual dalam beberapa ukuran/warna.',
	'Tanpa varian, produk dijual dengan satu SKU yang sama dengan Kode Produk.'
]
const LOCKED_HELP = [
	'Varian produk ini sudah tersimpan, jadi pilihan varian dan nama atribut tidak bisa diubah.',
	'Nilai baru tetap bisa ditambah; nonaktifkan varian yang tidak dijual lagi.'
]
const keyOf = (values: string[]) => values.map((v) => v.toLowerCase()).join('\u0001')
// No code yet → no SKU: a value-only SKU ("S-MERAH") would clash with other products.
const suggest = (values: string[]) => (props.code.trim() ? [props.code.trim(), ...values].join('-').toUpperCase().replace(/\s+/g, '') : '')
// Tidy typing: "uk" → "Uk", "merah" → "Merah", size codes "xl" / "2xl" → "XL" / "2XL".
const titleCase = (v: string) =>
	v
		.trim()
		.toLowerCase()
		.replace(/(^|\s)\S/g, (c) => c.toUpperCase())
const normalizeValue = (v: string) => (/^(\d*x{0,3}[sml]|\d+)$/i.test(v.trim()) ? v.trim().toUpperCase() : titleCase(v))

const stored = variants.value.filter((v) => !v.is_default)
const storedDefault = variants.value.find((v) => v.is_default)
const defaultRow = reactive<Row>({
	key: DEFAULT_KEY,
	id: storedDefault?.id,
	sku: storedDefault?.sku ?? '',
	values: [],
	price: null,
	is_active: storedDefault?.is_active ?? true,
	auto: false
})
// Standar is shown only for an existing product (it may carry sales history); a new variant product keeps it hidden and inactive.
const showStandar = !!defaultRow.id
const attrs = ref(optionNames.value.map((name) => ({ name, values: [...new Set(stored.map((v) => v.option_values[name]).filter(Boolean))] })))
const savedRows: Row[] = stored.map((v) => {
	const values = optionNames.value.map((name) => v.option_values[name] ?? '')
	const price = v.selling_price === props.basePrice ? null : v.selling_price
	return { key: keyOf(values), id: v.id, sku: v.sku, values, price, is_active: v.is_active, auto: false }
})
const rows = ref<Row[]>(savedRows.map((r) => ({ ...r, values: [...r.values] })))
// Saved variants freeze the attribute structure (add/remove/turn off) — their option values are keyed by it.
const hasSaved = savedRows.length > 0

const complete = computed(() => attrs.value.filter((a) => a.name.trim() && a.values.length))
const tableRows = computed(() => (showStandar ? [defaultRow, ...rows.value] : rows.value))
const removedSaved = computed(() => savedRows.filter((r) => !rows.value.some((x) => x.id === r.id)))
const activeCount = computed(() => tableRows.value.filter((r) => r.is_active).length)
const priceOf = (row: Row) => row.price ?? props.basePrice

function regenerate() {
	const lists = complete.value.map((a) => a.values)
	const combos = lists.length ? lists.reduce<string[][]>((acc, list) => acc.flatMap((head) => list.map((v) => [...head, v])), [[]]) : []
	const old = new Map(rows.value.map((r) => [r.key, r]))
	rows.value = combos.map((values) => {
		const key = keyOf(values)
		return old.get(key) ?? { key, sku: suggest(values), values, price: null, is_active: true, auto: true }
	})
	selected.value = selected.value.filter((key) => tableRows.value.some((r) => r.key === key))
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
			selling_price: props.basePrice
		},
		...(on
			? rows.value.map((r) => ({
					id: r.id,
					sku: r.sku,
					option_values: Object.fromEntries(names.map((n, i) => [n, r.values[i]])),
					is_default: false,
					is_active: r.is_active,
					selling_price: priceOf(r)
				}))
			: [])
	]
}

watch(attrs, regenerate, { deep: true })
watch([rows, defaultRow, enabled, () => props.basePrice], sync, { deep: true })
watch(enabled, (on) => {
	if (on && !showStandar) defaultRow.is_active = false
})
watch(
	() => props.code,
	() => rows.value.forEach((r) => r.auto && (r.sku = suggest(r.values)))
)

// Step ①: quick-add a preset (Ukuran comes with S–XL) or a free attribute, then focus where typing continues.
const root = ref<HTMLElement>()
async function addAttribute(preset?: { name: string; values: string[] }) {
	attrs.value.push({ name: preset?.name ?? '', values: [...(preset?.values ?? [])] })
	await nextTick()
	const row = root.value?.querySelectorAll('[data-attr-row]')[attrs.value.length - 1]
	row?.querySelector<HTMLInputElement>(preset ? '[data-values] input' : 'input')?.focus()
}

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

// Selection + bulk actions over the SKU rows.
const selected = ref<string[]>([])
const bulkPrice = ref(0)
const allSelected = computed(() => tableRows.value.length > 0 && selected.value.length === tableRows.value.length)
const isSelected = (row: Row) => selected.value.includes(row.key)
function toggle(row: Row, on: boolean) {
	selected.value = on ? [...selected.value, row.key] : selected.value.filter((key) => key !== row.key)
}
const pickedRows = () => tableRows.value.filter(isSelected)
function setPrice(price: number | null) {
	pickedRows()
		.filter((r) => r.key !== DEFAULT_KEY)
		.forEach((r) => (r.price = price))
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
	if (tableRows.value.filter((r) => r.sku.trim().toLowerCase() === sku).length > 1) return 'SKU dobel di daftar ini'
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

// Client-side check the schema can't see; null when fine. `issue` keeps it live for the form's "belum lengkap" hint.
function check(): string | null {
	if (!enabled.value) return null
	if (!attrs.value.length) return 'Pilih minimal satu atribut varian'
	const names = attrs.value.map((a) => a.name.trim().toLowerCase())
	if (attrs.value.some((a) => !a.name.trim() || !a.values.length))
		return 'Lengkapi nama dan nilai setiap atribut varian, atau hapus atribut yang tidak dipakai'
	if (new Set(names).size !== names.length) return 'Nama atribut varian tidak boleh sama'
	if (rows.value.some((r) => !r.sku.trim())) return 'Lengkapi SKU semua varian (isi Kode Produk untuk SKU otomatis)'
	if (tableRows.value.some((r) => skuError(r))) return 'Perbaiki SKU yang ditandai merah'
	return null
}
const issue = computed(check)
defineExpose({ check, issue })
</script>

<template>
	<section ref="root" class="space-y-3">
		<h3 class="subhead">Varian</h3>
		<div class="flex items-center gap-1">
			<Switch v-model="enabled" :disabled="hasSaved" label="Produk ini dijual dalam beberapa varian (mis. ukuran atau warna)" />
			<HelpTip :text="hasSaved ? LOCKED_HELP : SWITCH_HELP" />
		</div>

		<template v-if="enabled">
			<datalist :id="namesListId">
				<option v-for="item in used" :key="item.name" :value="item.name" />
			</datalist>

			<!-- Step ① attributes -->
			<div class="space-y-3 pt-1">
				<p class="flex items-center gap-2 text-m font-medium text-ink">
					<span class="grid h-5 w-5 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary-dark">1</span>
					Atribut varian
					<HelpTip v-if="hasSaved" :text="LOCKED_HELP" />
				</p>
				<div v-if="attrs.length" class="space-y-2">
					<div class="hidden grid-cols-[220px_1fr_36px] gap-3 text-s font-medium text-ink-muted sm:grid">
						<span>Nama Atribut<span class="text-danger">*</span></span>
						<span>Nilai<span class="text-danger">*</span></span>
					</div>
					<div
						v-for="(attr, index) in attrs"
						:key="index"
						data-attr-row
						class="grid grid-cols-1 items-start gap-2 sm:grid-cols-[220px_1fr_36px] sm:gap-3"
					>
						<Input v-model="attr.name" :disabled="hasSaved" :list="namesListId" placeholder="mis. Ukuran" @blur="attr.name = titleCase(attr.name)" />
						<TagInput
							v-model="attr.values"
							data-values
							:suggestions="valuesFor(attr.name)"
							:normalize="normalizeValue"
							placeholder="Ketik nilai lalu Enter, mis. Merah, Hitam"
						/>
						<button
							v-if="!hasSaved"
							type="button"
							class="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-fill hover:text-danger"
							title="Hapus atribut"
							@click="attrs.splice(index, 1)"
						>
							<IconTrash class="h-4 w-4 shrink-0" />
						</button>
					</div>
				</div>
				<!-- Shortcuts only before the first attribute: afterwards a named "+ Warna" reads like an instruction to add colours. -->
				<div v-if="!hasSaved && !attrs.length" class="flex flex-wrap items-center gap-2">
					<span class="text-s text-ink-muted">Pilih atribut:</span>
					<Button v-for="preset in PRESETS" :key="preset.name" type="button" size="sm" variant="secondary" @click="addAttribute(preset)">
						<IconPlus class="h-4 w-4" /> {{ preset.name }}
					</Button>
					<Button type="button" size="sm" variant="subtle" @click="addAttribute()"><IconPlus class="h-4 w-4" /> Atribut lain</Button>
				</div>
				<Button v-else-if="!hasSaved && attrs.length < MAX_ATTRS" type="button" size="sm" variant="subtle" @click="addAttribute()">
					<IconPlus class="h-4 w-4" /> Tambah atribut
				</Button>
			</div>

			<!-- Step ② SKU & price -->
			<div class="space-y-2 pt-3">
				<p class="flex items-center gap-2 text-m font-medium text-ink">
					<span class="grid h-5 w-5 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary-dark">2</span>
					SKU &amp; harga
					<HelpTip
						:text="[
							`Harga tiap varian mengikuti Harga Jual (Rp ${money(basePrice)}) dan tampil abu-abu.`,
							'Ketik harga di baris yang berbeda; Ikuti Harga Jual mengembalikannya.'
						]"
					/>
				</p>
				<!-- Toolbar: select-all + bulk actions for the picked SKUs -->
				<div v-if="tableRows.length" class="flex min-h-9 flex-wrap items-center justify-between gap-2">
					<div class="flex items-center gap-3 pl-3">
						<Checkbox :model-value="allSelected" @update:model-value="(on) => (selected = on ? tableRows.map((r) => r.key) : [])" />
						<span v-if="selected.length" class="text-s font-medium text-ink">{{ selected.length }} SKU dipilih</span>
						<span v-else class="text-s text-ink-muted">{{ tableRows.length }} SKU · {{ activeCount }} aktif</span>
					</div>
					<div v-if="selected.length" class="flex flex-wrap items-center gap-2">
						<div class="w-44"><MoneyInput v-model="bulkPrice" blank-zero placeholder="Harga khusus" /></div>
						<Button type="button" size="sm" variant="secondary" @click="setPrice(bulkPrice)">Terapkan Harga</Button>
						<Button type="button" size="sm" variant="subtle" @click="setPrice(null)">Ikuti Harga Jual</Button>
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
								<th class="w-[200px] px-3 py-2 text-right">Harga Jual</th>
								<th class="w-20 px-3 py-2">Aktif</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="row in tableRows"
								:key="row.key"
								class="border-b border-hairline align-top last:border-0"
								:class="{ 'bg-primary/5': isSelected(row) }"
							>
								<td class="px-3 py-3.5"><Checkbox :model-value="isSelected(row)" @update:model-value="(on) => toggle(row, on)" /></td>
								<td v-if="row.key === DEFAULT_KEY" :colspan="Math.max(complete.length, 1)" class="px-3 py-2.5">
									<div class="flex items-center gap-1">
										<Badge>Tanpa varian</Badge>
										<HelpTip
											:text="[
												'SKU lama produk ini sebelum punya varian.',
												'Dipakai transaksi lama; nonaktifkan bila produk sekarang hanya dijual per varian.'
											]"
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
								<td class="px-3 py-2">
									<p v-if="row.key === DEFAULT_KEY" class="tnum py-2 pr-3 text-right text-ink-subtle">{{ money(basePrice) }}</p>
									<template v-else>
										<!-- Inherited price reads muted; typing makes it this SKU's own price. -->
										<div :class="row.price === null && '[&_input]:text-ink-subtle'">
											<MoneyInput :model-value="priceOf(row)" @update:model-value="(v) => (row.price = v)" />
										</div>
										<button
											v-if="row.price !== null"
											type="button"
											class="mt-1 w-full text-right text-s text-primary-dark hover:underline"
											@click="row.price = null"
										>
											Ikuti Harga Jual
										</button>
									</template>
								</td>
								<td class="px-3 py-3"><Switch v-model="row.is_active" /></td>
							</tr>
							<tr v-if="!rows.length">
								<td :colspan="Math.max(complete.length, 1) + 4" class="px-3 py-5 text-center text-s text-ink-muted">
									Pilih atribut di langkah 1, kombinasi SKU dibuat otomatis di sini.
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
