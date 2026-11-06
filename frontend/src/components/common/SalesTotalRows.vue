<script setup lang="ts">
// `<tfoot>` rows of a sales document's totals (Sales Order, Invoice Penjualan) — shared by the form's line table and the detail page. Renders the amount in the last
// "Total" column: `labelSpan` = columns before it, `trailing` = extra empty columns after it (the form's Aksi column).
// `paid` (when > 0) adds Total Pembayaran + Sisa Tagihan under the grand total.
import Amount from '@/components/base/Amount.vue'

interface SalesTotals {
	subtotal: number
	discount: number
	dpp: number
	ppn: number
	expense_total: number
	total: number
}

defineProps<{ totals: SalesTotals; pkp: boolean; labelSpan: number; trailing?: number; paid?: number; totalLabel?: string }>()
</script>

<template>
	<tr class="text-s text-ink-muted">
		<td :colspan="labelSpan" class="px-2 pb-1 pt-3 text-right">Subtotal Produk</td>
		<td class="px-2 pb-1 pt-3 text-right"><Amount :value="totals.subtotal" /></td>
		<td v-if="trailing" :colspan="trailing" />
	</tr>
	<tr v-if="totals.discount > 0" class="text-s text-ink-muted">
		<td :colspan="labelSpan" class="px-2 py-1 text-right">Diskon Global</td>
		<td class="px-2 py-1 text-right"><Amount :value="-totals.discount" /></td>
		<td v-if="trailing" :colspan="trailing" />
	</tr>
	<template v-if="pkp">
		<tr class="text-s text-ink-muted">
			<td :colspan="labelSpan" class="px-2 py-1 text-right">DPP</td>
			<td class="px-2 py-1 text-right"><Amount :value="totals.dpp" /></td>
			<td v-if="trailing" :colspan="trailing" />
		</tr>
		<tr class="text-s text-ink-muted">
			<td :colspan="labelSpan" class="px-2 py-1 text-right">PPN 11%</td>
			<td class="px-2 py-1 text-right"><Amount :value="totals.ppn" /></td>
			<td v-if="trailing" :colspan="trailing" />
		</tr>
	</template>
	<tr v-if="totals.expense_total > 0" class="text-s text-ink-muted">
		<td :colspan="labelSpan" class="px-2 py-1 text-right">Biaya Penjualan</td>
		<td class="px-2 py-1 text-right"><Amount :value="totals.expense_total" /></td>
		<td v-if="trailing" :colspan="trailing" />
	</tr>
	<tr class="bg-fill font-semibold text-ink [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md">
		<td :colspan="labelSpan" class="px-2 py-2.5 text-right text-ink-muted">{{ totalLabel ?? 'Total' }}</td>
		<td class="px-2 py-2.5 text-right text-l"><Amount :value="totals.total" /></td>
		<td v-if="trailing" :colspan="trailing" />
	</tr>
	<template v-if="paid && paid > 0">
		<tr class="text-s text-ink-muted">
			<td :colspan="labelSpan" class="px-2 pb-1 pt-3 text-right">Total Pembayaran</td>
			<td class="px-2 pb-1 pt-3 text-right"><Amount :value="paid" /></td>
			<td v-if="trailing" :colspan="trailing" />
		</tr>
		<tr class="text-m font-medium text-ink">
			<td :colspan="labelSpan" class="px-2 py-1 text-right text-ink-muted">Sisa Tagihan</td>
			<td class="px-2 py-1 text-right"><Amount :value="totals.total - paid" /></td>
			<td v-if="trailing" :colspan="trailing" />
		</tr>
	</template>
</template>
