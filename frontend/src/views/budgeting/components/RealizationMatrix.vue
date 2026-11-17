<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { IconArrowsMaximize, IconChevronDown, IconChevronRight, IconX } from '@tabler/icons-vue'
import Input from '@/components/base/Input.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import Amount from '@/components/base/Amount.vue'
import VarianceAmount from './VarianceAmount.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import { months, sectionRank, type RealizationRow } from '../types'

const props = defineProps<{
	rows: RealizationRow[]
	ytdRows: RealizationRow[]
	year: number
	allYtd: boolean
	showAllYtd: boolean
	noDepartment: boolean
}>()
const emit = defineEmits<{ 'update:allYtd': [boolean] }>()
const query = ref('')
const freezeYtd = ref(true)
const freezeTotal = ref(true)
const expanded = reactive<Record<string, boolean>>({})
const container = ref<HTMLElement>()
const cutoff = computed(() => (props.year < new Date().getFullYear() ? 12 : props.year > new Date().getFullYear() ? 0 : new Date().getMonth()))
const upto = (values: number[]) => values.slice(0, cutoff.value).reduce((a, b) => a + b, 0)
const annual = (values: number[]) => values.reduce((a, b) => a + b, 0)
const groups = computed(() => {
	const map = new Map<string, RealizationRow[]>()
	for (const row of props.rows) {
		if (!`${row.account_code} ${row.account_name} ${row.section}`.toLowerCase().includes(query.value.toLowerCase().trim())) continue
		const key = `${row.group}|${row.section}`
		if (!map.has(key)) map.set(key, [])
		map.get(key)!.push(row)
	}
	return [...map.entries()]
		.map(([, rows]) => ({ name: rows[0]!.section, rows, capex: rows[0]!.group === 'CAPEX' }))
		.sort((a, b) => Number(a.capex) - Number(b.capex) || sectionRank(a.name) - sectionRank(b.name))
})
const categoryRows = (capex: boolean) => groups.value.filter((group) => group.capex === capex).flatMap((group) => group.rows)
const ytdRow = (row: RealizationRow) =>
	props.ytdRows.find((y) => y.account_code === row.account_code) ?? { ...row, budget: Array(12).fill(0), actual: Array(12).fill(0) }
const ytdBudget = (row: RealizationRow) => upto(ytdRow(row).budget)
const ytdActual = (row: RealizationRow) => upto(ytdRow(row).actual)
const variance = (budget: number, actual: number, sign: number) => (sign > 0 ? actual - budget : budget - actual)
const percentTone = (budget: number, actual: number, sign: number, group: RealizationRow['group']) => {
	if (group === 'CAPEX') return ''
	const p = (actual / (budget || 100)) * 100
	return sign > 0
		? p > 100
			? 'text-success bg-success-soft'
			: p < 80
				? 'text-danger bg-danger-soft'
				: 'text-warning bg-warning-soft'
		: p > 100
			? 'text-danger bg-danger-soft'
			: p < 80
				? 'text-success bg-success-soft'
				: 'text-warning bg-warning-soft'
}
// Aggregate rows hold signed values: a positive net budget reads like revenue, a negative one like cost, zero is not coloured.
const aggTone = (budget: number, actual: number) => (budget === 0 ? '' : percentTone(budget, actual, budget > 0 ? 1 : -1, 'OPEX'))
const percent = (budget: number, actual: number) =>
	`${((actual / (budget || 100)) * 100).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
const agg = (rows: RealizationRow[], month?: number, ytd = false) => {
	const budget = sum(rows, 'budget', month, ytd)
	const actual = sum(rows, 'actual', month, ytd)
	return { tone: aggTone(budget, actual), pct: percent(budget, actual) }
}
const totalBudget = computed(() => props.rows.reduce((n, r) => n + annual(r.budget) * r.sign, 0))
const totalActual = computed(() => props.rows.reduce((n, r) => n + annual(r.actual) * r.sign, 0))
const sum = (rows: RealizationRow[], kind: 'budget' | 'actual', month?: number, ytd = false) =>
	rows.reduce((n, r) => {
		const source = ytd ? ytdRow(r) : r
		const values = source[kind]
		return n + (ytd ? upto(values) : month === undefined ? annual(values) : (values[month] ?? 0)) * r.sign
	}, 0)
function toggle(name: string) {
	expanded[name] = expanded[name] === false
}
async function fullscreen() {
	if (!container.value) return
	if (document.fullscreenElement) await document.exitFullscreen()
	else await container.value.requestFullscreen()
}
</script>
<template>
	<div ref="container" class="space-y-3 bg-panel p-1">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<Input v-model="query" placeholder="Cari akun (kode / nama)…" class="!w-64"
				><template #suffix
					><Button v-if="query" variant="subtle" size="sm" aria-label="Hapus pencarian" @click="query = ''"
						><IconX class="h-4 w-4" /></Button></template
			></Input>
			<div class="flex flex-wrap items-center gap-4 text-s text-ink-muted">
				<span
					>Budget <strong class="text-ink"><Amount :value="totalBudget" /></strong></span
				><span
					>Realisasi <strong class="text-ink"><Amount :value="totalActual" /></strong></span
				><span
					>Selisih <strong class="text-ink"><VarianceAmount :value="totalActual - totalBudget" /></strong></span
				><Button size="sm" variant="outline" @click="fullscreen"><IconArrowsMaximize class="h-4 w-4" /> Layar penuh</Button>
			</div>
		</div>
		<p class="text-s text-ink-muted">
			Selisih: hijau = lebih baik dari budget (biaya hemat atau pendapatan melampaui target), merah = over budget atau di bawah target; sub-total dan
			total = Realisasi dikurangi Budget. Persentase = Realisasi dibanding Budget: pendapatan di atas 100% hijau, di bawah 80% merah; biaya di atas
			100% merah, di bawah 80% hijau; 80–100% oranye. Budget kosong memakai pembagi 100 agar over budget tetap terlihat.
		</p>
		<div class="flex flex-wrap gap-4">
			<Checkbox v-model="freezeYtd" label="Freeze Budget YTD" /><Checkbox v-model="freezeTotal" label="Freeze Total Budget" />
		</div>
		<div class="matrix-scroll overflow-auto rounded-md">
			<table class="matrix text-s" :class="{ 'freeze-ytd': freezeYtd, 'freeze-total': freezeTotal }">
				<thead>
					<tr>
						<th rowspan="3" class="sticky-col account-col">Akun / Rincian</th>
						<th colspan="4">
							Budget YTD · Jan–{{ cutoff ? months[cutoff - 1] : '—' }} {{ year }}
							<Checkbox
								v-if="showAllYtd"
								:model-value="allYtd"
								label="Tampilkan Semua Departemen"
								@update:model-value="emit('update:allYtd', $event)"
							/>
						</th>
						<th v-for="q in 4" :key="q" colspan="12">Q{{ q }} (Quarter {{ q }})</th>
						<th rowspan="3" class="total-col t1">Budget Total<br />(1 tahun)</th>
						<th rowspan="3" class="total-col t2">Aktual Total<br />(Periode Berjalan)</th>
						<th rowspan="3" class="total-col t3">Selisih</th>
						<th rowspan="3" class="total-col t4">(%)</th>
					</tr>
					<tr>
						<th colspan="4">Berjalan</th>
						<th v-for="m in months" :key="m" colspan="4">{{ m }}</th>
					</tr>
					<tr>
						<th v-for="(label, i) in ['YTD Budget', 'Actual YTD', 'Selisih', '%']" :key="label" :class="`ytd-col y${i + 1}`">{{ label }}</th>
						<template v-for="m in months" :key="m"
							><th v-for="label in ['Budget', 'Realisasi', 'Selisih', '%']" :key="label">{{ label }}</th></template
						>
					</tr>
				</thead>
				<tbody>
					<template v-for="(group, groupIndex) in groups" :key="group.name"
						><tr v-if="!query && (groupIndex === 0 || groups[groupIndex - 1]?.capex !== group.capex)" class="group">
							<th class="sticky-col account-col">{{ group.capex ? 'CAPEX — BELANJA MODAL / ASET' : 'OPEX — BIAYA OPERASIONAL' }}</th>
							<td colspan="56" />
						</tr>
						<tr class="section">
							<th class="sticky-col account-col">
								<button type="button" class="flex items-center gap-1" @click="toggle(group.name)">
									<IconChevronRight v-if="expanded[group.name] === false && !query" class="h-4 w-4" /><IconChevronDown v-else class="h-4 w-4" />{{
										group.name
									}}
									· {{ group.rows.length }} akun
								</button>
							</th>
							<td colspan="56" />
						</tr>
						<tr v-for="row in expanded[group.name] === false && !query ? [] : group.rows" :key="row.account_code">
							<th class="sticky-col account-col">
								{{ row.account_code }} — {{ row.account_name }}
								<Badge v-if="!noDepartment && !annual(row.budget)" tone="warning">Tanpa anggaran</Badge>
							</th>
							<td class="ytd-col y1"><Amount :value="ytdBudget(row)" /></td>
							<td class="ytd-col y2"><Amount :value="ytdActual(row)" /></td>
							<td class="ytd-col y3"><VarianceAmount :value="variance(ytdBudget(row), ytdActual(row), row.sign)" /></td>
							<td class="ytd-col y4" :class="percentTone(ytdBudget(row), ytdActual(row), row.sign, row.group)">
								{{ percent(ytdBudget(row), ytdActual(row)) }}
							</td>
							<template v-for="(_, i) in months" :key="i"
								><td><Amount :value="row.budget[i]" /></td>
								<td><Amount :value="row.actual[i]" /></td>
								<td><VarianceAmount :value="variance(row.budget[i] ?? 0, row.actual[i] ?? 0, row.sign)" /></td>
								<td :class="percentTone(row.budget[i] ?? 0, row.actual[i] ?? 0, row.sign, row.group)">
									{{ percent(row.budget[i] ?? 0, row.actual[i] ?? 0) }}
								</td></template
							>
							<td class="total-col t1"><Amount :value="annual(row.budget)" /></td>
							<td class="total-col t2"><Amount :value="annual(row.actual)" /></td>
							<td class="total-col t3"><VarianceAmount :value="variance(annual(row.budget), annual(row.actual), row.sign)" /></td>
							<td class="total-col t4" :class="percentTone(annual(row.budget), annual(row.actual), row.sign, row.group)">
								{{ percent(annual(row.budget), annual(row.actual)) }}
							</td>
						</tr>
						<tr v-if="!query && expanded[group.name] !== false" class="subtotal">
							<th class="sticky-col account-col">Sub-total {{ group.name }}</th>
							<td class="ytd-col y1"><Amount :value="sum(group.rows, 'budget', undefined, true)" /></td>
							<td class="ytd-col y2"><Amount :value="sum(group.rows, 'actual', undefined, true)" /></td>
							<td class="ytd-col y3">
								<VarianceAmount :value="sum(group.rows, 'actual', undefined, true) - sum(group.rows, 'budget', undefined, true)" />
							</td>
							<td class="ytd-col y4" :class="agg(group.rows, undefined, true).tone">{{ agg(group.rows, undefined, true).pct }}</td>
							<template v-for="(_, i) in months" :key="i"
								><td><Amount :value="sum(group.rows, 'budget', i)" /></td>
								<td><Amount :value="sum(group.rows, 'actual', i)" /></td>
								<td><VarianceAmount :value="sum(group.rows, 'actual', i) - sum(group.rows, 'budget', i)" /></td>
								<td :class="agg(group.rows, i).tone">{{ agg(group.rows, i).pct }}</td></template
							>
							<td class="total-col t1"><Amount :value="sum(group.rows, 'budget')" /></td>
							<td class="total-col t2"><Amount :value="sum(group.rows, 'actual')" /></td>
							<td class="total-col t3"><VarianceAmount :value="sum(group.rows, 'actual') - sum(group.rows, 'budget')" /></td>
							<td class="total-col t4" :class="agg(group.rows).tone">{{ agg(group.rows).pct }}</td>
						</tr>
						<tr v-if="!query && (groupIndex === groups.length - 1 || groups[groupIndex + 1]?.capex !== group.capex)" class="subtotal">
							<th class="sticky-col account-col">{{ group.capex ? 'Belanja Modal' : 'Laba (Rugi)' }}</th>
							<td class="ytd-col y1"><Amount :value="sum(categoryRows(group.capex), 'budget', undefined, true)" /></td>
							<td class="ytd-col y2"><Amount :value="sum(categoryRows(group.capex), 'actual', undefined, true)" /></td>
							<td class="ytd-col y3">
								<VarianceAmount
									:value="sum(categoryRows(group.capex), 'actual', undefined, true) - sum(categoryRows(group.capex), 'budget', undefined, true)"
								/>
							</td>
							<td class="ytd-col y4" :class="agg(categoryRows(group.capex), undefined, true).tone">
								{{ agg(categoryRows(group.capex), undefined, true).pct }}
							</td>
							<template v-for="(_, i) in months" :key="i"
								><td><Amount :value="sum(categoryRows(group.capex), 'budget', i)" /></td>
								<td><Amount :value="sum(categoryRows(group.capex), 'actual', i)" /></td>
								<td><VarianceAmount :value="sum(categoryRows(group.capex), 'actual', i) - sum(categoryRows(group.capex), 'budget', i)" /></td>
								<td :class="agg(categoryRows(group.capex), i).tone">{{ agg(categoryRows(group.capex), i).pct }}</td></template
							>
							<td class="total-col t1"><Amount :value="sum(categoryRows(group.capex), 'budget')" /></td>
							<td class="total-col t2"><Amount :value="sum(categoryRows(group.capex), 'actual')" /></td>
							<td class="total-col t3">
								<VarianceAmount :value="sum(categoryRows(group.capex), 'actual') - sum(categoryRows(group.capex), 'budget')" />
							</td>
							<td class="total-col t4" :class="agg(categoryRows(group.capex)).tone">{{ agg(categoryRows(group.capex)).pct }}</td>
						</tr>
					</template>
					<tr v-if="!groups.length">
						<td colspan="57" class="text-center text-ink-subtle">Tidak ada akun untuk pilihan ini.</td>
					</tr>
				</tbody>
				<tfoot>
					<tr>
						<th class="sticky-col account-col">Laba Rugi Setelah Belanja Modal</th>
						<td class="ytd-col y1"><Amount :value="sum(rows, 'budget', undefined, true)" /></td>
						<td class="ytd-col y2"><Amount :value="sum(rows, 'actual', undefined, true)" /></td>
						<td class="ytd-col y3"><VarianceAmount :value="sum(rows, 'actual', undefined, true) - sum(rows, 'budget', undefined, true)" /></td>
						<td class="ytd-col y4" :class="agg(rows, undefined, true).tone">{{ agg(rows, undefined, true).pct }}</td>
						<template v-for="(_, i) in months" :key="i"
							><td><Amount :value="sum(rows, 'budget', i)" /></td>
							<td><Amount :value="sum(rows, 'actual', i)" /></td>
							<td><VarianceAmount :value="sum(rows, 'actual', i) - sum(rows, 'budget', i)" /></td>
							<td :class="agg(rows, i).tone">{{ agg(rows, i).pct }}</td></template
						>
						<td class="total-col t1"><Amount :value="totalBudget" /></td>
						<td class="total-col t2"><Amount :value="totalActual" /></td>
						<td class="total-col t3"><VarianceAmount :value="totalActual - totalBudget" /></td>
						<td class="total-col t4" :class="aggTone(totalBudget, totalActual)">{{ percent(totalBudget, totalActual) }}</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</div>
</template>
<style scoped>
.matrix-scroll {
	max-height: 680px;
}
:fullscreen {
	padding: 20px;
	overflow: auto;
}
:fullscreen .matrix-scroll {
	max-height: calc(100vh - 160px);
}
.matrix {
	border-collapse: separate;
	border-spacing: 0;
	width: max-content;
	min-width: 100%;
}
.matrix th,
.matrix td {
	box-sizing: border-box;
	padding: 8px;
	width: 112px;
	min-width: 112px;
	max-width: 112px;
	border-bottom: 1px solid rgb(var(--c-hairline));
	background: rgb(var(--c-panel));
	text-align: right;
	white-space: nowrap;
}
.matrix th {
	font-weight: 600;
}
.matrix thead th {
	position: sticky;
	top: 0;
	z-index: 4;
	background: rgb(var(--c-fill));
	color: rgb(var(--c-ink-muted));
	text-align: center;
}
.matrix thead tr:nth-child(2) th {
	top: 43px;
}
.matrix thead tr:nth-child(3) th {
	top: 76px;
}
.matrix .sticky-col {
	position: sticky;
	z-index: 3;
}
.matrix .account-col {
	left: 0;
	width: 260px;
	min-width: 260px;
	max-width: 260px;
	text-align: left;
	white-space: normal;
}
.matrix thead .account-col {
	z-index: 8;
}
.freeze-ytd .ytd-col {
	position: sticky;
	z-index: 3;
}
.freeze-ytd .y1 {
	left: 260px;
}
.freeze-ytd .y2 {
	left: 372px;
}
.freeze-ytd .y3 {
	left: 484px;
}
.freeze-ytd .y4 {
	left: 596px;
}
.freeze-total .total-col {
	position: sticky;
	z-index: 3;
	background: rgb(var(--c-fill));
}
.freeze-total .t1 {
	right: 300px;
}
.freeze-total .t2 {
	right: 188px;
}
.freeze-total .t3 {
	right: 76px;
}
.freeze-total .t4 {
	right: 0;
}
.matrix thead .ytd-col,
.matrix thead .total-col {
	z-index: 6;
}
.matrix .group th,
.matrix .group td {
	background: rgb(var(--c-ink-muted));
	color: white;
}
.matrix .section th,
.matrix .section td,
.matrix .subtotal th,
.matrix .subtotal td,
.matrix tfoot th,
.matrix tfoot td {
	background: rgb(var(--c-fill));
}
.matrix tfoot th,
.matrix tfoot td {
	position: sticky;
	bottom: 0;
	z-index: 4;
	font-weight: 600;
}
.matrix tfoot .sticky-col,
.matrix tfoot .ytd-col,
.matrix tfoot .total-col {
	z-index: 6;
}
.matrix .y4,
.matrix .t4 {
	width: 76px;
	min-width: 76px;
	max-width: 76px;
}
.matrix thead .total-col {
	white-space: normal;
}
.matrix td.text-success {
	color: rgb(var(--c-success));
	background: rgb(var(--c-success-soft));
}
.matrix td.text-danger {
	color: rgb(var(--c-danger));
	background: rgb(var(--c-danger-soft));
}
.matrix td.text-warning {
	color: rgb(var(--c-warning));
	background: rgb(var(--c-warning-soft));
}
</style>
