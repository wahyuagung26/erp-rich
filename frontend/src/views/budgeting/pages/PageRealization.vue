<script setup lang="ts">
import { IconDownload, IconRefresh, IconSearch, IconX } from '@tabler/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import Spinner from '@/components/base/Spinner.vue'
import Select from '@/components/base/Select.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import HelpTip from '@/components/base/HelpTip.vue'
import FormField from '@/components/base/FormField.vue'
import Modal from '@/components/base/Modal.vue'
import RealizationMatrix from '../components/RealizationMatrix.vue'
import { exportRealization } from '../excel'
import { months, monthNames, type RealizationRow } from '../types'
const company = useCompanyStore()
const toast = useToast()
const thisYear = new Date().getFullYear()
const year = ref(String(thisYear))
const scope = ref('department')
const departmentId = ref<number | string | null>(null)
const departmentName = ref('')
const unbudgeted = ref(false)
const rows = ref<RealizationRow[]>([])
const loading = ref(false)
const exporting = ref(false)
const loaded = ref(false)
const allYtd = ref(false)
const ytdRows = ref<RealizationRow[]>([])
// Title shown with the result; frozen at load time so editing a filter does not relabel old data.
const resultTitle = ref('')
const yearOptions = Array.from({ length: 11 }, (_, i) => ({ label: String(thisYear - 5 + i), value: String(thisYear - 5 + i) }))
const monthOptions = monthNames.map((label, i) => ({ label, value: String(i + 1) }))
const scopeOptions = [
	{ label: 'Pilih departemen', value: 'department' },
	{ label: 'Semua departemen', value: 'all' },
	{ label: 'Tanpa departemen', value: 'none' }
]
const deptLabel = (row: Record<string, unknown>) => `${row.code} — ${row.name}`
const cutoff = computed(() => {
	if (Number(year.value) < thisYear) return 12
	return Number(year.value) > thisYear ? 0 : new Date().getMonth()
})
const dataHelp = computed(() => [
	'Angka realisasi adalah data contoh prototipe, belum terhubung ke jurnal.',
	`Jumlah YTD mencakup Januari sampai ${cutoff.value ? months[cutoff.value - 1] : 'bulan terakhir yang selesai (belum ada)'}.`
])
let generation = 0
async function fetchRows(dept: number | string, showUnbudgeted: boolean) {
	const result = await api.get<{ data: { rows: RealizationRow[] } }>('/budgeting/realization', {
		params: { year: Number(year.value), department_id: dept, show_unbudgeted: showUnbudgeted ? 1 : 0 }
	})
	return result.data.data.rows
}
async function load() {
	if (loading.value) return
	const current = ++generation
	if (scope.value === 'department' && !departmentId.value) {
		toast.error('Pilih departemen terlebih dahulu.')
		return
	}
	loading.value = true
	try {
		const dept = scope.value === 'all' ? 'all' : scope.value === 'none' ? 0 : departmentId.value!
		// The no-department bucket has no budget, so it always lists accounts that only have realization.
		const result = await fetchRows(dept, unbudgeted.value || scope.value === 'none')
		let ytd = result
		if (allYtd.value && scope.value !== 'all') ytd = await fetchRows('all', true)
		if (current !== generation) return
		rows.value = result
		ytdRows.value = ytd
		resultTitle.value = `${scope.value === 'all' ? 'Semua Departemen' : scope.value === 'none' ? 'Tanpa Departemen' : departmentName.value} (${year.value})`
		loaded.value = true
	} catch (e) {
		if (current === generation) {
			rows.value = []
			loaded.value = false
			toast.error(errorMessage(e))
		}
	} finally {
		if (current === generation) loading.value = false
	}
}
function reset() {
	generation++
	rows.value = []
	loaded.value = false
	loading.value = false
}
async function download() {
	if (exporting.value || !loaded.value) return
	exporting.value = true
	try {
		// Single-month sheet follows the last completed month (December for past years, January for a future year).
		await exportRealization(rows.value, Number(year.value), cutoff.value || 1, cutoff.value, ytdRows.value)
	} catch {
		toast.error('Gagal mengunduh Excel. Coba lagi.')
	} finally {
		exporting.value = false
	}
}

const recalcOpen = ref(false)
const recalcMonth = ref(String(new Date().getMonth() + 1))
const recalcYear = ref(String(thisYear))
const recalculating = ref(false)
function openRecalc() {
	recalcYear.value = year.value
	recalcOpen.value = true
}
async function recalculate() {
	if (recalculating.value) return
	recalculating.value = true
	const companyId = company.activeId
	try {
		const result = await api.post<{ data: { recalculated: { year: number; month: number }[] } }>('/budgeting/realization/recalculate', {
			year: Number(recalcYear.value),
			month: Number(recalcMonth.value)
		})
		if (company.activeId !== companyId) return
		const names = result.data.data.recalculated.map((item) => `${months[item.month - 1]} ${item.year}`).join(', ')
		toast.success(`Realisasi dihitung ulang untuk ${names}`)
		recalcOpen.value = false
		if (loaded.value) await load()
	} catch (e) {
		if (company.activeId === companyId) toast.error(errorMessage(e))
	} finally {
		recalculating.value = false
	}
}
watch([year, scope, departmentId], reset)
// Like legacy, ticking the unbudgeted option refreshes the result right away.
watch(unbudgeted, () => {
	if (loaded.value) load()
})
watch(allYtd, () => {
	if (loaded.value) load()
})
watch(
	() => company.activeId,
	() => {
		departmentId.value = null
		reset()
	}
)
onMounted(() => {
	if (scope.value !== 'department') load()
})
</script>
<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Realisasi Budget" subtitle="Bandingkan anggaran dengan angka sebenarnya per akun">
			<template #actions
				><div class="flex flex-wrap items-center gap-2">
					<Button v-if="loaded" variant="outline" size="sm" :loading="exporting" @click="download"
						><IconDownload v-if="!exporting" class="h-4 w-4" /> Unduh Excel</Button
					><Button variant="outline" size="sm" @click="openRecalc"><IconRefresh class="h-4 w-4" /> Hitung Ulang Realisasi</Button>
				</div></template
			>
		</PageHeader>
		<Panel class="space-y-5">
			<div class="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<FormField label="Tahun Anggaran"><Select v-model="year" :options="yearOptions" /></FormField
				><FormField label="Cakupan"><Select v-model="scope" :options="scopeOptions" /></FormField
				><FormField v-if="scope === 'department'" label="Departemen"
					><AsyncSelect
						v-model="departmentId"
						endpoint="/department"
						:option-label="deptLabel"
						placeholder="Pilih departemen"
						@select="(row) => (departmentName = row ? `${row.code} — ${row.name}` : '')" /></FormField
				><Button class="sm:justify-self-start" :loading="loading" @click="load"><IconSearch v-if="!loading" class="h-4 w-4" /> Tampilkan Data</Button>
			</div>
			<Checkbox v-if="scope !== 'none'" v-model="unbudgeted" label="Tampilkan juga akun yang punya realisasi tapi tidak dianggarkan" />
			<div v-if="loading" class="flex flex-col items-center gap-2 py-16 text-ink-muted">
				<Spinner :size="24" />
				<p class="text-s">Memuat data…</p>
			</div>
			<EmptyState v-else-if="!loaded" class="!py-16" title="Belum ada data ditampilkan" description="Pilih cakupan, lalu tekan Tampilkan Data." />
			<section v-else class="space-y-3">
				<div class="flex items-center gap-1">
					<h3 class="subhead">Perbandingan Budget dan Realisasi: {{ resultTitle }}</h3>
					<HelpTip title="Tentang data ini" :text="dataHelp" />
				</div>
				<RealizationMatrix
					v-if="rows.length"
					:rows="rows"
					:ytd-rows="ytdRows"
					:year="Number(year)"
					:all-ytd="allYtd"
					:show-all-ytd="scope !== 'all'"
					:no-department="scope === 'none'"
					@update:all-ytd="allYtd = $event"
				/>
				<EmptyState
					v-else
					class="!py-16"
					title="Belum ada data Budget atau Realisasi"
					description="Untuk departemen dan tahun yang dipilih. Coba pilih filter lain atau hitung ulang realisasi."
					><Button class="mt-3" size="sm" variant="outline" @click="openRecalc"
						><IconRefresh class="h-4 w-4" /> Hitung Ulang Realisasi</Button
					></EmptyState
				>
			</section>
		</Panel>
		<Modal :open="recalcOpen" title="Hitung Ulang Realisasi Budget" @close="recalcOpen = false">
			<p class="mb-4 text-ink-muted">
				Pilih bulan acuan. Sistem menghitung ulang realisasi untuk <strong>bulan acuan beserta dua bulan sebelumnya</strong> dari transaksi aktual
				Jurnal Umum.
			</p>
			<div class="grid gap-4 sm:grid-cols-2">
				<FormField label="Bulan Acuan"><Select v-model="recalcMonth" :options="monthOptions" /></FormField
				><FormField label="Tahun"><Select v-model="recalcYear" :options="yearOptions" /></FormField>
			</div>
			<p class="mt-4 text-s text-ink-muted">Contoh: memilih Juli 2026 menghitung ulang Mei, Juni, dan Juli 2026.</p>
			<template #footer
				><Button variant="secondary" @click="recalcOpen = false"><IconX class="h-4 w-4" /> Batal</Button
				><Button :loading="recalculating" @click="recalculate"
					><IconRefresh v-if="!recalculating" class="h-4 w-4" /> Mulai Hitung Ulang</Button
				></template
			>
		</Modal>
	</div>
</template>
