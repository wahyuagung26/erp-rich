<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { IconChevronDown, IconChevronRight, IconPencil, IconPlus, IconTrash, IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import { achClass, cell, colDayName, colLabel, colTitle, dmyFull, indent, level2Tints, negative, pct, weekRange } from '../grid'
import { MAX_DEPTH, MAX_NAME, RANGE_FIRST_SLOT, RANGE_WEEK, type Agg, type Flow, type OutlookRow, type OutlookStateFull } from '../types'
import GridInput from './GridInput.vue'
import GridScroller from './GridScroller.vue'

// Daily tab: the legacy grid — Kategori + Total OL/Actual frozen on the left, then one block per week (OL, Actual, % Ach, 7 day columns).
const props = defineProps<{ state: OutlookStateFull; editable: boolean }>()
const emit = defineEmits<{
	entry: [{ category_id: number; kind: 'ol' | 'actual'; week_no: number; slot?: number; amount: number | null }]
	balance: [number | null]
	pick: [week_no: number, slot: number]
	add: [{ parent_id: number | null; flow: Flow; name: string }]
	rename: [id: number, name: string]
	remove: [row: OutlookRow]
}>()

const FROZEN = 540
const SLOTS = [0, 1, 2, 3, 4, 5, 6]
const calc = computed(() => props.state.calc)
const weeks = computed(() => props.state.weeks)
const weekNos = computed(() => weeks.value.map((w) => w.week_no))
const byId = computed(() => new Map(calc.value.rows.map((r) => [r.id, r])))
const tints = computed(() => level2Tints(calc.value.rows))
const totalCols = computed(() => 3 + weeks.value.length * 10)
const anyDate = computed(() => weeks.value.some((w) => w.slots.some(Boolean)))

const collapsed = ref<Record<number, boolean>>({})
const adding = ref<{ parent_id: number | null; flow: Flow } | null>(null)
const renaming = ref<number | null>(null)
const draft = ref('')

function hidden(r: OutlookRow): boolean {
	let p = r.parent_id
	while (p != null) {
		if (collapsed.value[p]) return true
		p = byId.value.get(p)?.parent_id ?? null
	}
	return false
}
const rowsOf = (flow: Flow) => calc.value.rows.filter((r) => r.flow_type === flow && !hidden(r))

// Shared cell classes. Sticky columns need an opaque background (set per row) so scrolled content never shows through.
const base = 'border-b border-hairline px-1.5 whitespace-nowrap'
const c1 = 'sticky left-0 z-[2] w-[300px] min-w-[300px] max-w-[300px]'
const c2 = 'sticky left-[300px] z-[2] w-[120px] min-w-[120px] max-w-[120px] text-right tnum'
const c3 = 'sticky left-[420px] z-[2] w-[120px] min-w-[120px] max-w-[120px] border-r border-r-ink-subtle/30 text-right tnum'
const weekStart = 'border-l border-l-ink-subtle/30'
const tint = 'bg-success/10'
const num = (v: number | null | undefined) => (negative(v) ? 'text-danger' : '')

async function startAdd(parent_id: number | null, flow: Flow) {
	adding.value = { parent_id, flow }
	renaming.value = null
	draft.value = ''
	if (parent_id != null) collapsed.value[parent_id] = false
	await nextTick()
	document.getElementById('outlook-add-name')?.focus()
}
async function startRename(r: OutlookRow) {
	renaming.value = r.id
	adding.value = null
	draft.value = r.name
	await nextTick()
	;(document.getElementById('outlook-rename-name') as HTMLInputElement | null)?.select()
}
function submitAdd() {
	const name = draft.value.trim()
	if (!name || !adding.value) return
	emit('add', { ...adding.value, name })
	adding.value = null
}
function submitRename() {
	const name = draft.value.trim()
	if (name && renaming.value != null) emit('rename', renaming.value, name)
	renaming.value = null
}

// Footer rows: label, aggregate, whether % Ach shows (Surplus has none) and which direction colours it.
const footers = computed<{ label: string; agg: Agg; flow: Flow | null; cls: string }[]>(() => [
	{ label: 'Total Cash In', agg: calc.value.totals.CASH_IN, flow: 'CASH_IN', cls: 'border-t-2 border-t-ink-subtle/30' },
	{ label: 'Total Cash Out', agg: calc.value.totals.CASH_OUT, flow: 'CASH_OUT', cls: '' },
	{ label: 'Surplus (Defisit)', agg: calc.value.totals.SURPLUS, flow: null, cls: '' }
])
const awal = computed(() => calc.value.saldo_awal_row)
</script>

<template>
	<div>
		<p v-if="!anyDate && editable" class="mb-3 rounded-md bg-warning-soft px-3 py-2 text-s text-warning">
			Tanggal kolom masih kosong. Klik tanda <strong>+</strong> di header kolom untuk mengisi tanggalnya (7 hari terakhir bulan lalu sampai 7 hari pertama bulan
			depan; tanggal boleh sama, tiap kolom punya isian sendiri). Actual hanya bisa diisi pada kolom bertanggal.
		</p>
		<GridScroller :weeks="weekNos" :frozen="FROZEN">
			<table class="border-separate border-spacing-0 text-s">
				<thead class="text-ink-muted">
					<tr class="h-[30px]">
						<th :class="[c1, 'top-0 z-[5] bg-fill px-3 text-left font-semibold']" rowspan="2">Kategori</th>
						<th :class="[c2, 'top-0 z-[5] bg-fill px-1.5 text-center font-semibold']" rowspan="2">Total OL<br />(1 bulan)</th>
						<th :class="[c3, 'top-0 z-[5] bg-fill px-1.5 text-center font-semibold']" rowspan="2">Total Actual<br />(1 bulan)</th>
						<th
							v-for="w in weeks"
							:key="w.week_no"
							:data-wn="w.week_no"
							colspan="10"
							:class="['sticky top-0 z-[3] bg-fill px-2 text-center font-semibold', weekStart]"
						>
							Minggu {{ w.week_no }} <small v-if="weekRange(w)" class="ml-1 font-normal text-ink-muted">{{ weekRange(w) }}</small>
						</th>
					</tr>
					<tr>
						<template v-for="w in weeks" :key="w.week_no">
							<th :class="['sticky top-[30px] z-[3] w-[112px] min-w-[112px] bg-success-soft px-1.5 text-center font-semibold', weekStart]">OL</th>
							<th class="sticky top-[30px] z-[3] w-[112px] min-w-[112px] bg-success-soft px-1.5 text-center font-semibold">Actual</th>
							<th class="sticky top-[30px] z-[3] w-[64px] min-w-[64px] bg-success-soft px-1.5 text-center font-semibold">% Ach</th>
							<th
								v-for="i in SLOTS"
								:key="i"
								:class="[
									'sticky top-[30px] z-[3] w-[100px] min-w-[100px] bg-fill p-0 text-center',
									w.week_no === RANGE_WEEK && i >= RANGE_FIRST_SLOT - 1 && 'border-b-2 border-b-info/60'
								]"
								:title="colTitle(w, i)"
							>
								<component
									:is="editable ? 'button' : 'div'"
									:type="editable ? 'button' : undefined"
									:class="['block w-full px-1.5 py-1', editable && 'hover:bg-hairline']"
									:aria-label="editable ? `Atur tanggal kolom ${i + 1} minggu ${w.week_no}` : undefined"
									@click="editable && emit('pick', w.week_no, i + 1)"
								>
									<span :class="['block text-s', w.slots[i] ? 'font-semibold text-ink' : 'text-ink-subtle']">{{ colLabel(w, i) }}</span>
									<small v-if="w.slots[i]" class="block font-normal text-ink-muted">{{ colDayName(w, i, state.period.year, state.period.month) }}</small>
								</component>
							</th>
						</template>
					</tr>
				</thead>
				<tbody>
					<!-- Saldo Awal: the month's opening bank balance is entered in the Total OL cell -->
					<tr class="bg-fill font-semibold">
						<td :class="[base, c1, 'h-[27px] bg-fill px-3']">Saldo Awal</td>
						<td :class="[base, c2, 'bg-fill', editable && '!p-0']">
							<GridInput
								v-if="editable"
								:value="state.period.saldo_awal_bank"
								nav="saldo"
								label="Saldo awal bank"
								placeholder="Belum diisi"
								nullable
								@commit="emit('balance', $event)"
							/>
							<template v-else>{{ state.period.saldo_awal_bank == null ? '-' : cell(state.period.saldo_awal_bank, true) }}</template>
						</td>
						<td :class="[base, c3, 'bg-fill', num(awal.total)]">{{ cell(awal.total, true) }}</td>
						<template v-for="(w, wi) in weeks" :key="w.week_no">
							<td :class="[base, weekStart, tint, 'text-right tnum']">{{ cell(awal.ol_week[wi], true) }}</td>
							<td :class="[base, tint, 'text-right tnum', num(awal.actual_week[wi])]">{{ cell(awal.actual_week[wi], true) }}</td>
							<td :class="[base, tint]" />
							<td
								v-for="i in SLOTS"
								:key="i"
								:class="[base, 'text-right tnum', !w.slots[i] && 'bg-fill/60', num(awal.actual_day[wi][i])]"
							>
								<template v-if="w.slots[i]">{{ cell(awal.actual_day[wi][i], true) }}</template>
							</td>
						</template>
					</tr>

					<template v-for="sec in [{ flow: 'CASH_IN' as Flow, label: 'CASH IN' }, { flow: 'CASH_OUT' as Flow, label: 'CASH OUT' }]" :key="sec.flow">
						<tr class="bg-ink-muted font-semibold text-ink-invert">
							<td :class="[c1, 'bg-ink-muted px-3 py-1']">{{ sec.label }}</td>
							<td :colspan="totalCols - 1" class="bg-ink-muted" />
						</tr>
						<template v-for="r in rowsOf(sec.flow)" :key="r.id">
							<tr :class="['group', tints[r.id] ?? 'bg-panel']">
								<td :class="[base, c1, tints[r.id] ?? 'bg-panel', 'h-[27px] !whitespace-normal']" :style="indent(r.depth)">
									<div v-if="renaming === r.id" class="flex items-center gap-1 py-0.5">
										<input
											id="outlook-rename-name"
											v-model="draft"
											:maxlength="MAX_NAME"
											aria-label="Nama kategori"
											class="h-6 min-w-0 flex-1 rounded border border-ink-subtle/30 bg-panel px-1.5 text-s text-ink"
											@keydown.enter.prevent="submitRename"
											@keydown.esc="renaming = null"
										/>
										<button type="button" title="Simpan" aria-label="Simpan nama" class="rounded p-1 text-success hover:bg-success-soft" @click="submitRename">
											<IconDeviceFloppy class="h-4 w-4" />
										</button>
										<button type="button" title="Batal" aria-label="Batal" class="rounded p-1 text-ink-muted hover:bg-fill" @click="renaming = null">
											<IconX class="h-4 w-4" />
										</button>
									</div>
									<div v-else class="flex items-start gap-1">
										<button
											v-if="!r.is_leaf"
											type="button"
											class="shrink-0 rounded p-0.5 text-ink-muted hover:bg-hairline"
											:title="collapsed[r.id] ? 'Buka sub kategori' : 'Tutup sub kategori'"
											:aria-label="collapsed[r.id] ? 'Buka sub kategori' : 'Tutup sub kategori'"
											@click="collapsed[r.id] = !collapsed[r.id]"
										>
											<IconChevronRight v-if="collapsed[r.id]" class="h-3.5 w-3.5" />
											<IconChevronDown v-else class="h-3.5 w-3.5" />
										</button>
										<span :class="['min-w-0 break-words py-0.5', !r.is_leaf && 'font-semibold']" :title="r.name">{{ r.name }}</span>
										<span v-if="editable" class="ml-auto flex shrink-0 items-center opacity-0 focus-within:opacity-100 group-hover:opacity-100">
											<button
												v-if="r.depth < MAX_DEPTH"
												type="button"
												title="Tambah sub kategori"
												aria-label="Tambah sub kategori"
												class="rounded p-1 text-ink-muted hover:bg-hairline hover:text-ink"
												@click="startAdd(r.id, r.flow_type)"
											>
												<IconPlus class="h-3.5 w-3.5" />
											</button>
											<button type="button" title="Ubah nama" aria-label="Ubah nama" class="rounded p-1 text-ink-muted hover:bg-hairline hover:text-ink" @click="startRename(r)">
												<IconPencil class="h-3.5 w-3.5" />
											</button>
											<button type="button" title="Hapus kategori" aria-label="Hapus kategori" class="rounded p-1 text-ink-muted hover:bg-hairline hover:text-danger" @click="emit('remove', r)">
												<IconTrash class="h-3.5 w-3.5" />
											</button>
										</span>
									</div>
								</td>
								<td :class="[base, c2, tints[r.id] ?? 'bg-panel', !r.is_leaf && 'font-semibold']">{{ cell(r.ol_total) }}</td>
								<td :class="[base, c3, tints[r.id] ?? 'bg-panel', !r.is_leaf && 'font-semibold', num(r.actual_total)]">{{ cell(r.actual_total) }}</td>
								<template v-for="(w, wi) in weeks" :key="w.week_no">
									<td :class="[base, weekStart, tint, 'text-right tnum', !r.is_leaf && 'font-semibold', r.is_leaf && editable && 'relative !p-0']">
										<GridInput
											v-if="r.is_leaf && editable"
											:value="r.ol_week[wi] || null"
											:nav="`ol|${w.week_no}`"
											:label="`${r.name} minggu ${w.week_no} OL`"
											@commit="emit('entry', { category_id: r.id, kind: 'ol', week_no: w.week_no, amount: $event })"
										/>
										<template v-else>{{ cell(r.ol_week[wi]) }}</template>
									</td>
									<td :class="[base, tint, 'text-right tnum', !r.is_leaf && 'font-semibold', num(r.actual_week[wi])]">{{ cell(r.actual_week[wi]) }}</td>
									<td :class="[base, 'text-center tnum', achClass(r.ach_week[wi], r.flow_type)]">{{ pct(r.ach_week[wi]) }}</td>
									<td v-for="i in SLOTS" :key="i" :class="[base, 'text-right tnum', !w.slots[i] && 'bg-fill/60', !r.is_leaf && 'font-semibold', num(r.actual_day[wi][i]), r.is_leaf && editable && 'relative !p-0']">
										<template v-if="w.slots[i]">
											<GridInput
												v-if="r.is_leaf && editable"
												:value="r.actual_day[wi][i] || null"
												:nav="`actual|${w.week_no}|${i}`"
												:label="`${r.name} tanggal ${dmyFull(w.slots[i]!)}`"
												@commit="emit('entry', { category_id: r.id, kind: 'actual', week_no: w.week_no, slot: i + 1, amount: $event })"
											/>
											<template v-else>{{ cell(r.actual_day[wi][i]) }}</template>
										</template>
									</td>
								</template>
							</tr>
							<tr v-if="adding && adding.parent_id === r.id" class="bg-panel">
								<td :class="[base, c1, 'bg-panel']" :style="indent(r.depth + 1)">
									<div class="flex items-center gap-1 py-0.5">
										<input
											id="outlook-add-name"
											v-model="draft"
											:maxlength="MAX_NAME"
											placeholder="Nama kategori baru…"
											aria-label="Nama kategori baru"
											class="h-6 min-w-0 flex-1 rounded border border-ink-subtle/30 bg-panel px-1.5 text-s text-ink placeholder:text-ink-subtle"
											@keydown.enter.prevent="submitAdd"
											@keydown.esc="adding = null"
										/>
										<button type="button" title="Simpan" aria-label="Simpan kategori" class="rounded p-1 text-success hover:bg-success-soft" @click="submitAdd">
											<IconDeviceFloppy class="h-4 w-4" />
										</button>
										<button type="button" title="Batal" aria-label="Batal" class="rounded p-1 text-ink-muted hover:bg-fill" @click="adding = null">
											<IconX class="h-4 w-4" />
										</button>
									</div>
								</td>
								<td :colspan="totalCols - 1" :class="[base, 'bg-panel']" />
							</tr>
						</template>
						<tr v-if="editable" class="bg-panel">
							<td :class="[base, c1, 'bg-panel px-3']">
								<div v-if="adding && adding.parent_id === null && adding.flow === sec.flow" class="flex items-center gap-1 py-0.5">
									<input
										id="outlook-add-name"
										v-model="draft"
										:maxlength="MAX_NAME"
										placeholder="Nama kategori baru…"
										aria-label="Nama kategori baru"
										class="h-6 min-w-0 flex-1 rounded border border-ink-subtle/30 bg-panel px-1.5 text-s text-ink placeholder:text-ink-subtle"
										@keydown.enter.prevent="submitAdd"
										@keydown.esc="adding = null"
									/>
									<button type="button" title="Simpan" aria-label="Simpan kategori" class="rounded p-1 text-success hover:bg-success-soft" @click="submitAdd">
										<IconDeviceFloppy class="h-4 w-4" />
									</button>
									<button type="button" title="Batal" aria-label="Batal" class="rounded p-1 text-ink-muted hover:bg-fill" @click="adding = null">
										<IconX class="h-4 w-4" />
									</button>
								</div>
								<button
									v-else
									type="button"
									class="inline-flex items-center gap-1 text-s font-medium text-primary-dark hover:underline"
									@click="startAdd(null, sec.flow)"
								>
									<IconPlus class="h-3.5 w-3.5" /> Tambah kategori root ({{ sec.flow === 'CASH_IN' ? 'Cash In' : 'Cash Out' }})
								</button>
							</td>
							<td :colspan="totalCols - 1" :class="[base, 'bg-panel']" />
						</tr>
					</template>

					<tr v-for="f in footers" :key="f.label" class="bg-fill font-semibold">
						<td :class="[base, c1, 'bg-fill px-3', f.cls]">{{ f.label }}</td>
						<td :class="[base, c2, 'bg-fill', f.cls]">{{ cell(f.agg.ol_total) }}</td>
						<td :class="[base, c3, 'bg-fill', f.cls, num(f.agg.actual_total)]">{{ cell(f.agg.actual_total) }}</td>
						<template v-for="(w, wi) in weeks" :key="w.week_no">
							<td :class="[base, weekStart, tint, f.cls, 'text-right tnum']">{{ cell(f.agg.ol_week[wi]) }}</td>
							<td :class="[base, tint, f.cls, 'text-right tnum', num(f.agg.actual_week[wi])]">{{ cell(f.agg.actual_week[wi]) }}</td>
							<td :class="[base, f.cls, 'text-center tnum', f.flow ? achClass(f.agg.ach_week[wi], f.flow) : tint]">{{ f.flow ? pct(f.agg.ach_week[wi]) : '' }}</td>
							<td v-for="i in SLOTS" :key="i" :class="[base, f.cls, 'text-right tnum', !w.slots[i] && 'bg-fill/60', num(f.agg.actual_day[wi][i])]">
								<template v-if="w.slots[i]">{{ cell(f.agg.actual_day[wi][i]) }}</template>
							</td>
						</template>
					</tr>

					<!-- Saldo Balance sticks to the bottom of the scroll area -->
					<tr class="font-semibold">
						<td :class="[c1, 'sticky bottom-0 z-[2] bg-fill px-3 shadow-[0_-2px_0_rgb(var(--c-hairline))]']">Saldo Balance</td>
						<td :class="[c2, 'bottom-0 bg-fill shadow-[0_-2px_0_rgb(var(--c-hairline))]']" />
						<td :class="[c3, 'bottom-0 bg-fill shadow-[0_-2px_0_rgb(var(--c-hairline))]', num(calc.saldo_akhir)]">{{ cell(calc.saldo_akhir, true) }}</td>
						<template v-for="(w, wi) in weeks" :key="w.week_no">
							<td :class="['sticky bottom-0 z-[1] bg-fill px-1.5 text-right tnum shadow-[0_-2px_0_rgb(var(--c-hairline))]', weekStart]">{{ cell(calc.saldo_ol_week[wi], true) }}</td>
							<td :class="['sticky bottom-0 z-[1] bg-fill px-1.5 text-right tnum shadow-[0_-2px_0_rgb(var(--c-hairline))]', num(calc.saldo_week[wi])]">{{ cell(calc.saldo_week[wi], true) }}</td>
							<td class="sticky bottom-0 z-[1] bg-fill shadow-[0_-2px_0_rgb(var(--c-hairline))]" />
							<td
								v-for="i in SLOTS"
								:key="i"
								:class="['sticky bottom-0 z-[1] bg-fill px-1.5 text-right tnum shadow-[0_-2px_0_rgb(var(--c-hairline))]', num(calc.saldo_day[wi][i])]"
							>
								<template v-if="w.slots[i]">{{ cell(calc.saldo_day[wi][i], true) }}</template>
							</td>
						</template>
					</tr>
				</tbody>
			</table>
		</GridScroller>
	</div>
</template>
