import { computed, type Ref } from 'vue'
import { money } from '@/utils/format'
import type { KpiItem } from '@/components/base/KpiFilter.vue'
import type { KpiSummaryItem } from '@/utils/types'

// A tile is a named preset of the page's own filter refs, e.g. { approval_status: 'approved', delivery_status: 'not_received' }.
export interface KpiDef extends Pick<KpiItem, 'icon' | 'tone' | 'attention' | 'emptyText'> {
	key: string
	label: string
	filters: Record<string, string>
}

// Wires KPI tiles to a list page: `items` for <KpiFilter>, `active` derived from the current filter values (so the
// tiles stay in sync with the dropdowns), and `select()` which sets a tile's preset and re-applies the filters.
export function useKpiTiles(
	defs: KpiDef[],
	filterRefs: Record<string, Ref<string>>,
	summary: Ref<Record<string, KpiSummaryItem> | undefined>,
	apply: () => void
) {
	const keys = [...new Set(defs.flatMap((def) => Object.keys(def.filters)))]

	const items = computed<KpiItem[]>(() =>
		defs.map((def) => {
			const entry = summary.value?.[def.key]
			return {
				key: def.key,
				label: def.label,
				count: entry?.count,
				hint: entry?.amount !== undefined ? `Rp ${money(entry.amount)}` : undefined,
				icon: def.icon,
				tone: def.tone,
				attention: def.attention,
				emptyText: def.emptyText
			}
		})
	)

	// A tile is active only when every tile-controlled filter matches its preset exactly (others must be empty).
	const active = computed(() => defs.find((def) => keys.every((key) => (def.filters[key] ?? '') === filterRefs[key].value))?.key ?? null)

	function select(key: string | null) {
		const def = defs.find((item) => item.key === key)
		for (const name of keys) filterRefs[name].value = def?.filters[name] ?? ''
		apply()
	}

	return { items, active, select }
}
