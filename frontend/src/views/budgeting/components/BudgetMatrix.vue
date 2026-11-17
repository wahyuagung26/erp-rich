<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { IconChevronDown, IconChevronRight, IconLock, IconPlus, IconRepeat, IconTrash, IconX } from '@tabler/icons-vue'
import Input from '@/components/base/Input.vue'
import MoneyInput from '@/components/base/MoneyInput.vue'
import Button from '@/components/base/Button.vue'
import Amount from '@/components/base/Amount.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import HelpTip from '@/components/base/HelpTip.vue'
import { codeExample, monthNames, months, sectionRank, sumDocument, sumLine, type BudgetAccount, type BudgetLine } from '../types'

const props = defineProps<{
	lines: BudgetLine[]
	initialLines: BudgetLine[]
	accounts: BudgetAccount[]
	revision: boolean
	start: number
	year: string
	ytd: Record<string, number> | null
	allYtd: boolean
	// Hide the "Tampilkan Semua Departemen" option (detail page of an approved budget: YTD is a frozen snapshot).
	hideAllYtd?: boolean
	// Read-only (detail page): text instead of inputs, only accounts that have lines, no action column.
	readonly?: boolean
	// Caption under "Capaian YTD", e.g. "Jan–Okt 2026"; frozen = snapshot taken at approval.
	ytdLabel?: string
	ytdFrozen?: boolean
}>()
const emit = defineEmits<{ 'update:allYtd': [boolean] }>()
const query = ref('')
// Revision table only: both pinned column groups can be released for a wide view (like Realisasi's freeze options).
const freezeYtd = ref(true)
const freezeTotal = ref(true)
const expanded = reactive<Record<string, boolean>>({})
const fillValues = reactive<Record<string, string>>({})
const hasActions = computed(() => !props.revision && !props.readonly)
const headRows = props.revision ? 3 : 2
const ytdCaption = computed(() => props.ytdLabel ?? `Jan–${months[new Date().getMonth() - 1] ?? '—'} ${new Date().getFullYear()}`)
const accountRows = computed<BudgetAccount[]>(() => {
	const result = new Map<number, BudgetAccount>((hasActions.value ? props.accounts : []).map((account) => [account.id, account]))
	for (const line of props.lines)
		if (!result.has(line.account_id))
			result.set(line.account_id, {
				id: line.account_id,
				code: line.account_code,
				name: line.account_name,
				section: line.section,
				prefix: line.prefix,
				sign: line.sign
			})
	return [...result.values()]
})
const groups = computed(() => {
	const result = new Map<string, BudgetAccount[]>()
	for (const account of accountRows.value) {
		const hasMatch = `${account.code} ${account.name} ${account.section}`.toLowerCase().includes(query.value.trim().toLowerCase())
		if (!hasMatch) continue
		const key = account.section
		if (!result.has(key)) result.set(key, [])
		result.get(key)!.push(account)
	}
	return [...result.entries()]
		.map(([name, accounts]) => ({ name, accounts, capex: accounts[0]?.prefix === 'CPX' }))
		.sort((a, b) => sectionRank(a.name) - sectionRank(b.name))
})
watch(
	() => props.lines,
	(lines) => {
		for (const line of lines) expanded[line.section] = true
	},
	{ immediate: true }
)
const linesFor = (id: number) => props.lines.map((line, index) => ({ line, index })).filter((item) => item.line.account_id === id)
const monthTotal = (accountId: number, month: number, initial = false) =>
	(initial ? props.initialLines : props.lines).filter((line) => line.account_id === accountId).reduce((n, line) => n + (line.months[month] ?? 0), 0)
const amountTotal = (accountId: number, initial = false) =>
	(initial ? props.initialLines : props.lines).filter((line) => line.account_id === accountId).reduce((n, line) => n + sumLine(line), 0)
const pct = (old: number, next: number) => {
	const value = old ? ((next - old) / Math.abs(old)) * 100 : next > 0 ? 100 : next < 0 ? -100 : 0
	return `${value.toLocaleString('id-ID', { maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: 'always' })}%`
}
const ytdTotal = (accounts: BudgetAccount[]) => accounts.reduce((sum, account) => sum + (props.ytd?.[account.code] ?? 0) * account.sign, 0)

const accountCount = computed(() => new Set(props.lines.map((line) => line.account_id)).size)
const total = computed(() => sumDocument(props.lines))
const initialTotal = computed(() => sumDocument(props.initialLines))
function add(account: BudgetAccount) {
	props.lines.push({
		account_id: account.id,
		account_code: account.code,
		account_name: account.name,
		section: account.section,
		prefix: account.prefix,
		sign: account.sign,
		code: '',
		description: '',
		months: Array(12).fill(0)
	})
	expanded[account.section] = true
}
function fill(line: BudgetLine, index: number) {
	const value = Number(fillValues[index] ?? 0)
	if (!Number.isFinite(value) || value < 0) return
	for (let i = props.revision ? props.start - 1 : 0; i < 12; i++) line.months[i] = value
}
function remove(index: number) {
	props.lines.splice(index, 1)
	for (const key of Object.keys(fillValues)) delete fillValues[key]
}
function sectionTotal(accounts: BudgetAccount[], initial = false, month?: number) {
	return accounts.reduce((sum, a) => sum + (month === undefined ? amountTotal(a.id, initial) : monthTotal(a.id, month, initial)) * a.sign, 0)
}
</script>
<template>
	<div class="space-y-3">
		<div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
			<div class="flex flex-wrap items-center gap-x-5 gap-y-2">
				<Input v-model="query" placeholder="Cari akun (kode / nama)…" class="!w-64"
					><template #suffix
						><Button v-if="query" variant="subtle" size="sm" aria-label="Hapus pencarian" @click="query = ''"
							><IconX class="h-4 w-4" /></Button></template
				></Input>
				<template v-if="revision"
					><Checkbox v-model="freezeYtd" label="Freeze Capaian YTD" /><Checkbox v-model="freezeTotal" label="Freeze Total Budget"
				/></template>
			</div>
			<div class="flex flex-wrap gap-x-6 gap-y-2 text-s text-ink-muted">
				<span v-if="revision"
					>Budget awal <strong class="ml-1 text-ink"><Amount :value="initialTotal" /></strong
				></span>
				<span
					>Laba Rugi Setelah Belanja Modal <strong class="ml-1 text-ink"><Amount :value="total" /></strong
				></span>
				<span v-if="revision"
					>Perubahan <strong class="ml-1 text-ink">{{ pct(initialTotal, total) }}</strong></span
				>
				<span v-else
					>Akun terisi <strong class="text-ink">{{ accountCount }}</strong> · Rincian <strong class="text-ink">{{ lines.length }}</strong></span
				>
			</div>
		</div>
		<div class="matrix-scroll overflow-auto rounded-md">
			<table
				class="matrix w-full text-s"
				:class="[
					revision ? 'revision' : 'budget',
					{ 'has-actions': hasActions, 'unfreeze-ytd': revision && !freezeYtd, 'unfreeze-total': revision && !freezeTotal }
				]"
			>
				<thead>
					<tr>
						<th v-if="hasActions" :rowspan="headRows" class="sticky-col action-col">Aksi</th>
						<th :rowspan="headRows" class="sticky-col name-col">
							Akun / Rincian <span v-if="hasActions" class="text-danger">*</span
							><span class="block text-xs font-normal">Kode rincian + deskripsi</span>
						</th>
						<th :rowspan="headRows" class="sticky-col ytd-col text-center">
							Capaian YTD<br /><span class="inline-flex items-center gap-1 text-xs font-normal"
								><IconLock v-if="ytdFrozen" class="h-3 w-3" title="Dibekukan saat disetujui" />{{ ytdCaption }}</span
							><Checkbox
								v-if="!hideAllYtd"
								:model-value="allYtd"
								label="Tampilkan Semua Departemen"
								class="mt-1 !items-start !gap-1.5 text-center !text-xs !font-normal leading-tight"
								@update:model-value="emit('update:allYtd', $event)"
							/>
						</th>
						<th v-for="q in 4" :key="q" :colspan="revision ? 6 : 3" class="quarter">Q{{ q }} (Quarter {{ q }})</th>
						<th :rowspan="headRows" class="sticky-col total-col text-right">{{ revision ? 'Budget Total' : 'Total' }}</th>
						<th v-if="revision" :rowspan="headRows" class="sticky-col revised-col text-right">Total Setelah Revisi</th>
						<th v-if="revision" :rowspan="headRows" class="sticky-col pct-col text-right">(%)</th>
					</tr>
					<!-- revision: month group row ("Januari" over Budget | Revisi); budget: the month label itself -->
					<tr>
						<template v-if="revision"
							><th v-for="name in monthNames" :key="name" colspan="2" class="month">{{ name }}</th></template
						><template v-else
							><th v-for="m in months" :key="m" class="number-col">{{ m }}</th></template
						>
					</tr>
					<tr v-if="revision">
						<template v-for="m in months" :key="m"
							><th class="number-col">Budget</th>
							<th class="number-col">Revisi</th></template
						>
					</tr>
				</thead>
				<tbody>
					<template v-for="(group, groupIndex) in groups" :key="group.name">
						<tr v-if="!query && (groupIndex === 0 || groups[groupIndex - 1]?.capex !== group.capex)" class="group-row">
							<th class="sticky-col group-label" :colspan="hasActions ? 2 : 1">
								{{ group.capex ? 'CAPEX — BELANJA MODAL / ASET' : 'OPEX — BIAYA OPERASIONAL' }}
							</th>
							<td :colspan="revision ? 28 : 14" />
						</tr>
						<tr class="section-row">
							<th class="sticky-col group-label" :colspan="hasActions ? 2 : 1">
								<button type="button" class="flex items-center gap-1 text-left" @click="expanded[group.name] = !expanded[group.name]">
									<IconChevronDown v-if="expanded[group.name] || query" class="h-4 w-4" /><IconChevronRight v-else class="h-4 w-4" /> {{ group.name }}
									<span class="text-s font-normal text-ink-muted">· {{ lines.filter((l) => l.section === group.name).length }} rincian</span>
								</button>
							</th>
							<td :colspan="revision ? 28 : 14" />
						</tr>
						<template v-if="expanded[group.name] || query" v-for="account in group.accounts" :key="account.id">
							<tr class="account-row">
								<td v-if="hasActions" class="sticky-col action-col">
									<Button size="sm" variant="subtle" :aria-label="`Tambah rincian ${account.name}`" @click="add(account)"
										><IconPlus class="h-4 w-4"
									/></Button>
								</td>
								<td class="sticky-col name-col font-semibold">{{ account.code }} — {{ account.name }}</td>
								<td class="sticky-col ytd-col text-right"><Amount v-if="ytd" :value="ytd[account.code] ?? 0" /><span v-else>—</span></td>
								<template v-if="linesFor(account.id).length"
									><template v-for="(_, i) in months" :key="i"
										><td v-if="revision" class="text-right"><Amount :value="monthTotal(account.id, i, true)" /></td>
										<td class="text-right"><Amount :value="monthTotal(account.id, i)" /></td></template
								></template>
								<td v-else :colspan="revision ? 24 : 12" class="text-center text-ink-subtle">Klik + untuk menambah rincian budget pada akun ini.</td>
								<td class="sticky-col total-col text-right"><Amount :value="amountTotal(account.id, revision)" /></td>
								<td v-if="revision" class="sticky-col revised-col text-right"><Amount :value="amountTotal(account.id)" /></td>
								<td v-if="revision" class="sticky-col pct-col text-right">{{ pct(amountTotal(account.id, true), amountTotal(account.id)) }}</td>
							</tr>
							<tr v-for="item in linesFor(account.id)" :key="item.index" class="detail-row">
								<td v-if="hasActions" class="sticky-col action-col">
									<Button size="sm" variant="subtle" :aria-label="`Hapus rincian ${item.line.code || account.name}`" @click="remove(item.index)"
										><IconTrash class="h-4 w-4 text-danger"
									/></Button>
								</td>
								<td class="sticky-col name-col">
									<template v-if="!hasActions"
										><span class="text-s font-semibold">{{ item.line.code }}</span> {{ item.line.description }}</template
									>
									<div v-else class="space-y-0.5">
										<!-- row 1: kode rincian | quick fill (nominal per bulan + repeat button copies it into every editable month); row 2: deskripsi -->
										<div class="flex items-center gap-1">
											<Input
												v-model="item.line.code"
												ghost
												dense
												class="min-w-0 flex-1"
												:aria-label="`Kode rincian ${account.name}`"
												:placeholder="codeExample(year, account.prefix)"
											/>
											<MoneyInput
												:model-value="Number(fillValues[item.index] ?? 0)"
												ghost
												dense
												blank-zero
												placeholder="Rp / bulan"
												class="shrink-0 !w-24"
												:aria-label="`Isi semua bulan ${account.name}`"
												@update:model-value="fillValues[item.index] = String($event)"
											/>
											<button
												type="button"
												title="Isi semua bulan dengan nominal ini"
												:aria-label="`Isi 12 bulan ${account.name}`"
												class="shrink-0 rounded-md p-1 text-ink-muted hover:bg-fill hover:text-ink"
												@click="fill(item.line, item.index)"
											>
												<IconRepeat class="h-4 w-4" />
											</button>
										</div>
										<Input
											v-model="item.line.description"
											ghost
											dense
											:aria-label="`Deskripsi rincian ${account.name}`"
											placeholder="Deskripsi rincian"
										/>
									</div>
								</td>
								<td class="sticky-col ytd-col" />
								<template v-for="(m, i) in months" :key="m"
									><td v-if="revision" class="text-right"><Amount :value="initialLines[item.index]?.months[i]" /></td>
									<td :class="{ 'text-right': readonly, 'relative !p-0': !readonly && !(revision && i < start - 1) }">
										<Amount v-if="readonly" :value="item.line.months[i]" />
										<span v-else-if="revision && i < start - 1" class="flex justify-end gap-1 text-ink-muted"
											><HelpTip text="Bulan sebelum periode revisi mengikuti budget awal." /><Amount :value="item.line.months[i]" muted /></span
										><MoneyInput
											v-else
											:model-value="item.line.months[i]"
											cell
											dense
											blank-zero
											placeholder="0"
											class="!absolute inset-0 !w-auto"
											:aria-label="`${revision ? 'Revisi' : 'Budget'} ${m} ${account.name}`"
											@update:model-value="item.line.months[i] = $event"
										/></td
								></template>
								<td class="sticky-col total-col text-right">
									<Amount :value="revision ? sumLine(initialLines[item.index] ?? item.line) : sumLine(item.line)" />
								</td>
								<td v-if="revision" class="sticky-col revised-col text-right"><Amount :value="sumLine(item.line)" /></td>
								<td v-if="revision" class="sticky-col pct-col text-right">
									{{ pct(sumLine(initialLines[item.index] ?? item.line), sumLine(item.line)) }}
								</td>
							</tr>
						</template>
						<tr v-if="!query && (groupIndex === groups.length - 1 || groups[groupIndex + 1]?.capex !== group.capex)" class="subtotal-row">
							<th class="sticky-col group-label text-left" :colspan="hasActions ? 2 : 1">
								{{ group.capex ? 'Belanja Modal' : 'Laba (Rugi)' }}
							</th>
							<td class="sticky-col ytd-col text-right">
								<Amount v-if="ytd" :value="ytdTotal(groups.filter((g) => g.capex === group.capex).flatMap((g) => g.accounts))" /><span v-else>—</span>
							</td>
							<template v-for="(_, i) in months" :key="i"
								><td v-if="revision" class="text-right">
									<Amount
										:value="
											sectionTotal(
												groups.filter((g) => g.capex === group.capex).flatMap((g) => g.accounts),
												true,
												i
											)
										"
									/>
								</td>
								<td class="text-right">
									<Amount
										:value="
											sectionTotal(
												groups.filter((g) => g.capex === group.capex).flatMap((g) => g.accounts),
												false,
												i
											)
										"
									/></td
							></template>
							<td class="sticky-col total-col text-right">
								<Amount
									:value="
										sectionTotal(
											groups.filter((g) => g.capex === group.capex).flatMap((g) => g.accounts),
											revision
										)
									"
								/>
							</td>
							<td v-if="revision" class="sticky-col revised-col text-right">
								<Amount :value="sectionTotal(groups.filter((g) => g.capex === group.capex).flatMap((g) => g.accounts))" />
							</td>
							<td v-if="revision" class="sticky-col pct-col text-right">
								{{
									pct(
										sectionTotal(
											groups.filter((g) => g.capex === group.capex).flatMap((g) => g.accounts),
											true
										),
										sectionTotal(groups.filter((g) => g.capex === group.capex).flatMap((g) => g.accounts))
									)
								}}
							</td>
						</tr>
					</template>
				</tbody>
				<tfoot>
					<tr>
						<th class="sticky-col group-label text-left" :colspan="hasActions ? 2 : 1">Laba Rugi Setelah Belanja Modal</th>
						<td class="sticky-col ytd-col text-right">
							<Amount v-if="ytd" :value="ytdTotal(groups.flatMap((g) => g.accounts))" /><span v-else>—</span>
						</td>
						<template v-for="(_, i) in months" :key="i"
							><td v-if="revision" class="text-right"><Amount :value="initialLines.reduce((n, l) => n + (l.months[i] ?? 0) * l.sign, 0)" /></td>
							<td class="text-right"><Amount :value="lines.reduce((n, l) => n + (l.months[i] ?? 0) * l.sign, 0)" /></td
						></template>
						<td class="sticky-col total-col text-right"><Amount :value="revision ? initialTotal : total" /></td>
						<td v-if="revision" class="sticky-col revised-col text-right"><Amount :value="total" /></td>
						<td v-if="revision" class="sticky-col pct-col text-right">{{ pct(initialTotal, total) }}</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</div>
</template>
<style scoped>
.matrix-scroll {
	max-height: 650px;
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
	border-bottom: 1px solid rgb(var(--c-hairline));
	white-space: nowrap;
	background: rgb(var(--c-panel));
}
.matrix th {
	font-weight: 600;
}
.matrix thead th {
	position: sticky;
	z-index: 4;
	top: 0;
	background: rgb(var(--c-fill));
	color: rgb(var(--c-ink-muted));
	border-bottom: 0; /* grey band, no lines between the header rows */
}
.matrix thead tr:nth-child(2) th {
	top: 50px;
	height: 34px;
}
.matrix thead tr:nth-child(3) th {
	top: 84px;
}
.matrix .quarter {
	text-align: center;
	height: 50px;
}
.matrix .number-col,
.matrix td {
	min-width: 120px;
}
.matrix .sticky-col {
	position: sticky;
	z-index: 2;
}
.matrix thead .sticky-col {
	z-index: 7;
}
.has-actions .action-col {
	left: 0;
	min-width: 48px;
	max-width: 48px;
	width: 48px;
}
.matrix .name-col,
.matrix .group-label {
	left: 0;
	min-width: 300px;
	max-width: 300px;
	width: 300px;
	white-space: normal;
}
.has-actions .name-col {
	left: 48px;
}
.matrix.has-actions .ytd-col {
	left: 348px;
}
.matrix .ytd-col {
	left: 300px;
	min-width: 140px;
	max-width: 140px;
	width: 140px;
	white-space: normal;
}
.matrix .total-col {
	right: 0;
	width: 135px;
	min-width: 135px;
	max-width: 135px;
	white-space: normal;
	background: rgb(var(--c-fill));
}
.revision .total-col {
	right: 230px;
}
.revision .revised-col {
	right: 95px;
	width: 135px;
	min-width: 135px;
	max-width: 135px;
	white-space: normal;
	background: rgb(var(--c-fill));
}
.revision .pct-col {
	right: 0;
	width: 95px;
	min-width: 95px;
	max-width: 95px;
	background: rgb(var(--c-fill));
}
.matrix .group-row th,
.matrix .group-row td {
	background: rgb(var(--c-ink-muted));
	color: white;
}
.matrix .section-row th,
.matrix .section-row td,
.matrix .subtotal-row th,
.matrix .subtotal-row td,
.matrix tfoot th,
.matrix tfoot td {
	background: rgb(var(--c-fill));
}
.matrix tfoot th,
.matrix tfoot td {
	position: sticky;
	bottom: 0;
	z-index: 3;
	font-weight: 600;
}
.matrix tfoot .sticky-col {
	z-index: 5;
}
.matrix tbody td.total-col,
.matrix tfoot td.total-col {
	background: rgb(var(--c-panel));
}
/* Revision table: Budget Total is grey in every row, like Total Setelah Revisi and (%) beside it. */
.matrix.revision tbody td.total-col,
.matrix.revision tfoot td.total-col {
	background: rgb(var(--c-fill));
}
/* Summary rows (section, subtotal, grand total) stay grey across the pinned Total column too. */
.matrix tbody .section-row td.total-col,
.matrix tbody .subtotal-row td.total-col,
.matrix tfoot td.total-col {
	background: rgb(var(--c-fill));
}
/* Released column groups (revision table): stop pinning horizontally. Header and footer keep their vertical pin. */
.matrix.unfreeze-ytd .ytd-col {
	left: auto;
}
.matrix.unfreeze-total .total-col,
.matrix.unfreeze-total .revised-col,
.matrix.unfreeze-total .pct-col {
	right: auto;
}
.matrix.unfreeze-ytd tbody .ytd-col,
.matrix.unfreeze-total tbody .total-col,
.matrix.unfreeze-total tbody .revised-col,
.matrix.unfreeze-total tbody .pct-col {
	position: static;
}
/* ...and must scroll under the pinned account column, not over it. */
.matrix.unfreeze-ytd thead .ytd-col,
.matrix.unfreeze-total thead .total-col,
.matrix.unfreeze-total thead .revised-col,
.matrix.unfreeze-total thead .pct-col {
	z-index: 4;
}
.matrix.unfreeze-ytd tfoot .ytd-col,
.matrix.unfreeze-total tfoot .total-col,
.matrix.unfreeze-total tfoot .revised-col,
.matrix.unfreeze-total tfoot .pct-col {
	z-index: 3;
}
</style>
