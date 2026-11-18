<script setup lang="ts">
// SKU picker of transaction lines (GET /product-variant): two-line menu rows, trigger reads "SKU — Nama · Varian".
// `purchase` shows the purchase price (HPP) in the menu instead of the selling price.
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Badge from '@/components/base/Badge.vue'
import { money } from '@/utils/format'
import type { ProductVariantOption } from '@/utils/types'

const props = defineProps<{ modelValue: number | null; sku?: string; name?: string; label?: string; disabled?: boolean; purchase?: boolean }>()
const emit = defineEmits<{ select: [ProductVariantOption | null] }>()

const text = (sku?: string, name?: string, label?: string) => `${sku} — ${name}${label && label !== 'Standar' ? ` · ${label}` : ''}`
const optionLabel = (item: Record<string, unknown>) => {
	const row = item as unknown as ProductVariantOption
	return text(row.sku, row.product_name, row.label)
}
const asOption = (item: Record<string, unknown>) => item as unknown as ProductVariantOption
</script>

<template>
	<AsyncSelect
		:model-value="modelValue"
		endpoint="/product-variant"
		:option-label="optionLabel"
		:initial-label="props.sku ? text(props.sku, props.name, props.label) : undefined"
		placeholder="Cari nama produk atau SKU…"
		:disabled="disabled"
		:menu-min-width="400"
		@select="(row) => emit('select', row ? asOption(row) : null)"
	>
		<template #option="{ item }">
			<span class="flex items-center justify-between gap-3">
				<span class="min-w-0 leading-snug">
					<span class="flex items-center gap-1.5">
						<span class="truncate text-ink">{{ asOption(item).product_name }}</span>
						<Badge v-if="asOption(item).label !== 'Standar'" tone="primary" class="!py-0">{{ asOption(item).label }}</Badge>
					</span>
					<span class="block truncate text-s text-ink-muted">{{ [asOption(item).sku, asOption(item).brand_name].filter(Boolean).join(' · ') }}</span>
				</span>
				<span class="tnum shrink-0 text-s text-ink-muted">{{
					money(purchase ? asOption(item).last_purchase_price : asOption(item).selling_price)
				}}</span>
			</span>
		</template>
	</AsyncSelect>
</template>
