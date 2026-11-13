<script setup lang="ts">
import { computed } from 'vue'
import { IconLock } from '@tabler/icons-vue'
import { achClass, cell, indent, level2Tints, negative, pct, weekRange } from '../grid'
import type { Flow, OutlookStateFull, ResumeAgg } from '../types'
import GridScroller from './GridScroller.vue'

// Resume Weekly tab: read model of Daily — per week "Bulan Berjalan" (cumulative) and "Mingguan", every category level.
const props = defineProps<{ state: OutlookStateFull }>()

const FROZEN = 420
const calc = computed(() => props.state.calc)
const rw = computed(() => calc.value.resume)
const weeks = computed(() => props.state.weeks)
const weekNos = computed(() => weeks.value.map((w) => w.week_no))
const tints = computed(() => level2Tints(rw.value.rows))
const last = computed(() => weeks.value.length - 1)

const base = 'border-b border-hairline px-1.5 whitespace-nowrap'
const c1 = 'sticky left-0 z-[2] w-[300px] min-w-[300px] max-w-[300px]'
const c2 = 'sticky left-[300px] z-[2] w-[120px] min-w-[120px] max-w-[120px] border-r border-ink-subtle/30 text-right tnum'
const weekStart = 'border-l border-ink-subtle/30'
const mtd = 'bg-warning-soft/60' // Bulan Berjalan columns (peach in the Excel reference)
const wk = 'bg-success/10' // Mingguan columns
const num = (v: number | null | undefined) => (negative(v) ? 'text-danger' : '')

const footers = computed<{ label: string; agg: ResumeAgg; flow: Flow | null; cls: string }[]>(() => [
	{ label: 'Total Cash In', agg: rw.value.totals.CASH_IN, flow: 'CASH_IN', cls: 'border-t-2 border-t-ink-subtle/30' },
	{ label: 'Total Cash Out', agg: rw.value.totals.CASH_OUT, flow: 'CASH_OUT', cls: '' },
	{ label: 'Surplus (Defisit)', agg: rw.value.totals.SURPLUS, flow: null, cls: '' }
])
</script>

<template>
	<div>
		<p class="mb-3 inline-flex items-center gap-1.5 text-s text-ink-muted">
			<IconLock class="h-4 w-4" /> Resume Weekly dihitung dari Daily dan hanya dapat dibaca.
		</p>
		<GridScroller :weeks="weekNos" :frozen="FROZEN">
			<table class="border-separate border-spacing-0 text-s">
				<thead>
					<tr class="h-[30px]">
						<th :class="[c1, 'top-0 z-[5] bg-fill px-3 text-left font-semibold']" rowspan="3">Kategori</th>
						<th :class="[c2, 'top-0 z-[5] bg-warning-soft px-1.5 text-center font-semibold']" rowspan="3">OL Monthly<br />(1 bulan)</th>
						<th
							v-for="w in weeks"
							:key="w.week_no"
							:data-wn="w.week_no"
							colspan="6"
							:class="['sticky top-0 z-[3] bg-fill px-2 text-center font-semibold', weekStart]"
						>
							Minggu {{ w.week_no }} <small v-if="weekRange(w)" class="ml-1 font-normal text-ink-muted">{{ weekRange(w) }}</small>
						</th>
					</tr>
					<tr class="h-[26px]">
						<template v-for="w in weeks" :key="w.week_no">
							<th colspan="2" :class="['sticky top-[30px] z-[3] bg-warning-soft px-1.5 text-center font-semibold', weekStart]">BULAN BERJALAN</th>
							<th class="sticky top-[30px] z-[3] bg-panel" />
							<th colspan="2" class="sticky top-[30px] z-[3] bg-success-soft px-1.5 text-center font-semibold">MINGGUAN</th>
							<th class="sticky top-[30px] z-[3] bg-panel" />
						</template>
					</tr>
					<tr>
						<template v-for="w in weeks" :key="w.week_no">
							<th :class="['sticky top-[56px] z-[3] w-[112px] min-w-[112px] bg-warning-soft px-1.5 text-center font-semibold', weekStart]">Target</th>
							<th class="sticky top-[56px] z-[3] w-[112px] min-w-[112px] bg-warning-soft px-1.5 text-center font-semibold">Actual</th>
							<th class="sticky top-[56px] z-[3] w-[64px] min-w-[64px] bg-fill px-1.5 text-center font-semibold">% Ach</th>
							<th class="sticky top-[56px] z-[3] w-[112px] min-w-[112px] bg-success-soft px-1.5 text-center font-semibold">OL</th>
							<th class="sticky top-[56px] z-[3] w-[112px] min-w-[112px] bg-success-soft px-1.5 text-center font-semibold">Actual</th>
							<th class="sticky top-[56px] z-[3] w-[64px] min-w-[64px] bg-fill px-1.5 text-center font-semibold">% Ach</th>
						</template>
					</tr>
				</thead>
				<tbody>
					<tr class="bg-fill font-semibold">
						<td :class="[base, c1, 'bg-fill px-3']">Saldo Awal</td>
						<td :class="[base, c2, 'bg-warning-soft', num(rw.saldo_awal.monthly)]">{{ cell(rw.saldo_awal.monthly, true) }}</td>
						<template v-for="(w, wi) in weeks" :key="w.week_no">
							<td :class="[base, weekStart, mtd, 'text-right tnum']">{{ cell(rw.saldo_awal.weeks[wi].target_mtd, true) }}</td>
							<td :class="[base, mtd, 'text-right tnum', num(rw.saldo_awal.weeks[wi].actual_mtd)]">
								{{ cell(rw.saldo_awal.weeks[wi].actual_mtd, true) }}
							</td>
							<td :class="base" />
							<td :class="[base, wk, 'text-right tnum']">{{ cell(rw.saldo_awal.weeks[wi].ol_week, true) }}</td>
							<td :class="[base, wk, 'text-right tnum', num(rw.saldo_awal.weeks[wi].actual_week)]">
								{{ cell(rw.saldo_awal.weeks[wi].actual_week, true) }}
							</td>
							<td :class="base" />
						</template>
					</tr>

					<template
						v-for="sec in [
							{ flow: 'CASH_IN' as Flow, label: 'CASH IN' },
							{ flow: 'CASH_OUT' as Flow, label: 'CASH OUT' }
						]"
						:key="sec.flow"
					>
						<tr class="bg-ink font-semibold text-ink-invert">
							<td :class="[c1, 'bg-ink px-3 py-1']">{{ sec.label }}</td>
							<td :class="[c2, 'bg-ink']" />
							<td :colspan="weeks.length * 6" class="bg-ink" />
						</tr>
						<tr v-for="r in rw.rows.filter((x) => x.flow_type === sec.flow)" :key="r.id" :class="tints[r.id] ?? 'bg-panel'">
							<td :class="[base, c1, tints[r.id] ?? 'bg-panel', !r.is_leaf && 'font-semibold']" :style="indent(r.depth)">
								<span class="block truncate" :title="r.name">{{ r.name }}</span>
							</td>
							<td :class="[base, c2, tints[r.id] ?? 'bg-panel', !r.is_leaf && 'font-semibold']">{{ cell(r.target_mtd[last]) }}</td>
							<template v-for="(w, wi) in weeks" :key="w.week_no">
								<td :class="[base, weekStart, mtd, 'text-right tnum', !r.is_leaf && 'font-semibold']">{{ cell(r.target_mtd[wi]) }}</td>
								<td :class="[base, mtd, 'text-right tnum', !r.is_leaf && 'font-semibold', num(r.actual_mtd[wi])]">{{ cell(r.actual_mtd[wi]) }}</td>
								<td :class="[base, 'text-center tnum', achClass(r.ach_mtd[wi], r.flow_type)]">{{ pct(r.ach_mtd[wi]) }}</td>
								<td :class="[base, wk, 'text-right tnum', !r.is_leaf && 'font-semibold']">{{ cell(r.ol_week[wi]) }}</td>
								<td :class="[base, wk, 'text-right tnum', !r.is_leaf && 'font-semibold', num(r.actual_week[wi])]">{{ cell(r.actual_week[wi]) }}</td>
								<td :class="[base, 'text-center tnum', achClass(r.ach_week[wi], r.flow_type)]">{{ pct(r.ach_week[wi]) }}</td>
							</template>
						</tr>
					</template>

					<tr v-for="f in footers" :key="f.label" class="bg-fill font-semibold">
						<td :class="[base, c1, 'bg-fill px-3', f.cls]">{{ f.label }}</td>
						<td :class="[base, c2, 'bg-warning-soft', f.cls]">{{ cell(f.agg.target_mtd[last]) }}</td>
						<template v-for="(w, wi) in weeks" :key="w.week_no">
							<td :class="[base, weekStart, mtd, f.cls, 'text-right tnum']">{{ cell(f.agg.target_mtd[wi]) }}</td>
							<td :class="[base, mtd, f.cls, 'text-right tnum', num(f.agg.actual_mtd[wi])]">{{ cell(f.agg.actual_mtd[wi]) }}</td>
							<td :class="[base, f.cls, 'text-center tnum', f.flow ? achClass(f.agg.ach_mtd[wi], f.flow) : '']">
								{{ f.flow ? pct(f.agg.ach_mtd[wi]) : '' }}
							</td>
							<td :class="[base, wk, f.cls, 'text-right tnum']">{{ cell(f.agg.ol_week[wi]) }}</td>
							<td :class="[base, wk, f.cls, 'text-right tnum', num(f.agg.actual_week[wi])]">{{ cell(f.agg.actual_week[wi]) }}</td>
							<td :class="[base, f.cls, 'text-center tnum', f.flow ? achClass(f.agg.ach_week[wi], f.flow) : '']">
								{{ f.flow ? pct(f.agg.ach_week[wi]) : '' }}
							</td>
						</template>
					</tr>

					<tr class="font-semibold">
						<td :class="[c1, 'sticky bottom-0 z-[2] bg-fill px-3 shadow-[0_-2px_0_rgb(var(--c-hairline))]']">Saldo Balance</td>
						<td :class="[c2, 'bottom-0 bg-warning-soft shadow-[0_-2px_0_rgb(var(--c-hairline))]']" />
						<template v-for="(w, wi) in weeks" :key="w.week_no">
							<td :class="['sticky bottom-0 z-[1] bg-warning-soft px-1.5 shadow-[0_-2px_0_rgb(var(--c-hairline))]', weekStart]" />
							<td
								:class="['sticky bottom-0 z-[1] bg-warning-soft px-1.5 text-right tnum shadow-[0_-2px_0_rgb(var(--c-hairline))]', num(rw.saldo[wi])]"
							>
								{{ cell(rw.saldo[wi], true) }}
							</td>
							<td class="sticky bottom-0 z-[1] bg-fill shadow-[0_-2px_0_rgb(var(--c-hairline))]" />
							<td class="sticky bottom-0 z-[1] bg-success-soft shadow-[0_-2px_0_rgb(var(--c-hairline))]" />
							<td
								:class="['sticky bottom-0 z-[1] bg-success-soft px-1.5 text-right tnum shadow-[0_-2px_0_rgb(var(--c-hairline))]', num(rw.saldo[wi])]"
							>
								{{ cell(rw.saldo[wi], true) }}
							</td>
							<td class="sticky bottom-0 z-[1] bg-fill shadow-[0_-2px_0_rgb(var(--c-hairline))]" />
						</template>
					</tr>
				</tbody>
			</table>
		</GridScroller>
	</div>
</template>
