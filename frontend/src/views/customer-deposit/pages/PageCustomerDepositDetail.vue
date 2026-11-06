<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft, IconHistory, IconPaperclip, IconPencil, IconPrinter, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useHistory } from '@/composables/useHistory'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ClosingBadge from '@/components/common/ClosingBadge.vue'
import Amount from '@/components/base/Amount.vue'
import Badge from '@/components/base/Badge.vue'
import RiwayatPemakaian from '@/views/customer-deposit/components/RiwayatPemakaian.vue'
import { depositUsage } from '@/views/customer-deposit/schema'
import type { CustomerDeposit } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const history = useHistory()
const deposit = ref<CustomerDeposit>()
const loading = ref(true)
const notFound = ref(false)

onMounted(load)

async function load() {
	try {
		const res = await api.get<{ data: CustomerDeposit }>(`/customer-deposit/${route.params.id}`)
		deposit.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}

// Opens the shared record-history modal for this document.
function openHistory() {
	const value = deposit.value
	if (value) history.open({ kode: value.number, endpoint: `/customer-deposit/${value.id}/history` })
}

// Opens the print view in a new tab; `?auto=1` makes it call window.print() once rendered.
function printDoc() {
	if (deposit.value)
		window.open(router.resolve({ name: 'CustomerDepositPrint', params: { id: deposit.value.id }, query: { auto: '1' } }).href, '_blank')
}

function remove() {
	const value = deposit.value
	if (!value) return
	ask({ title: 'Hapus titipan customer', message: `Hapus titipan customer "${value.number}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		try {
			await api.delete(`/customer-deposit/${value.id}`)
			toast.success('Titipan customer dihapus')
			router.push('/customer-deposit')
		} catch (err) {
			if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Titipan customer tidak dapat dihapus')
		}
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Titipan Customer" subtitle="Penjualan">
			<template #actions>
				<div class="flex flex-wrap items-center gap-2">
					<Badge v-if="deposit" :tone="depositUsage(deposit).tone" class="mr-1">{{ depositUsage(deposit).label }}</Badge>
					<Button size="sm" variant="subtle" @click="router.push('/customer-deposit')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button>
					<Button size="sm" variant="subtle" :disabled="!deposit" @click="openHistory"><IconHistory class="h-4 w-4" /> Riwayat</Button>
					<Button size="sm" variant="subtle" :disabled="!deposit" @click="printDoc"><IconPrinter class="h-4 w-4" /> Cetak</Button>
					<ClosingBadge v-if="deposit?.locked" title="Periode sudah closing, dokumen tidak bisa diubah" />
					<template v-else-if="deposit">
						<Button size="sm" variant="secondary" @click="router.push(`/customer-deposit/edit/${deposit.id}`)">
							<IconPencil class="h-4 w-4" /> Edit
						</Button>
						<Button v-if="deposit.used === 0" size="sm" variant="subtle" @click="remove"><IconTrash class="h-4 w-4" /> Hapus</Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="9" /></Panel>
		<Panel v-else-if="notFound || !deposit">
			<EmptyState title="Titipan customer tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>
		<Panel v-else>
			<div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi Transaksi</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nomor</dt>
							<dd class="mt-1 text-m text-ink">{{ deposit.number }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Tanggal</dt>
							<dd class="mt-1 text-m text-ink">{{ date(deposit.date) }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Departemen</dt>
							<dd class="mt-1 text-m text-ink">{{ deposit.department_code }} — {{ deposit.department_name }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Customer</dt>
							<dd class="mt-1 text-m text-ink">{{ deposit.customer_code }} — {{ deposit.customer_name }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ deposit.description || '–' }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Pembayaran dan Saldo</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nominal</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="deposit.amount" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Terpakai</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="deposit.used" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Sisa</dt>
							<dd class="mt-1 text-m font-semibold text-ink"><Amount :value="deposit.remaining" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Akun Kas / Bank</dt>
							<dd class="mt-1 text-m text-ink">{{ deposit.cash_account_code }} — {{ deposit.cash_account_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Arus Kas</dt>
							<dd class="mt-1 text-m text-ink">{{ deposit.cash_flow_name ?? deposit.cash_flow ?? '–' }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Lampiran</dt>
							<dd class="mt-1 text-m">
								<a
									v-if="deposit.attachment"
									:href="deposit.attachment.data_url"
									:download="deposit.attachment.name"
									target="_blank"
									class="inline-flex items-center gap-1 text-primary-dark hover:underline"
								>
									<IconPaperclip class="h-4 w-4 shrink-0" /> <span class="truncate">{{ deposit.attachment.name }}</span>
								</a>
								<span v-else class="text-ink-muted">–</span>
							</dd>
						</div>
					</dl>
				</section>

				<RiwayatPemakaian :deposit-id="deposit.id" />
			</div>
		</Panel>
	</div>
</template>
