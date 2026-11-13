<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconCopy, IconFileSpreadsheet, IconPlus } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Button from '@/components/base/Button.vue'
import Select from '@/components/base/Select.vue'
import Input from '@/components/base/Input.vue'
import FormField from '@/components/base/FormField.vue'
import Tabs from '@/components/base/Tabs.vue'
import Badge from '@/components/base/Badge.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ClosingBadge from '@/components/common/ClosingBadge.vue'
import OutlookSummary from '../components/OutlookSummary.vue'
import OutlookDailyGrid from '../components/OutlookDailyGrid.vue'
import OutlookResumeGrid from '../components/OutlookResumeGrid.vue'
import OutlookLampiran from '../components/OutlookLampiran.vue'
import ColumnDateModal from '../components/ColumnDateModal.vue'
import DuplicateModal from '../components/DuplicateModal.vue'
import { fetchState, failText, useOutlookApi, type Written } from '../api'
import { exportOutlook } from '../excel'
import { MONTHS, type DuplicateConflict, type Flow, type OutlookRow, type OutlookState, type OutlookStateFull } from '../types'

const route = useRoute()
const router = useRouter()
const company = useCompanyStore()
const toast = useToast()
const confirm = useConfirm()
const { send } = useOutlookApi()

const now = new Date()
const validYear = (v: unknown) => Number.isInteger(Number(v)) && Number(v) >= 2000 && Number(v) <= 2100
const year = ref(validYear(route.query.year) ? Number(route.query.year) : now.getFullYear())
const month = ref(Number(route.query.month) >= 1 && Number(route.query.month) <= 12 ? Number(route.query.month) : now.getMonth() + 1)
const yearText = ref(String(year.value))

const state = ref<OutlookState | null>(null)
const loading = ref(true)
const failed = ref(false)
const tab = ref('daily')
const creating = ref(false)
const exporting = ref(false)
let generation = 0

const full = computed<OutlookStateFull | null>(() => (state.value?.exists ? state.value : null))
// Locked = month closed in Posting: read-only, edit controls are hidden (ClosingBadge instead).
const editable = computed(() => !!full.value && full.value.can_edit && !full.value.period.locked)
const companyName = computed(() => company.active?.legal_name ?? company.active?.short_name ?? '-')
const emptyLocked = computed(() => state.value && !state.value.exists && state.value.locked)

async function load() {
	const current = ++generation
	loading.value = true
	failed.value = false
	try {
		const s = await fetchState(year.value, month.value)
		if (current === generation) state.value = s
	} catch (err) {
		if (current !== generation) return
		failed.value = true
		toast.error(failText(err, 'Gagal memuat Outlook Daily. Muat ulang halaman lalu coba lagi.'))
	} finally {
		if (current === generation) loading.value = false
	}
}
// A failed cell save reloads the period so the grid shows what the server really has.
const reload = () => load()

function apply(res: Written | null) {
	if (res) state.value = res.state
	else void reload()
	return res
}

function syncRoute() {
	void router.replace({ query: { year: year.value, month: month.value } })
	void load()
}
function setMonth(v: string) {
	month.value = Number(v)
	syncRoute()
}
function commitYear() {
	const v = yearText.value.trim()
	if (!/^\d{4}$/.test(v) || !validYear(v)) {
		yearText.value = String(year.value)
		toast.error('Tahun harus 4 digit antara 2000 dan 2100.')
		return
	}
	if (Number(v) === year.value) return
	year.value = Number(v)
	syncRoute()
}

onMounted(load)
// The active company drives the data: switching it reloads the period.
watch(() => company.activeId, load)

async function createPeriod() {
	if (creating.value) return
	creating.value = true
	try {
		const res = await send<unknown>('post', '/outlook/periods', { year: year.value, month: month.value })
		if (res) state.value = res.state
	} finally {
		creating.value = false
	}
}

// ---- grid actions (cells auto-save quietly; failures toast and reload) ----
interface EntryPayload {
	category_id: number
	kind: 'ol' | 'actual'
	week_no: number
	slot?: number
	amount: number | null
}
async function saveEntry(p: EntryPayload) {
	if (!full.value) return
	apply(await send('put', `/outlook/periods/${full.value.period.id}/entries`, p, false))
}
async function saveBalance(amount: number | null) {
	if (!full.value) return
	apply(await send('put', `/outlook/periods/${full.value.period.id}/opening-balance`, { amount }, false))
}
async function addCategory(p: { parent_id: number | null; flow: Flow; name: string }) {
	if (!full.value) return
	const res = await send<{ reset: { ol: number; actual: number } }>('post', `/outlook/periods/${full.value.period.id}/categories`, {
		parent_id: p.parent_id,
		flow_type: p.flow,
		name: p.name
	})
	if (!res) return
	state.value = res.state
	const reset = res.result?.reset
	if (reset && (reset.ol || reset.actual))
		toast.warning(`Kategori induk kini memiliki sub kategori, sehingga OL (${reset.ol} isian) dan actual (${reset.actual} isian) miliknya direset.`)
}
async function renameCategory(id: number, name: string) {
	if (full.value) apply(await send('put', `/outlook/periods/${full.value.period.id}/categories/${id}`, { name }))
}
function removeCategory(row: OutlookRow) {
	const f = full.value
	if (!f) return
	const filled = row.ol_total !== 0 || row.actual_total !== 0
	let message = 'Kategori kosong ini akan dihapus.'
	if (!row.is_leaf) message = `Kategori ini beserta semua sub kategorinya${filled ? ' dan seluruh nilai OL/actual-nya' : ''} akan dihapus.`
	else if (filled) message = 'Kategori ini berisi OL/actual. Kategori beserta seluruh nilainya akan dihapus.'
	confirm.ask({ type: 'danger', title: 'Hapus kategori?', message, confirmText: 'Hapus' }, async () => {
		apply(await send('delete', `/outlook/periods/${f.period.id}/categories/${row.id}`))
	})
}

// ---- column dates ----
const col = ref<{ open: boolean; week: number; slot: number }>({ open: false, week: 1, slot: 1 })
const colSaving = ref(false)
const colWeek = computed(() => full.value?.weeks.find((w) => w.week_no === col.value.week) ?? null)
function pick(week: number, slot: number) {
	col.value = { open: true, week, slot }
}
async function saveColumn(start: string, end: string, ok: boolean | string) {
	const f = full.value
	if (!f || colSaving.value) return
	colSaving.value = true
	try {
		const res = await send('put', `/outlook/periods/${f.period.id}/columns/${col.value.week}/${col.value.slot}`, { start, end }, ok)
		if (res) {
			state.value = res.state
			col.value.open = false
		}
	} finally {
		colSaving.value = false
	}
}
function clearColumn() {
	const f = full.value
	const wi = f?.weeks.findIndex((w) => w.week_no === col.value.week) ?? -1
	if (!f || wi < 0) return
	const hasActual = f.calc.rows.some((r) => r.is_leaf && (r.actual_day[wi][col.value.slot - 1] ?? 0) !== 0)
	if (!hasActual) return void saveColumn('', '', true)
	col.value.open = false
	confirm.ask(
		{ type: 'danger', title: 'Kosongkan kolom?', message: 'Seluruh actual pada kolom ini akan dihapus.', confirmText: 'Kosongkan' },
		async () => {
			const res = await send('put', `/outlook/periods/${f.period.id}/columns/${col.value.week}/${col.value.slot}`, { start: '', end: '' })
			apply(res)
		}
	)
}

// ---- duplicate ----
const dupOpen = ref(false)
const dupSaving = ref(false)
async function runDuplicate(target: { target_year: number; target_month: number }, replace: boolean) {
	const f = full.value
	if (!f || dupSaving.value) return
	dupSaving.value = true
	try {
		const res = await api.post<{ data: { state: OutlookStateFull; result: { year: number; month: number } }; message: string }>(
			`/outlook/periods/${f.period.id}/duplicate`,
			{ ...target, replace }
		)
		dupOpen.value = false
		year.value = res.data.data.result.year
		month.value = res.data.data.result.month
		yearText.value = String(year.value)
		state.value = res.data.data.state
		void router.replace({ query: { year: year.value, month: month.value } })
		toast.success(
			replace
				? 'Template diganti. Kategori periode ini disalin; OL dan actual lama di periode tujuan dihapus, saldo awal dan tanggal kolom dipertahankan.'
				: 'Periode diduplikasi. Hanya kategori yang disalin; OL, actual, saldo awal, dan tanggal kolom periode baru masih kosong.'
		)
	} catch (err) {
		const conflict = axios.isAxiosError(err) && err.response?.status === 409 ? (err.response.data?.data as DuplicateConflict | undefined) : undefined
		if (conflict?.exists && !replace) {
			const label = `${MONTHS[conflict.month - 1]} ${conflict.year}`
			confirm.ask(
				{
					type: 'danger',
					title: `Ganti template ${label}?`,
					message: `${label} sudah memiliki Outlook Daily (${conflict.categories} kategori, ${conflict.ol_rows} isian OL, ${conflict.actual_rows} isian actual). Jika dilanjutkan, SEMUA kategori beserta OL dan actual di ${label} akan dihapus dan diganti dengan template dari periode ini. Saldo awal dan tanggal kolom ${label} tidak berubah.`,
					confirmText: 'Ya, ganti'
				},
				() => runDuplicate(target, true)
			)
		} else toast.error(failText(err, 'Gagal menduplikasi periode. Coba lagi.'))
	} finally {
		dupSaving.value = false
	}
}

async function download() {
	if (!full.value || exporting.value) return
	exporting.value = true
	try {
		await exportOutlook(full.value, companyName.value)
		toast.success('File Excel diunduh')
	} catch {
		toast.error('Gagal membuat file Excel. Coba lagi.')
	} finally {
		exporting.value = false
	}
}

const tabs = [
	{ label: 'Daily', value: 'daily' },
	{ label: 'Resume Weekly', value: 'resume' },
	{ label: 'Lampiran', value: 'lampiran' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader
			title="Outlook Daily"
			subtitle="Pantau target (OL) dan realisasi arus kas harian per minggu, lalu cocokkan saldo akhirnya dengan saldo kas/bank"
		>
			<template #actions>
				<div v-if="full" class="flex flex-wrap items-center gap-2">
					<Button v-if="full.can_edit" variant="outline" @click="dupOpen = true"
						><IconCopy class="h-4 w-4" /> Duplikasi Untuk Periode Selanjutnya</Button
					>
					<Button :loading="exporting" @click="download"><IconFileSpreadsheet class="h-4 w-4" /> Unduh Excel</Button>
				</div>
			</template>
		</PageHeader>

		<Panel>
			<div class="flex flex-wrap items-end gap-x-8 gap-y-3">
				<FormField label="Company">
					<p class="py-1.5 text-l font-semibold text-ink">{{ companyName }}</p>
				</FormField>
				<FormField label="Periode">
					<div class="flex gap-2">
						<Select
							:model-value="String(month)"
							:options="MONTHS.map((m, i) => ({ label: m, value: String(i + 1) }))"
							class="w-40"
							@update:model-value="setMonth"
						/>
						<Input
							v-model="yearText"
							type="number"
							inputmode="numeric"
							aria-label="Tahun periode"
							mono
							class="w-24"
							@blur="commitYear"
							@keydown.enter.prevent="commitYear"
						/>
					</div>
				</FormField>
				<FormField v-if="full" label="Status">
					<div class="py-1.5">
						<ClosingBadge v-if="full.period.locked" />
						<Badge v-else tone="info">Terbuka</Badge>
					</div>
				</FormField>
			</div>
			<p v-if="full?.period.locked" class="mt-3 text-s text-ink-muted">
				Bulan ini sudah di-closing di Posting. Data hanya dapat dibaca; untuk mengubah, buka closing periode di Posting › Closing Periode.
			</p>
		</Panel>

		<Panel v-if="loading"><Skeleton :lines="6" /></Panel>
		<Panel v-else-if="failed">
			<EmptyState title="Outlook Daily tidak dapat dimuat" description="Periksa koneksi Anda, lalu coba lagi.">
				<Button class="mt-2" variant="outline" @click="load">Coba lagi</Button>
			</EmptyState>
		</Panel>
		<Panel v-else-if="state && !state.exists">
			<EmptyState :title="`Periode ${MONTHS[month - 1]} ${year} belum dibuat`">
				<p v-if="emptyLocked" class="max-w-md text-s text-ink-subtle">
					Bulan ini sudah di-closing di Posting, sehingga periode Outlook tidak dapat dibuat. Buka closing di Posting › Closing Periode bila perlu.
				</p>
				<template v-else-if="state.can_edit">
					<p class="max-w-md text-s text-ink-subtle">
						Periode dibuat dengan <strong>5 minggu</strong>, semua tanggal kolom kosong. Tanggal kolom diisi sendiri setelah periode dibuat.
					</p>
					<Button class="mt-2" :loading="creating" @click="createPeriod"><IconPlus class="h-4 w-4" /> Buat Periode</Button>
				</template>
				<p v-else class="text-s text-ink-subtle">Anda tidak memiliki hak untuk membuat periode.</p>
			</EmptyState>
		</Panel>

		<template v-else-if="full">
			<OutlookSummary :state="full" />
			<Panel>
				<div class="space-y-4">
					<Tabs v-model="tab" :tabs="tabs" />
					<OutlookDailyGrid
						v-if="tab === 'daily'"
						:state="full"
						:editable="editable"
						@entry="saveEntry"
						@balance="saveBalance"
						@pick="pick"
						@add="addCategory"
						@rename="renameCategory"
						@remove="removeCategory"
					/>
					<OutlookResumeGrid v-else-if="tab === 'resume'" :state="full" />
					<OutlookLampiran v-else :state="full" :editable="editable" @state="state = $event" />
				</div>
			</Panel>
		</template>

		<ColumnDateModal
			v-if="full"
			:open="col.open"
			:week="colWeek"
			:slot="col.slot"
			:year="full.period.year"
			:month="full.period.month"
			:saving="colSaving"
			@close="col.open = false"
			@apply="saveColumn($event.start, $event.end, true)"
			@clear="clearColumn"
		/>
		<DuplicateModal
			v-if="full"
			:open="dupOpen"
			:year="full.period.year"
			:month="full.period.month"
			:saving="dupSaving"
			@close="dupOpen = false"
			@submit="runDuplicate($event, false)"
		/>
	</div>
</template>
