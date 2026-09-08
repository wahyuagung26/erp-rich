<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft, IconCheck, IconPaperclip, IconPencil, IconRefresh, IconTrash, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import Badge from '@/components/base/Badge.vue'
import Amount from '@/components/base/Amount.vue'
import Modal from '@/components/base/Modal.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import HistoryPenyelesaian from '@/views/cash-advance/components/HistoryPenyelesaian.vue'
import { journalStatusLabel, journalStatusTone, settlementLabel, settlementOf, settlementTone } from '@/views/cash-advance/schema'
import type { CashAdvance } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const advance = ref<CashAdvance>()
const loading = ref(true)
const notFound = ref(false)

const approveOpen = ref(false)
const approveDate = ref('')
const approving = ref(false)

function openApprove() {
	approveDate.value = advance.value?.date ?? ''
	approveOpen.value = true
}

async function confirmApprove() {
	const value = advance.value
	if (!value || !approveDate.value) return
	approving.value = true
	try {
		const res = await api.patch<{ data: CashAdvance }>(`/cash-advance/${value.id}/status`, { status: 'approved', date: approveDate.value })
		advance.value = res.data.data
		approveOpen.value = false
		toast.success('Uang muka operasional disetujui')
	} catch (err) {
		if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Status uang muka tidak dapat diubah')
	} finally {
		approving.value = false
	}
}

onMounted(load)

async function load() {
	try {
		const res = await api.get<{ data: CashAdvance }>(`/cash-advance/${route.params.id}`)
		advance.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}

function reject() {
	const value = advance.value
	if (!value) return
	ask({ title: 'Tolak uang muka', message: `Tolak uang muka "${value.number}"?`, type: 'danger', confirmText: 'Tolak' }, async () => {
		try {
			const res = await api.patch<{ data: CashAdvance }>(`/cash-advance/${value.id}/status`, { status: 'rejected' })
			advance.value = res.data.data
			toast.success('Uang muka operasional ditolak')
		} catch (err) {
			if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Status uang muka tidak dapat diubah')
		}
	})
}

function resubmit() {
	const value = advance.value
	if (!value) return
	ask(
		{ title: 'Ajukan ulang uang muka', message: `Ajukan ulang uang muka "${value.number}"?`, type: 'info', confirmText: 'Ajukan Ulang' },
		async () => {
			try {
				const res = await api.patch<{ data: CashAdvance }>(`/cash-advance/${value.id}/status`, { status: 'submitted' })
				advance.value = res.data.data
				toast.success('Uang muka diajukan ulang')
			} catch (err) {
				if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Status uang muka tidak dapat diubah')
			}
		}
	)
}

function remove() {
	const value = advance.value
	if (!value) return
	ask({ title: 'Hapus uang muka', message: `Hapus uang muka "${value.number}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/cash-advance/${value.id}`)
			toast.success('Uang muka operasional dihapus')
			router.push('/cash-advance')
		} catch (err) {
			if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Uang muka tidak dapat dihapus')
		}
	})
}
</script>

<template>
	<div class="max-w-5xl space-y-4 p-4">
		<PageHeader title="Detail Uang Muka Operasional" subtitle="Akuntansi">
			<template #actions>
				<div class="flex flex-wrap items-center gap-2">
					<Badge v-if="advance" :tone="journalStatusTone[advance.status]" class="mr-1">{{ journalStatusLabel[advance.status] }}</Badge>
					<Button size="sm" variant="subtle" @click="router.push('/cash-advance')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button>
					<template v-if="advance?.status === 'submitted'">
						<Button size="sm" variant="secondary" @click="router.push(`/cash-advance/edit/${advance.id}`)">
							<IconPencil class="h-4 w-4" /> Edit
						</Button>
						<Button size="sm" variant="subtle" @click="remove"><IconTrash class="h-4 w-4" /> Hapus</Button>
						<Button size="sm" @click="openApprove"><IconCheck class="h-4 w-4" /> Setujui</Button>
						<Button size="sm" variant="danger" @click="reject"><IconX class="h-4 w-4" /> Tolak</Button>
					</template>
					<Button v-else-if="advance?.status === 'rejected'" size="sm" variant="secondary" @click="resubmit">
						<IconRefresh class="h-4 w-4" /> Ajukan Ulang
					</Button>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="8" /></Panel>
		<Panel v-else-if="notFound || !advance">
			<EmptyState title="Uang muka operasional tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>
		<Panel v-else>
			<div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi Uang Muka</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">No. Transaksi</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.number }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Tanggal</dt>
							<dd class="mt-1 text-m text-ink">{{ date(advance.date) }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Departemen</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.department_code }} — {{ advance.department_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Penerima</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.recipient }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Nilai</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="advance.amount" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Penyelesaian</dt>
							<dd class="mt-1 text-m">
								<Badge :tone="settlementTone[settlementOf(advance.used, advance.amount)]">
									{{ settlementLabel[settlementOf(advance.used, advance.amount)] }}
								</Badge>
							</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Terpakai</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="advance.used" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Sisa</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="advance.remaining" /></dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ advance.description || '–' }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Akun & Arus Kas</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Akun Kas / Bank</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.cash_account_code }} — {{ advance.cash_account_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Akun Uang Muka</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.advance_account_code }} — {{ advance.advance_account_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Arus Kas</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.cash_flow_name ?? advance.cash_flow ?? '–' }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Lampiran</dt>
							<dd class="mt-1 text-m">
								<a
									v-if="advance.attachment"
									:href="advance.attachment.data_url"
									:download="advance.attachment.name"
									target="_blank"
									class="inline-flex items-center gap-1 text-primary-dark hover:underline"
								>
									<IconPaperclip class="h-4 w-4" /> {{ advance.attachment.name }}
								</a>
								<span v-else class="text-ink-muted">–</span>
							</dd>
						</div>
						<template v-if="advance.status === 'approved'">
							<div>
								<dt class="text-s text-ink-muted">Disetujui oleh</dt>
								<dd class="mt-1 text-m text-ink">{{ advance.approved_by ?? '–' }}</dd>
							</div>
							<div>
								<dt class="text-s text-ink-muted">Waktu Persetujuan</dt>
								<dd class="mt-1 text-m text-ink">{{ advance.approved_at ? date(advance.approved_at, 'DD MMM YYYY HH:mm') : '–' }}</dd>
							</div>
						</template>
						<div v-if="advance.rejection_reason" class="md:col-span-3">
							<dt class="text-s text-ink-muted">Alasan Penolakan</dt>
							<dd class="mt-1 text-m text-danger">{{ advance.rejection_reason }}</dd>
						</div>
					</dl>
				</section>
			</div>
		</Panel>
		<HistoryPenyelesaian v-if="advance" :advance="advance" @changed="load" />

		<Modal :open="approveOpen" title="Setujui Uang Muka Operasional" size="sm" @close="approveOpen = false">
			<p class="text-s text-ink-muted">
				Konfirmasi persetujuan uang muka <span class="text-ink">{{ advance?.number }}</span
				>. Tanggal dapat disesuaikan sebelum disetujui.
			</p>
			<FormField class="mt-4" label="Tanggal" required>
				<DatePicker v-model="approveDate" />
			</FormField>
			<template #footer>
				<Button variant="subtle" @click="approveOpen = false">Batal</Button>
				<Button :loading="approving" :disabled="!approveDate" @click="confirmApprove">
					<IconCheck v-if="!approving" class="h-4 w-4" /> Setujui
				</Button>
			</template>
		</Modal>
	</div>
</template>
