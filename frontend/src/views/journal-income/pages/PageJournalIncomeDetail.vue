<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft, IconCheck, IconCornerDownRight, IconPencil, IconPrinter, IconRefresh, IconTrash, IconX } from '@tabler/icons-vue'
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
import { journalStatusLabel, journalStatusTone } from '@/views/journal-income/schema'
import type { JournalIncome, JournalStatus } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const journal = ref<JournalIncome>()
const loading = ref(true)
const notFound = ref(false)

const approveOpen = ref(false)
const approveDate = ref('')
const approving = ref(false)

function openApprove() {
	approveDate.value = journal.value?.date ?? ''
	approveOpen.value = true
}

async function confirmApprove() {
	const value = journal.value
	if (!value || !approveDate.value) return
	approving.value = true
	try {
		const res = await api.patch<{ data: JournalIncome }>(`/journal-income/${value.id}/status`, { status: 'approved', date: approveDate.value })
		journal.value = res.data.data
		approveOpen.value = false
		toast.success('Jurnal pemasukan disetujui')
	} catch (err) {
		if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Status jurnal tidak dapat diubah')
	} finally {
		approving.value = false
	}
}

onMounted(load)

async function load() {
	try {
		const res = await api.get<{ data: JournalIncome }>(`/journal-income/${route.params.id}`)
		journal.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}

function changeStatus(status: JournalStatus) {
	const value = journal.value
	if (!value || (status !== 'rejected' && status !== 'submitted')) return
	const isResubmit = status === 'submitted'
	ask(
		{
			title: status === 'rejected' ? 'Tolak jurnal' : 'Ajukan ulang jurnal',
			message: `${status === 'rejected' ? 'Tolak' : 'Ajukan ulang'} jurnal "${value.number}"?`,
			type: status === 'rejected' ? 'danger' : 'info',
			confirmText: status === 'rejected' ? 'Tolak' : 'Ajukan Ulang'
		},
		async () => {
			try {
				const res = await api.patch<{ data: JournalIncome }>(`/journal-income/${value.id}/status`, { status })
				journal.value = res.data.data
				toast.success(isResubmit ? 'Jurnal diajukan ulang' : 'Jurnal ditolak')
			} catch (err) {
				if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Status jurnal tidak dapat diubah')
			}
		}
	)
}

function remove() {
	const value = journal.value
	if (!value) return
	ask({ title: 'Hapus jurnal', message: `Hapus jurnal "${value.number}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/journal-income/${value.id}`)
			toast.success('Jurnal pemasukan dihapus')
			router.push('/journal-income')
		} catch (err) {
			if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Jurnal tidak dapat dihapus')
		}
	})
}
// Opens the print view in a new tab; `?auto=1` makes it call window.print() once rendered.
function printDoc() {
	if (journal.value)
		window.open(router.resolve({ name: 'JournalIncomePrint', params: { id: journal.value.id }, query: { auto: '1' } }).href, '_blank')
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Jurnal Pemasukan" subtitle="Jurnal Pemasukan">
			<template #actions>
				<div class="flex flex-wrap items-center gap-2">
					<Badge v-if="journal" :tone="journalStatusTone[journal.status]" class="mr-1">{{ journalStatusLabel[journal.status] }}</Badge>
					<Button size="sm" variant="subtle" @click="router.push('/journal-income')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button>
					<Button size="sm" variant="subtle" @click="printDoc"><IconPrinter class="h-4 w-4" /> Cetak</Button>
					<template v-if="journal?.status === 'submitted'">
						<Button size="sm" variant="secondary" @click="router.push(`/journal-income/edit/${journal.id}`)"
							><IconPencil class="h-4 w-4" /> Edit</Button
						>
						<Button size="sm" variant="subtle" @click="remove"><IconTrash class="h-4 w-4" /> Hapus</Button>
						<Button size="sm" @click="openApprove"><IconCheck class="h-4 w-4" /> Setujui</Button>
						<Button size="sm" variant="danger" @click="changeStatus('rejected')"><IconX class="h-4 w-4" /> Tolak</Button>
					</template>
					<Button v-else-if="journal?.status === 'rejected'" size="sm" variant="secondary" @click="changeStatus('submitted')">
						<IconRefresh class="h-4 w-4" /> Ajukan Ulang
					</Button>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="8" /></Panel>
		<Panel v-else-if="notFound || !journal">
			<EmptyState title="Jurnal pemasukan tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>
		<Panel v-else>
			<div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi Jurnal</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">No. Transaksi</dt>
							<dd class="mt-1 text-m text-ink">{{ journal.number }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Tanggal</dt>
							<dd class="mt-1 text-m text-ink">{{ date(journal.date) }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Voucher</dt>
							<dd class="mt-1 text-m text-ink">{{ journal.voucher }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ journal.description }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Lampiran</dt>
							<dd class="mt-1 text-m">
								<ul v-if="journal.attachments.length" class="space-y-1">
									<li v-for="(file, index) in journal.attachments" :key="file.name + index">
										<a :href="file.data_url" :download="file.name" target="_blank" class="text-primary-dark hover:underline">{{ file.name }}</a>
									</li>
								</ul>
								<span v-else class="text-ink-muted">–</span>
							</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Kas / Bank Penerima</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Akun Kas / Bank</dt>
							<dd class="mt-1 text-m text-ink">{{ journal.cash_account_code }} — {{ journal.cash_account_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Departemen</dt>
							<dd class="mt-1 text-m text-ink">{{ journal.department_code }} — {{ journal.department_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Arus Kas</dt>
							<dd class="mt-1 text-m text-ink">{{ journal.cash_flow_name ?? journal.cash_flow }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Persetujuan</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Dibuat</dt>
							<dd class="mt-1 text-m text-ink">{{ journal.created_by }} pada {{ date(journal.created_at, 'DD MMM YYYY HH:mm') }}</dd>
						</div>
						<div v-if="journal.status === 'approved'">
							<dt class="text-s text-ink-muted">Disetujui</dt>
							<dd class="mt-1 text-m text-ink">
								{{ journal.approved_by ?? '–'
								}}<template v-if="journal.approved_at"> pada {{ date(journal.approved_at, 'DD MMM YYYY HH:mm') }}</template>
							</dd>
						</div>
						<div v-if="journal.rejection_reason" class="md:col-span-3">
							<dt class="text-s text-ink-muted">Alasan Penolakan</dt>
							<dd class="mt-1 text-m text-danger">{{ journal.rejection_reason }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Detail Jurnal</h3>
					<div class="overflow-x-auto">
						<table class="w-full min-w-[720px] text-m">
							<thead>
								<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
									<th class="px-3 py-2">Akun Perkiraan</th>
									<th class="px-3 py-2">Departemen</th>
									<th class="px-3 py-2">Keterangan</th>
									<th class="px-3 py-2 text-right">Debit</th>
									<th class="px-3 py-2 text-right">Kredit</th>
								</tr>
							</thead>
							<tbody>
								<tr class="border-b border-hairline">
									<td class="px-3 py-3 text-ink-muted">
										<span class="flex items-center gap-1.5">
											<IconCornerDownRight class="h-4 w-4 text-ink-subtle" />
											<span>
												<span class="block">{{ journal.cash_account_name }}</span>
												<span class="block text-s text-ink-subtle">{{ journal.cash_account_code }}</span>
											</span>
										</span>
									</td>
									<td class="px-3 py-3 text-ink-muted">
										<div>{{ journal.department_name }}</div>
										<div class="text-s text-ink-subtle">{{ journal.department_code }}</div>
									</td>
									<td class="px-3 py-3 text-ink-subtle">Kas/bank masuk (otomatis)</td>
									<td class="px-3 py-3 text-right"><Amount :value="journal.cash_in" /></td>
									<td class="px-3 py-3 text-right text-ink-subtle">–</td>
								</tr>
								<tr v-for="(line, index) in journal.lines" :key="index" class="border-b border-hairline last:border-0">
									<td class="px-3 py-3 text-ink">
										<div>{{ line.account_name }}</div>
										<div class="text-s text-ink-muted">{{ line.account_code }}</div>
									</td>
									<td class="px-3 py-3 text-ink">
										<template v-if="line.department_code">
											<div>{{ line.department_name }}</div>
											<div class="text-s text-ink-muted">{{ line.department_code }}</div>
										</template>
										<template v-else>–</template>
									</td>
									<td class="px-3 py-3 text-ink">{{ line.detail_description || '–' }}</td>
									<td class="px-3 py-3 text-right"><Amount :value="line.debit" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="line.credit" /></td>
								</tr>
							</tbody>
							<tfoot>
								<tr class="border-t border-hairline text-s">
									<td class="px-3 py-3 text-ink-muted" colspan="3">Total</td>
									<td class="px-3 py-3 text-right"><Amount :value="journal.total" /></td>
									<td class="px-3 py-3 text-right"><Amount :value="journal.total" /></td>
								</tr>
							</tfoot>
						</table>
					</div>
				</section>
			</div>
		</Panel>

		<Modal :open="approveOpen" title="Setujui Jurnal Pemasukan" size="sm" @close="approveOpen = false">
			<p class="text-s text-ink-muted">
				Konfirmasi persetujuan jurnal <span class="text-ink">{{ journal?.number }}</span
				>. Tanggal jurnal dapat disesuaikan sebelum disetujui.
			</p>
			<FormField class="mt-4" label="Tanggal Jurnal" required>
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
