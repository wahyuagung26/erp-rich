<script setup lang="ts">
import { IconArrowLeft, IconCalendarPlus, IconCalendarStats, IconDeviceFloppy, IconRefresh } from '@tabler/icons-vue'
import dayjs from 'dayjs'
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
import HelpTip from '@/components/base/HelpTip.vue'
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
const startError = computed(() => (start.value && start.value < today ? 'Tidak boleh sebelum hari ini' : ''))
const endError = computed(() => (start.value && end.value && end.value < start.value ? 'Tidak boleh sebelum tanggal mulai' : ''))
const canSave = computed(() => !!start.value && !!end.value && !startError.value && !endError.value)
// Plain-language preview of what the entered schedule does, so the user need not decode the rule.
const summary = computed(() => {
	if (!canSave.value) return ''
	const month = (m: number) => new Date(2000, m, 1).toLocaleDateString('id-ID', { month: 'long' })
	const startMonth = Number(start.value.slice(5, 7)) - 1
	const days = dayjs(end.value).diff(start.value, 'day') + 1
	const locked =
		startMonth === 0
			? 'Tidak ada bulan yang dikunci'
			: `${startMonth === 1 ? 'Januari' : `Januari–${month(startMonth - 1)}`} dikunci sebagai Budget Awal`
	return `Dibuka ${days} hari (${date(start.value)} – ${date(end.value)}). ${locked}; revisi dimulai dari ${month(startMonth)}.`
})
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
	if (!canSave.value) return
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
				<section class="space-y-4">
					<h3 class="subhead">Status Tahun Anggaran {{ period.year }}</h3>
					<div class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
						<div class="flex min-w-0 flex-1 items-start gap-3">
							<Badge :tone="effective.tone" class="!px-2.5 !py-1 !text-m">{{ effective.label }}</Badge>
							<p class="pt-0.5 text-m text-ink">{{ effective.note }}</p>
						</div>
						<div class="flex items-center gap-1.5">
							<Switch :model-value="period.is_active" label="Buka periode revisi" :disabled="!hasSchedule || toggling" @update:model-value="toggle" />
							<HelpTip
								:text="[
									'Periode terbuka bila tombol ini aktif DAN hari ini masih dalam rentang tanggal di bawah.',
									'Matikan untuk menutup lebih awal dari tanggal berakhir; nyalakan lagi untuk membuka kembali.',
									'Tombol baru bisa dipakai setelah jadwal pertama disimpan.'
								]"
							/>
						</div>
					</div>
				</section>
				<section class="space-y-4">
					<div class="flex items-center gap-1.5">
						<h3 class="subhead !pb-0">Jadwal Periode</h3>
						<HelpTip
							:text="[
								'Bulan mulai revisi mengikuti bulan pada Tanggal Mulai.',
								'Bulan yang sudah lewat dikunci sebagai Budget Awal.',
								'Menyimpan jadwal otomatis mengaktifkan periode.'
							]"
						/>
					</div>
					<template v-if="!showForm">
						<p class="text-m text-ink-muted">Periode revisi belum dibuka. Atur jadwal bila ingin membukanya.</p>
						<Button variant="outline" @click="scheduleOpen = true"><IconCalendarPlus class="h-4 w-4" /> Atur Jadwal &amp; Buka Periode</Button>
					</template>
					<form v-else class="space-y-4" @submit.prevent="save">
						<div class="grid gap-4 sm:grid-cols-2">
							<FormField label="Tanggal mulai pembukaan" required :error="startError"><DatePicker v-model="start" :min="today" /></FormField
							><FormField label="Tanggal berakhir pembukaan" required :error="endError"><DatePicker v-model="end" :min="start || today" /></FormField>
						</div>
						<p v-if="summary" class="flex items-start gap-2 text-m text-ink">
							<IconCalendarStats class="mt-0.5 h-4 w-4 shrink-0 text-primary" />{{ summary }}
						</p>
						<div class="flex flex-wrap justify-end gap-2">
							<Button variant="secondary" @click="router.push('/budgeting/revisions')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button
							><Button type="submit" :loading="saving" :disabled="!canSave"
								><IconDeviceFloppy v-if="!saving" class="h-4 w-4" /> Simpan &amp; Aktifkan Periode</Button
							>
						</div>
					</form>
				</section>
			</div>
		</Panel>
	</div>
</template>
