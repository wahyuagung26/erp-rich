<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { IconAlertCircle, IconAlertTriangle, IconArchive, IconCircleCheck, IconLockOpen, IconRefresh } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { date } from '@/utils/format'
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import Amount from '@/components/base/Amount.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Table from '@/components/base/Table.vue'
import Modal from '@/components/base/Modal.vue'
import Textarea from '@/components/base/Textarea.vue'
import FormField from '@/components/base/FormField.vue'
import Tabs from '@/components/base/Tabs.vue'
import type { ApiItem, ClosingReconciliation, ClosingStatus, ReconCheckStatus } from '@/utils/types'
import { addMonths, periodLabel } from '../format'

const toast = useToast()
const confirm = useConfirm()

const status = ref<ClosingStatus>()
const recon = ref<ClosingReconciliation>()
const period = ref('')
const loading = ref(true)
const reconLoading = ref(false)
const historyTab = ref('close')
const closeCols = [
	{ label: 'Periode', field: 'period' },
	{ label: 'Ditutup Oleh', field: 'closed_by' },
	{ label: 'Waktu', field: 'closed_at' },
	{ label: 'Total Debit', field: 'total_debit', align: 'right' as const },
	{ label: 'Total Kredit', field: 'total_credit', align: 'right' as const },
	{ label: 'Laba / (Rugi)', field: 'profit', align: 'right' as const }
]
const reopenCols = [
	{ label: 'Periode', field: 'period' },
	{ label: 'Dibuka Oleh', field: 'opened_by' },
	{ label: 'Waktu', field: 'opened_at' },
	{ label: 'Alasan', field: 'reason' }
]
const closeRows = computed(() => (status.value?.history ?? []).map((h) => ({ ...h })))
const reopenRows = computed(() => (status.value?.reopen_history ?? []).map((h) => ({ ...h })))
const historyTabs = [
	{ label: 'Riwayat Closing', value: 'close' },
	{ label: 'Riwayat Reopen', value: 'reopen' }
]

// Last 6 months up to the running month, tagged with their closing state.
const options = computed(() => {
	const s = status.value
	if (!s) return []
	return Array.from({ length: 6 }, (_, i) => addMonths(s.current_period, -i)).map((p) => ({
		value: p,
		label: periodLabel(p) + (p === s.next_period ? ' — berikutnya' : s.closed_until && p <= s.closed_until ? ' — ditutup' : '')
	}))
})
const selectedClosed = computed(() => !!status.value?.closed_until && period.value <= status.value.closed_until)
const canCloseSelected = computed(() => !!status.value?.can_close && period.value === status.value.next_period)

const checkTone: Record<ReconCheckStatus, 'success' | 'danger' | 'warning'> = { pass: 'success', fail: 'danger', warn: 'warning' }
const checkText: Record<ReconCheckStatus, string> = { pass: 'Sesuai', fail: 'Tidak seimbang', warn: 'Perlu tindak lanjut' }
const bannerClass = {
	ok: 'bg-success-soft text-success',
	warning: 'bg-warning-soft text-warning',
	error: 'bg-danger-soft text-danger'
}
const bannerIcon = { ok: IconCircleCheck, warning: IconAlertTriangle, error: IconAlertCircle }
const bannerText = {
	ok: 'Semua pengecekan sesuai — data keuangan periode ini seimbang.',
	warning: 'Ada jurnal yang belum selesai di periode ini.',
	error: 'Ditemukan selisih — periksa pengecekan berwarna merah sebelum closing.'
}
// Names of the checks that need attention, shown under the verdict.
const issues = computed(
	() =>
		recon.value?.checks
			.filter((c) => c.status !== 'pass')
			.map((c) => c.label)
			.join(', ') ?? ''
)
// Why the close button is disabled (nothing to say when it is enabled).
const closeHint = computed(() => {
	const s = status.value
	if (!s || canCloseSelected.value) return ''
	if (selectedClosed.value) return 'Periode ini sudah ditutup.'
	if (!s.can_close) return 'Periode berikutnya belum bisa ditutup — selesaikan re-posting terlebih dahulu.'
	return `Hanya periode ${periodLabel(s.next_period)} yang bisa ditutup.`
})

async function loadRecon() {
	if (!period.value) return
	const wanted = period.value
	reconLoading.value = true
	try {
		const res = await api.get<ApiItem<ClosingReconciliation>>('/posting/closing/reconciliation', { params: { period: wanted } })
		if (wanted === period.value) recon.value = res.data.data // drop out-of-order responses
	} finally {
		if (wanted === period.value) reconLoading.value = false
	}
}

async function loadStatus(resetPeriod = false) {
	const res = await api.get<ApiItem<ClosingStatus>>('/posting/closing')
	status.value = res.data.data
	if (resetPeriod || !period.value) period.value = status.value.next_period
}

async function refresh(resetPeriod = false) {
	await loadStatus(resetPeriod)
	await loadRecon()
}

function selectPeriod(p: string) {
	period.value = p
	loadRecon()
}

function errorMessage(err: unknown, fallback: string): string {
	return axios.isAxiosError(err) ? (err.response?.data?.errors?.period?.[0] ?? err.response?.data?.message ?? fallback) : fallback
}

function askClose() {
	const flawed = recon.value?.status !== 'ok'
	confirm.ask(
		{
			type: flawed ? 'danger' : 'warning',
			title: `Tutup periode ${periodLabel(period.value)}?`,
			message: `${flawed ? 'Pengecekan rekonsiliasi belum seluruhnya sesuai. ' : ''}Setelah ditutup, transaksi pada periode ini tidak bisa ditambah, diubah, atau dihapus.`,
			confirmText: 'Tutup Periode'
		},
		async () => {
			try {
				const res = await api.post<{ message: string }>('/posting/closing', { period: period.value })
				toast.success(res.data.message)
				await refresh(true)
			} catch (err) {
				toast.error(errorMessage(err, 'Periode gagal ditutup'))
			}
		}
	)
}

// --- reopen ---
const reopenOpen = ref(false)
const reason = ref('')
const reasonError = ref('')
const reopening = ref(false)

function openReopen() {
	reason.value = ''
	reasonError.value = ''
	reopenOpen.value = true
}

async function reopen() {
	reasonError.value = ''
	reopening.value = true
	try {
		const res = await api.post<{ message: string }>('/posting/closing/reopen', { reason: reason.value })
		toast.success(res.data.message)
		reopenOpen.value = false
		await refresh(true)
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422 && err.response.data?.errors?.reason)
			reasonError.value = err.response.data.errors.reason[0]
		else toast.error(errorMessage(err, 'Periode gagal dibuka'))
	} finally {
		reopening.value = false
	}
}

onMounted(async () => {
	try {
		await refresh()
	} finally {
		loading.value = false
	}
})
</script>

<template>
	<Skeleton v-if="loading || !status" :lines="6" />
	<div v-else class="space-y-8">
		<!-- period + actions -->
		<div class="space-y-2">
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div class="flex flex-wrap items-end gap-3">
					<div class="w-full space-y-1 sm:w-72">
						<label class="block text-s font-medium text-ink-muted">Periode</label>
						<Select :model-value="period" :options="options" @update:model-value="selectPeriod" />
					</div>
					<Button variant="outline" :loading="reconLoading" @click="loadRecon"><IconRefresh class="h-4 w-4" /> Refresh</Button>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<Badge :tone="status.closed_until ? 'success' : 'neutral'">Buku tertutup s/d {{ periodLabel(status.closed_until) }}</Badge>
					<Button v-if="status.can_reopen" variant="outline" @click="openReopen"
						><IconLockOpen class="h-4 w-4" /> Buka Periode {{ periodLabel(status.closed_until) }}</Button
					>
					<Button :disabled="!canCloseSelected" @click="askClose"><IconArchive class="h-4 w-4" /> Tutup Periode</Button>
				</div>
			</div>
			<p v-if="closeHint" class="text-right text-s text-ink-subtle">{{ closeHint }}</p>
		</div>

		<!-- pending re-post -->
		<section v-if="status.repost_pending.length" class="space-y-3">
			<h3 class="subhead">Perlu Re-Posting</h3>
			<p class="text-s text-ink-subtle">Posting ulang periode berikut (tab Posting) sebelum closing berikutnya bisa dijalankan.</p>
			<div class="flex flex-wrap gap-2">
				<Badge v-for="r in status.repost_pending" :key="r.period" :tone="r.posted ? 'success' : 'warning'">
					{{ periodLabel(r.period) }} — {{ r.posted ? 'sudah di-posting ulang' : 'belum di-posting ulang' }}
				</Badge>
			</div>
		</section>

		<!-- reconciliation overview -->
		<section class="space-y-4">
			<h3 class="subhead">Overview Rekonsiliasi — {{ periodLabel(period) }}{{ selectedClosed ? ' (ditutup)' : '' }}</h3>
			<Skeleton v-if="!recon || reconLoading" :lines="5" />
			<template v-else>
				<div class="flex items-start gap-3 rounded-md px-4 py-3" :class="bannerClass[recon.status]">
					<component :is="bannerIcon[recon.status]" class="mt-0.5 h-5 w-5 shrink-0" />
					<div>
						<p class="text-m font-semibold">{{ bannerText[recon.status] }}</p>
						<p v-if="issues" class="mt-0.5 text-s">Perlu ditinjau: {{ issues }}.</p>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-3">
					<div v-for="c in recon.checks" :key="c.key" class="space-y-3">
						<div class="flex items-center justify-between gap-2">
							<h4 class="text-m font-semibold text-ink">{{ c.label }}</h4>
							<Badge :tone="checkTone[c.status]">{{ checkText[c.status] }}</Badge>
						</div>
						<dl class="space-y-2 text-m">
							<div v-for="r in c.rows" :key="r.label" class="flex items-center justify-between gap-3">
								<dt class="text-ink-muted">{{ r.label }}</dt>
								<dd>
									<Amount v-if="c.unit === 'rupiah'" :value="r.value" />
									<span v-else class="tnum text-ink">{{ r.value }}</span>
								</dd>
							</div>
							<div class="flex items-center justify-between gap-3 border-t border-hairline pt-2 font-semibold">
								<dt class="text-ink">{{ c.unit === 'rupiah' ? 'Selisih' : 'Belum selesai' }}</dt>
								<dd :class="c.status === 'fail' ? 'text-danger' : c.status === 'warn' ? 'text-warning' : 'text-ink'">
									<Amount v-if="c.unit === 'rupiah'" :value="Math.abs(c.difference)" />
									<span v-else class="tnum">{{ c.difference }} dokumen</span>
								</dd>
							</div>
						</dl>
					</div>
				</div>
			</template>
		</section>

		<!-- history -->
		<section class="space-y-3">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h3 class="subhead">Riwayat</h3>
				<Tabs v-model="historyTab" :tabs="historyTabs" variant="pill" />
			</div>
			<Table v-if="historyTab === 'close'" :rows="closeCols" :columns="closeRows" empty-text="Belum ada periode yang ditutup">
				<template #table-content="{ row, column }">
					<button v-if="row.field === 'period'" class="text-primary-dark hover:underline" @click="selectPeriod(column.period as string)">
						{{ periodLabel(column.period as string) }}
					</button>
					<span v-else-if="row.field === 'closed_at'" class="tnum">{{ date(column.closed_at as string, 'DD MMM YYYY HH:mm') }}</span>
					<Amount v-else-if="row.align === 'right'" :value="column[row.field] as number" />
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
			<Table v-else :rows="reopenCols" :columns="reopenRows" empty-text="Belum ada periode yang dibuka kembali">
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'period'">{{ periodLabel(column.period as string) }}</span>
					<span v-else-if="row.field === 'opened_at'" class="tnum">{{ date(column.opened_at as string, 'DD MMM YYYY HH:mm') }}</span>
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
		</section>

		<Modal :open="reopenOpen" :title="`Buka Periode ${periodLabel(status.closed_until)}`" @close="reopenOpen = false">
			<div class="space-y-3">
				<p class="text-s text-ink-subtle">
					Hanya periode closing terakhir yang bisa dibuka. Periode akan perlu di-posting ulang, dan aktivitas ini tercatat di riwayat.
				</p>
				<FormField label="Alasan" required :error="reasonError">
					<Textarea v-model="reason" :rows="3" placeholder="Jelaskan alasan membuka kembali periode ini" />
				</FormField>
			</div>
			<template #footer>
				<Button variant="outline" @click="reopenOpen = false">Batal</Button>
				<Button :loading="reopening" @click="reopen">Buka Periode</Button>
			</template>
		</Modal>
	</div>
</template>
