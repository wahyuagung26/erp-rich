<script setup lang="ts">
import { IconArrowLeft, IconCalendarPlus, IconDeviceFloppy, IconRefresh } from '@tabler/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { errorMessage } from '@/utils/errorMessage'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Button from '@/components/base/Button.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import FormField from '@/components/base/FormField.vue'
import Switch from '@/components/base/Switch.vue'
import Badge from '@/components/base/Badge.vue'
import type { RevisionPeriod } from '../types'
const router = useRouter()
const company = useCompanyStore()
const toast = useToast()
const confirm = useConfirm()
const today = new Date().toLocaleDateString('sv-SE')
const period = ref<RevisionPeriod | null>(null)
const start = ref('')
const end = ref('')
const saving = ref(false)
const toggling = ref(false)
const loading = ref(false)
const failed = ref(false)
const scheduleOpen = ref(false)
let generation = 0

// Effective status: the manual switch AND the date range decide whether revisions can be filed.
const effective = computed(() => {
	const p = period.value
	if (!p?.start_date || !p.end_date)
		return {
			label: 'Belum Diatur',
			tone: 'neutral',
			note: `Belum ada jadwal periode untuk tahun ${p?.year}. Simpan jadwal di bawah untuk mengaktifkan.`
		} as const
	if (!p.is_active)
		return {
			label: 'Ditutup',
			tone: 'danger',
			note: 'Dinonaktifkan manual. Nyalakan saklar untuk membuka kembali, selama masih dalam rentang tanggal.'
		} as const
	if (today < p.start_date)
		return {
			label: 'Terjadwal',
			tone: 'warning',
			note: `Aktif, tetapi belum mencapai tanggal mulai. Akan terbuka otomatis pada ${date(p.start_date)}.`
		} as const
	if (today > p.end_date)
		return {
			label: 'Ditutup',
			tone: 'danger',
			note: `Sudah melewati tanggal akhir (${date(p.end_date)}). Tertutup otomatis. Ubah jadwal untuk membuka periode baru.`
		} as const
	return { label: 'Terbuka', tone: 'success', note: `Departemen dapat mengajukan revisi budget sampai ${date(p.end_date)}.` } as const
})
const hasSchedule = computed(() => !!period.value?.start_date)
const showForm = computed(() => !!period.value?.is_active || scheduleOpen.value)

async function load() {
	const current = ++generation
	loading.value = true
	failed.value = false
	scheduleOpen.value = false
	try {
		const p = (await api.get<{ data: RevisionPeriod }>('/budgeting/period')).data.data
		if (current !== generation) return
		period.value = p
		start.value = p.start_date && p.start_date >= today ? p.start_date : today
		end.value = p.end_date && p.end_date >= today ? p.end_date : `${p.year}-12-31`
	} catch {
		if (current === generation) failed.value = true
	} finally {
		if (current === generation) loading.value = false
	}
}
function toggle(next: boolean) {
	const p = period.value
	if (!p?.start_date || !p.end_date || toggling.value) return
	confirm.ask(
		{
			type: 'warning',
			title: 'Konfirmasi',
			message: next
				? 'Nyalakan periode revisi untuk semua departemen?'
				: 'Matikan periode revisi? Semua departemen tidak dapat mengajukan revisi sampai dinyalakan kembali.',
			confirmText: 'Ya, Lanjut'
		},
		async () => {
			toggling.value = true
			try {
				period.value = (
					await api.put<{ data: RevisionPeriod }>('/budgeting/period', { start_date: p.start_date, end_date: p.end_date, is_active: next })
				).data.data
				toast.success(next ? 'Periode revisi diaktifkan' : 'Periode revisi dinonaktifkan')
			} finally {
				toggling.value = false
			}
		}
	)
}
async function save() {
	if (saving.value) return
	if (!start.value || !end.value) {
		toast.error('Isi tanggal mulai dan tanggal berakhir periode.')
		return
	}
	if (start.value < today || end.value < start.value) {
		toast.error('Tanggal mulai tidak boleh sebelum hari ini dan tanggal berakhir tidak boleh sebelum tanggal mulai.')
		return
	}
	saving.value = true
	const companyId = company.activeId
	try {
		// Saving a schedule activates the period, as in the legacy screen.
		const updated = (await api.put<{ data: RevisionPeriod }>('/budgeting/period', { start_date: start.value, end_date: end.value, is_active: true }))
			.data.data
		if (company.activeId !== companyId) return
		period.value = updated
		toast.success('Jadwal periode revisi disimpan dan periode diaktifkan')
	} catch (e) {
		if (company.activeId === companyId) toast.error(errorMessage(e))
	} finally {
		saving.value = false
	}
}
watch(
	() => company.activeId,
	() => load()
)
onMounted(load)
</script>
<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Periode Revisi" subtitle="Atur kapan revisi anggaran boleh diajukan" />
		<Panel>
			<p v-if="loading" class="py-8 text-ink-muted">Memuat data…</p>
			<div v-else-if="failed" class="space-y-3">
				<p>Periode tidak dapat dimuat.</p>
				<Button variant="outline" @click="load"><IconRefresh class="h-4 w-4" /> Coba lagi</Button>
			</div>
			<div v-else-if="period" class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Status Periode Tahun Anggaran {{ period.year }}</h3>
					<div class="flex flex-wrap items-center gap-x-8 gap-y-3">
						<div class="flex items-center gap-3">
							<span class="text-s text-ink-muted">Saklar manual</span>
							<Switch
								:model-value="period.is_active"
								:label="period.is_active ? 'Aktif' : 'Nonaktif'"
								:class="{ 'pointer-events-none opacity-50': !hasSchedule || toggling }"
								@update:model-value="toggle"
							/>
						</div>
						<div class="flex items-center gap-3">
							<span class="text-s text-ink-muted">Status efektif</span>
							<Badge :tone="effective.tone">{{ effective.label }}</Badge>
						</div>
					</div>
					<p class="text-s text-ink-muted">{{ effective.note }}</p>
				</section>
				<section class="space-y-3">
					<h3 class="subhead">Jadwal Periode</h3>
					<template v-if="!showForm">
						<p class="text-s text-ink-muted">Periode revisi belum dibuka. Atur jadwal di bawah bila ingin membukanya.</p>
						<Button variant="outline" @click="scheduleOpen = true"><IconCalendarPlus class="h-4 w-4" /> Atur Jadwal &amp; Buka Periode</Button>
					</template>
					<form v-else class="space-y-4" @submit.prevent="save">
						<p class="text-s text-ink-muted">
							Bulan mulai revisi mengikuti bulan pada Tanggal Mulai; bulan yang sudah lewat dikunci sebagai Budget Awal. Menyimpan jadwal otomatis
							mengaktifkan periode. Untuk menutup lebih awal, matikan saklar di atas.
						</p>
						<div class="grid gap-4 sm:grid-cols-2">
							<FormField label="Tanggal mulai pembukaan" required><DatePicker v-model="start" :min="today" /></FormField
							><FormField label="Tanggal berakhir pembukaan" required><DatePicker v-model="end" :min="start || today" /></FormField>
						</div>
						<div class="flex flex-wrap justify-end gap-2">
							<Button variant="secondary" @click="router.push('/budgeting/revisions')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button
							><Button type="submit" :loading="saving"><IconDeviceFloppy v-if="!saving" class="h-4 w-4" /> Simpan Jadwal</Button>
						</div>
					</form>
				</section>
			</div>
		</Panel>
	</div>
</template>
