<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconArrowBackUp, IconArrowLeft, IconBan, IconCheck, IconDownload, IconPencil, IconSend, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { errorMessage } from '@/utils/errorMessage'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import Amount from '@/components/base/Amount.vue'
import Modal from '@/components/base/Modal.vue'
import Textarea from '@/components/base/Textarea.vue'
import FormField from '@/components/base/FormField.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import BudgetMatrix from '../components/BudgetMatrix.vue'
import { exportDocument } from '../excel'
import { months, statusTone, type BudgetAction, type BudgetDocument } from '../types'

const props = defineProps<{ kind: 'budgets' | 'revisions' }>()
const route = useRoute()
const router = useRouter()
const company = useCompanyStore()
const toast = useToast()
const confirm = useConfirm()
const base = `/budgeting/${props.kind}`
const revision = props.kind === 'revisions'
const noun = revision ? 'revisi' : 'budget'
const doc = ref<BudgetDocument | null>(null)
const loading = ref(true)
const failed = ref(false)
const modalAction = ref<'reject' | 'unapprove' | null>(null)
const note = ref('')
const saving = ref(false)
const exporting = ref(false)
const liveYtd = ref<Record<string, number> | null>(null)
const allYtd = ref(false)

async function download() {
	if (!doc.value || exporting.value) return
	exporting.value = true
	try {
		await exportDocument(doc.value)
	} catch {
		toast.error('Gagal mengunduh Excel. Coba lagi.')
	} finally {
		exporting.value = false
	}
}

const frozen = computed(() => doc.value?.status === 'Disetujui' && !!doc.value.ytd_snapshot)
const shownYtd = computed(() => (doc.value?.status === 'Disetujui' ? doc.value.ytd_snapshot : liveYtd.value))
const ytdLabel = computed(() => {
	const d = doc.value
	if (d?.status !== 'Disetujui') return undefined
	return d.ytd_snapshot && d.ytd_snapshot_month ? `Jan–${months[d.ytd_snapshot_month - 1]} ${d.ytd_snapshot_year}` : '—'
})
const editable = computed(() => !!doc.value && ['Draft', 'Ditolak'].includes(doc.value.status))
// A budget that already has a live revision cannot be un-approved (same rule as the legacy screen).
const canUnapprove = computed(() => !revision && doc.value?.status === 'Disetujui' && !doc.value.revisions?.some((r) => r.status !== 'Dibatalkan'))
const rejection = computed(() => (doc.value?.status === 'Ditolak' ? doc.value.history.find((event) => event.to === 'Ditolak') : undefined))
const done: Record<BudgetAction, string> = {
	submit: 'diajukan',
	approve: 'disetujui',
	reject: 'ditolak',
	cancel: 'dibatalkan',
	unapprove: 'dikembalikan ke Draft'
}

async function loadYtd() {
	const d = doc.value
	if (!d || d.status === 'Disetujui') return
	try {
		liveYtd.value = (
			await api.get<{ data: { values: Record<string, number> } }>('/budgeting/ytd', {
				params: { department_id: allYtd.value ? 'all' : d.department_id }
			})
		).data.data.values
	} catch {
		liveYtd.value = null
	}
}
async function load() {
	loading.value = true
	try {
		doc.value = (await api.get<{ data: BudgetDocument }>(`${base}/${route.params.id}`)).data.data
		await loadYtd()
	} catch {
		failed.value = true
	} finally {
		loading.value = false
	}
}
// Runs one workflow action; callers decide how a failure is reported.
async function post(action: BudgetAction, text = '') {
	if (saving.value) return
	saving.value = true
	const companyId = company.activeId
	try {
		const updated = (await api.post<{ data: BudgetDocument }>(`${base}/${route.params.id}/actions`, { action, note: text })).data.data
		if (company.activeId !== companyId) return
		doc.value = updated
		toast.success(`Dokumen ${done[action]}`)
		await loadYtd()
	} finally {
		saving.value = false
	}
}
// Submit / approve / cancel only need a confirmation (failures are toasted by the confirm store).
function ask(action: 'submit' | 'approve' | 'cancel') {
	const copy = {
		submit: {
			title: `Ajukan ${noun}?`,
			message: `Dokumen dikirim ke approver dan tidak bisa diedit sampai disetujui atau ditolak.`,
			confirmText: 'Ya, Ajukan',
			type: 'warning'
		},
		approve: { title: `Setujui ${noun}?`, message: `Setujui ${noun} ini?`, confirmText: 'Ya, Setujui', type: 'info' },
		cancel: {
			title: `Batalkan ${noun}?`,
			message: revision
				? 'Dokumen revisi akan berstatus Dibatalkan dan tidak dapat diubah lagi.'
				: 'Dokumen tidak akan tampil lagi di daftar budget.',
			confirmText: 'Ya, Batalkan',
			type: 'danger'
		}
	} as const
	confirm.ask(copy[action], () => post(action))
}
function openModal(action: 'reject' | 'unapprove') {
	note.value = ''
	modalAction.value = action
}
async function submitModal() {
	const action = modalAction.value
	if (!action || saving.value) return
	if (action === 'reject' && !note.value.trim()) {
		toast.error('Isi alasan penolakan sebelum melanjutkan.')
		return
	}
	try {
		await post(action, note.value)
		modalAction.value = null
	} catch (e) {
		toast.error(errorMessage(e))
	}
}
watch(allYtd, loadYtd)
watch(
	() => company.activeId,
	(next, previous) => {
		if (previous && next !== previous) router.push(base)
	}
)
onMounted(load)
</script>
<template>
	<div class="space-y-4 p-4">
		<PageHeader
			:title="revision ? 'Detail Revisi Budget' : 'Detail Budget'"
			:subtitle="revision ? 'Lihat perubahan anggaran, status, dan riwayatnya' : 'Lihat rincian, status, dan riwayat anggaran'"
		>
			<template #actions
				><div class="flex flex-wrap items-center gap-2">
					<Badge v-if="doc" :tone="statusTone(doc.status)">{{ doc.status }}</Badge>
					<Button size="sm" variant="subtle" @click="router.push(base)"><IconArrowLeft class="h-4 w-4" /> Kembali</Button>
					<template v-if="doc">
						<Button size="sm" variant="subtle" :loading="exporting" @click="download"
							><IconDownload v-if="!exporting" class="h-4 w-4" /> Unduh Excel</Button
						>
						<template v-if="doc.status === 'Diajukan'">
							<Button size="sm" variant="danger" @click="openModal('reject')"><IconX class="h-4 w-4" /> Tolak</Button>
							<Button size="sm" @click="ask('approve')"><IconCheck class="h-4 w-4" /> Setujui</Button>
						</template>
						<Button v-if="canUnapprove" size="sm" variant="secondary" @click="openModal('unapprove')"
							><IconArrowBackUp class="h-4 w-4" /> Batalkan Approval</Button
						>
						<template v-if="editable">
							<Button size="sm" variant="secondary" @click="router.push(`${base}/edit/${doc.id}`)"><IconPencil class="h-4 w-4" /> Edit</Button>
							<Button size="sm" variant="subtle" @click="ask('cancel')"><IconBan class="h-4 w-4" /> Batalkan</Button>
							<Button size="sm" @click="ask('submit')"><IconSend class="h-4 w-4" /> Ajukan</Button>
						</template>
					</template>
				</div></template
			>
		</PageHeader>
		<Panel>
			<EmptyState v-if="failed" title="Dokumen tidak ditemukan" />
			<p v-else-if="loading" class="py-8 text-center text-ink-muted">Memuat data…</p>
			<div v-else-if="doc" class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi {{ revision ? 'Revisi' : 'Budget' }}</h3>
					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div>
							<p class="text-s text-ink-muted">Nomor</p>
							<p>{{ doc.number }}</p>
						</div>
						<div>
							<p class="text-s text-ink-muted">Departemen</p>
							<p>{{ doc.department_name }} · {{ doc.department_code }}</p>
						</div>
						<div>
							<p class="text-s text-ink-muted">Tahun Anggaran</p>
							<p>{{ doc.year }}</p>
						</div>
						<div>
							<p class="text-s text-ink-muted">Tanggal Dibuat</p>
							<p class="tnum">{{ date(doc.created_at) }}</p>
						</div>
						<div v-if="revision && doc.initial_total !== undefined">
							<p class="text-s text-ink-muted">Laba Rugi Setelah Belanja Modal (Awal)</p>
							<p><Amount :value="doc.initial_total" /></p>
						</div>
						<div>
							<p class="text-s text-ink-muted">Laba Rugi Setelah Belanja Modal{{ revision ? ' (Hasil Revisi)' : '' }}</p>
							<p class="font-semibold"><Amount :value="doc.total" /></p>
						</div>
						<div v-if="revision">
							<p class="text-s text-ink-muted">Budget Awal</p>
							<button class="text-primary-dark hover:underline" @click="router.push(`/budgeting/budgets/${doc.budget_id}`)">
								{{ doc.budget_number }}
							</button>
						</div>
						<div v-else>
							<p class="text-s text-ink-muted">Nomor Revisi Budget</p>
							<p v-if="!doc.revisions?.length" class="text-ink-muted">—</p>
							<p v-for="item in doc.revisions" :key="item.id" class="flex items-center gap-2">
								<button class="text-primary-dark hover:underline" @click="router.push(`/budgeting/revisions/${item.id}`)">{{ item.number }}</button>
								<Badge :tone="statusTone(item.status)">{{ item.status }}</Badge>
							</p>
						</div>
					</div>
					<div>
						<p class="text-s text-ink-muted">{{ revision ? 'Alasan Revisi' : 'Keterangan' }}</p>
						<p>{{ doc.description }}</p>
					</div>
					<div v-if="rejection" class="rounded-md bg-danger-soft p-3 text-danger">
						<p class="font-semibold">Alasan Penolakan</p>
						<p class="whitespace-pre-line">{{ rejection.note }}</p>
						<p class="text-s">Ditolak pada {{ date(rejection.at, 'DD MMM YYYY HH:mm') }} WIB oleh {{ rejection.by }}</p>
					</div>
				</section>
				<section class="space-y-3">
					<h3 class="subhead">Rincian {{ revision ? 'Revisi' : 'Budget' }}</h3>
					<p v-if="doc.status === 'Disetujui' && !doc.ytd_snapshot" class="text-s text-ink-muted">Snapshot capaian YTD tidak tersedia.</p>
					<p v-else class="text-s text-ink-muted">
						{{ frozen ? 'Capaian YTD dibekukan saat persetujuan.' : 'Capaian YTD berjalan sampai bulan lalu (data contoh).' }} Nilai capaian
						ditampilkan per akun, bukan per rincian.
					</p>
					<BudgetMatrix
						:lines="doc.lines"
						:initial-lines="doc.initial_lines ?? []"
						:accounts="[]"
						:revision="revision"
						:start="doc.revision_month_start ?? 1"
						:year="String(doc.year)"
						:ytd="shownYtd"
						:all-ytd="allYtd"
						:has-department="doc.status !== 'Disetujui'"
						readonly
						:ytd-label="ytdLabel"
						:ytd-frozen="frozen"
						@update:all-ytd="allYtd = $event"
					/>
				</section>
				<section class="space-y-3">
					<h3 class="subhead">Riwayat (Log) Dokumen</h3>
					<div class="overflow-x-auto">
						<table class="w-full text-m">
							<thead>
								<tr class="bg-fill text-left text-ink-muted">
									<th class="px-3 py-2">Tanggal &amp; Waktu</th>
									<th class="px-3 py-2">Aksi</th>
									<th class="px-3 py-2">Status Sebelum</th>
									<th class="px-3 py-2">Status Sesudah</th>
									<th class="px-3 py-2">Catatan / Keterangan</th>
									<th class="px-3 py-2">Oleh</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-hairline">
								<tr v-for="(event, i) in doc.history" :key="i" class="align-top">
									<td class="whitespace-nowrap px-3 py-2 tnum">{{ date(event.at, 'DD MMM YYYY HH:mm:ss') }}</td>
									<td class="px-3 py-2 font-medium">{{ event.action }}</td>
									<td class="px-3 py-2">{{ event.from ?? '—' }}</td>
									<td class="px-3 py-2">{{ event.to }}</td>
									<td class="px-3 py-2">{{ event.note || '—' }}</td>
									<td class="px-3 py-2">{{ event.by }}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</Panel>
		<Modal
			:open="!!modalAction"
			:title="
				modalAction === 'reject' ? `Konfirmasi Penolakan ${revision ? 'Revisi' : 'Budget'}` : `Batalkan Approval ${revision ? 'Revisi' : 'Budget'}`
			"
			@close="modalAction = null"
		>
			<p v-if="modalAction === 'unapprove'" class="mb-4 text-ink-muted">
				Budget kembali berstatus <strong>Draft</strong>, dapat diedit dan diajukan ulang, dan tidak dipakai sebagai baseline Realisasi sampai
				disetujui kembali.
			</p>
			<FormField
				:label="modalAction === 'reject' ? `Masukkan catatan penolakan untuk dokumen ${noun} ini` : 'Alasan pembatalan (opsional)'"
				:required="modalAction === 'reject'"
				><Textarea v-model="note" :placeholder="modalAction === 'reject' ? 'Tulis alasan penolakan di sini…' : 'Tulis alasan jika perlu…'" :rows="4"
			/></FormField>
			<template #footer
				><Button variant="secondary" @click="modalAction = null"><IconX class="h-4 w-4" /> Batal</Button
				><Button :variant="modalAction === 'reject' ? 'danger' : 'primary'" :loading="saving" @click="submitModal"
					><component :is="modalAction === 'reject' ? IconX : IconArrowBackUp" v-if="!saving" class="h-4 w-4" />
					{{ modalAction === 'reject' ? 'Tolak Dokumen' : 'Batalkan Approval' }}</Button
				></template
			>
		</Modal>
	</div>
</template>
