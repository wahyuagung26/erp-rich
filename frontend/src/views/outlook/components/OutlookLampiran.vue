<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { IconAlertCircle, IconCheck, IconClock, IconInfoCircle, IconLoader2, IconPlus, IconTrash } from '@tabler/icons-vue'
import Button from '@/components/base/Button.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import { useConfirm } from '@/composables/useConfirm'
import { money } from '@/utils/format'
import { cell, negative } from '../grid'
import { useOutlookApi } from '../api'
import { LAMPIRAN_MAX_TEXT, type LampiranBody, type OutlookStateFull, type SumberDana } from '../types'
import GridInput from './GridInput.vue'

// Lampiran tab: manual list of unbudgeted spend, one amount per day of the month. Information only — it never touches OL, actual or saldo.
// Every row is always editable; a changed row saves itself when a field is left. A new row is a local draft until Keterangan + Sumber Dana are filled.
const props = defineProps<{ state: OutlookStateFull; editable: boolean }>()
const emit = defineEmits<{ state: [OutlookStateFull] }>()

interface Row {
	key: string
	id: number | null
	ket: string
	src: SumberDana | ''
	hari: Record<number, number>
}
type Status = 'dirty' | 'saving' | 'ok' | 'err'

const { send } = useOutlookApi()
const confirm = useConfirm()
const rows = ref<Row[]>([])
const status = reactive<Record<string, Status>>({})
const dirty = new Set<string>()
const busy = new Set<string>()
let seq = 0

const L = computed(() => props.state.lampiran)
const nd = computed(() => new Date(props.state.period.year, props.state.period.month, 0).getDate())
const days = computed(() => Array.from({ length: nd.value }, (_, i) => i + 1))
const periodId = computed(() => props.state.period.id)

function sync() {
	const drafts = rows.value.filter((r) => r.id == null)
	const local = new Map(rows.value.filter((r) => r.id != null).map((r) => [r.id, r]))
	rows.value = [
		...L.value.rows.map((s) => {
			const mine = local.get(s.id)
			if (mine && dirty.has(mine.key)) return mine // keep what the user is still typing
			return { key: String(s.id), id: s.id, ket: s.keterangan, src: s.sumber_dana, hari: { ...s.hari } }
		}),
		...drafts
	]
}
watch(() => props.state.lampiran, sync, { immediate: true })

const rowTotal = (r: Row) => Object.values(r.hari).reduce((s, v) => s + v, 0)
const body = (r: Row): LampiranBody => ({ keterangan: r.ket, sumber_dana: r.src, hari: r.hari })

async function save(r: Row) {
	if (!props.editable) return
	if (r.id == null && (!r.ket.trim() || !r.src)) {
		status[r.key] = 'dirty'
		return
	}
	if (busy.has(r.key)) return // a draft must not be created twice; the saved result is applied when the first call returns
	busy.add(r.key)
	status[r.key] = 'saving'
	const res =
		r.id == null
			? await send<{ id: number }>('post', `/outlook/periods/${periodId.value}/lampiran`, body(r), 'Lampiran ditambahkan')
			: await send('put', `/outlook/periods/${periodId.value}/lampiran/${r.id}`, body(r), false)
	busy.delete(r.key)
	if (!res) {
		status[r.key] = 'err'
		return
	}
	dirty.delete(r.key)
	if (r.id == null) rows.value = rows.value.filter((x) => x.key !== r.key)
	status[r.key] = 'ok'
	emit('state', res.state)
}

function touch(r: Row) {
	dirty.add(r.key)
	status[r.key] = 'dirty'
}
function setDay(r: Row, d: number, v: number | null) {
	if (v) r.hari[d] = v
	else delete r.hari[d]
	touch(r)
	void save(r)
}
function pickSource(r: Row, v: string) {
	r.src = v as SumberDana | ''
	touch(r)
	void save(r)
}
function addDraft() {
	rows.value.push({ key: `n${++seq}`, id: null, ket: '', src: '', hari: {} })
}
function remove(r: Row) {
	const drop = () => {
		rows.value = rows.value.filter((x) => x.key !== r.key)
		dirty.delete(r.key)
	}
	if (r.id == null && !r.ket.trim() && !r.src && !Object.keys(r.hari).length) return drop()
	confirm.ask(
		{
			type: 'danger',
			title: 'Hapus baris Lampiran?',
			message: r.id == null ? 'Baris ini belum tersimpan dan akan dibuang.' : 'Baris ini akan dihapus dari Lampiran periode ini.',
			confirmText: 'Hapus'
		},
		async () => {
			if (r.id == null) return drop()
			const res = await send('delete', `/outlook/periods/${periodId.value}/lampiran/${r.id}`, undefined, 'Lampiran dihapus')
			if (res) emit('state', res.state)
		}
	)
}

const STATUS = {
	dirty: { icon: IconClock, cls: 'text-warning', title: 'Belum tersimpan; tersimpan otomatis saat pindah kolom' },
	saving: { icon: IconLoader2, cls: 'animate-spin text-ink-muted', title: 'Sedang menyimpan' },
	ok: { icon: IconCheck, cls: 'text-success', title: 'Tersimpan' },
	err: { icon: IconAlertCircle, cls: 'text-danger', title: 'Belum tersimpan: periksa isian lalu coba lagi' }
}

const base1 = 'border-b border-hairline px-1.5 whitespace-nowrap'
const stick = (left: string, w: string) => `sticky z-[2] ${left} ${w}`
const SRC = [
	{ label: 'Cash In', value: 'CASH_IN' },
	{ label: 'Cash Out', value: 'CASH_OUT' }
]
const srcLabel = (s: string) => SRC.find((o) => o.value === s)?.label ?? '-'
</script>

<template>
	<div class="space-y-3">
		<p class="inline-flex items-center gap-1.5 text-s text-ink-muted">
			<IconInfoCircle class="h-4 w-4 shrink-0" />
			Lampiran tidak akan mengubah total saldo bulan ini. Bisa mengisi transaksi sampai maksimal {{ L.max }} baris.{{
				editable ? '' : ' Hanya dapat dibaca karena periode sudah closing.'
			}}
		</p>
		<div class="max-h-[72vh] overflow-auto rounded-md">
			<table class="border-separate border-spacing-0 text-s">
				<thead>
					<tr class="h-8">
						<th :class="[stick('left-0', 'w-[48px] min-w-[48px]'), 'top-0 z-[4] bg-fill px-1.5 text-center font-semibold']">No</th>
						<th :class="[stick('left-[48px]', 'w-[280px] min-w-[280px]'), 'top-0 z-[4] bg-fill px-2 text-left font-semibold']">Keterangan Pengeluaran (Unbudget)</th>
						<th :class="[stick('left-[328px]', 'w-[128px] min-w-[128px]'), 'top-0 z-[4] border-r border-ink-subtle/30 bg-fill px-2 text-left font-semibold']">Sumber Dana</th>
						<th v-for="d in days" :key="d" class="sticky top-0 z-[3] w-[100px] min-w-[100px] bg-fill px-1.5 text-center font-semibold">{{ d }}</th>
						<th class="sticky top-0 z-[3] w-[120px] min-w-[120px] bg-fill px-1.5 text-center font-semibold">Total</th>
						<th v-if="editable" class="sticky top-0 z-[3] w-[48px] min-w-[48px] bg-fill" />
					</tr>
				</thead>
				<tbody>
					<tr v-if="!rows.length" class="bg-panel">
						<td :colspan="4 + nd + (editable ? 1 : 0)" class="px-3 py-3 text-ink-subtle">Belum ada data Lampiran untuk periode ini.</td>
					</tr>
					<tr v-for="(r, n) in rows" :key="r.key" class="bg-panel align-middle">
						<td :class="[base1, stick('left-0', 'w-[48px] min-w-[48px]'), 'bg-panel text-center']">
							<span class="inline-flex items-center gap-1">
								<component :is="STATUS[status[r.key]].icon" v-if="editable && status[r.key]" :class="['h-3.5 w-3.5', STATUS[status[r.key]].cls]" :title="STATUS[status[r.key]].title" />
								{{ n + 1 }}
							</span>
						</td>
						<td :class="[base1, stick('left-[48px]', 'w-[280px] min-w-[280px]'), 'bg-panel py-1']">
							<Input
								v-if="editable"
								v-model="r.ket"
								dense
								:maxlength="LAMPIRAN_MAX_TEXT"
								placeholder="Keterangan pengeluaran"
								aria-label="Keterangan"
								@input="touch(r)"
								@blur="save(r)"
							/>
							<span v-else class="block max-w-[270px] truncate" :title="r.ket">{{ r.ket }}</span>
						</td>
						<td :class="[base1, stick('left-[328px]', 'w-[128px] min-w-[128px]'), 'border-r border-ink-subtle/30 bg-panel py-1']">
							<Select v-if="editable" :model-value="r.src" dense :options="SRC" placeholder="Pilih" aria-label="Sumber Dana" @update:model-value="pickSource(r, $event)" />
							<template v-else>{{ srcLabel(r.src) }}</template>
						</td>
						<td v-for="d in days" :key="d" :class="[base1, 'text-right tnum', negative(r.hari[d]) && 'text-danger']">
							<GridInput
								v-if="editable"
								:value="r.hari[d] ?? null"
								nav="lp"
								:label="`Tanggal ${d} baris ${n + 1}`"
								@commit="setDay(r, d, $event)"
							/>
							<template v-else>{{ r.hari[d] === undefined ? '' : cell(r.hari[d], true) }}</template>
						</td>
						<td :class="[base1, 'text-right font-semibold tnum', negative(rowTotal(r)) && 'text-danger']">{{ cell(rowTotal(r), true) }}</td>
						<td v-if="editable" :class="[base1, 'text-center']">
							<button type="button" title="Hapus baris" aria-label="Hapus baris" class="rounded p-1 text-ink-muted hover:bg-fill hover:text-danger" @click="remove(r)">
								<IconTrash class="h-4 w-4" />
							</button>
						</td>
					</tr>
					<!-- vertical totals = Cash In − Cash Out -->
					<tr class="bg-fill font-semibold">
						<td :class="[stick('left-0', 'w-[48px] min-w-[48px]'), 'sticky bottom-0 bg-fill']" />
						<td :class="[stick('left-[48px]', 'w-[280px] min-w-[280px]'), 'sticky bottom-0 bg-fill px-2']">Total (Cash In − Cash Out)</td>
						<td :class="[stick('left-[328px]', 'w-[128px] min-w-[128px]'), 'sticky bottom-0 border-r border-ink-subtle/30 bg-fill']" />
						<td v-for="d in days" :key="d" :class="['sticky bottom-0 z-[1] bg-fill px-1.5 text-right tnum', negative(L.day_totals[d]) && 'text-danger']">
							{{ L.day_totals[d] === undefined ? '' : cell(L.day_totals[d], true) }}
						</td>
						<td :class="['sticky bottom-0 z-[1] bg-fill px-1.5 text-right tnum', negative(L.total) && 'text-danger']">{{ money(L.total) }}</td>
						<td v-if="editable" class="sticky bottom-0 z-[1] bg-fill" />
					</tr>
				</tbody>
			</table>
		</div>
		<div v-if="editable" class="flex items-center gap-3">
			<Button variant="outline" size="sm" :disabled="rows.length >= L.max" @click="addDraft"><IconPlus class="h-4 w-4" /> Tambah baris</Button>
			<span class="text-s text-ink-subtle">{{ rows.length }} / {{ L.max }} baris</span>
		</div>
	</div>
</template>
