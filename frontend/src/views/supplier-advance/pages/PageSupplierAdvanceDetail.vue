<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft, IconPaperclip, IconPencil, IconPrinter, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import Amount from '@/components/base/Amount.vue'
import Badge from '@/components/base/Badge.vue'
import RiwayatPemakaian from '@/views/supplier-advance/components/RiwayatPemakaian.vue'
import { advanceUsage } from '@/views/supplier-advance/schema'
import type { SupplierAdvance } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const advance = ref<SupplierAdvance>()
const loading = ref(true)
const notFound = ref(false)

onMounted(load)

async function load() {
	try {
		const res = await api.get<{ data: SupplierAdvance }>(`/supplier-advance/${route.params.id}`)
		advance.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}

// An advance already used against a payable (hutang) is immutable.
const locked = computed(() => (advance.value?.used ?? 0) > 0)

// Opens the print view in a new tab; `?auto=1` makes it call window.print() once rendered.
function printDoc() {
	if (advance.value)
		window.open(router.resolve({ name: 'SupplierAdvancePrint', params: { id: advance.value.id }, query: { auto: '1' } }).href, '_blank')
}

function remove() {
	const value = advance.value
	if (!value) return
	ask(
		{ title: 'Hapus uang muka supplier', message: `Hapus uang muka supplier "${value.number}"?`, type: 'danger', confirmText: 'Hapus' },
		async () => {
			try {
				await api.delete(`/supplier-advance/${value.id}`)
				toast.success('Uang muka supplier dihapus')
				router.push('/supplier-advance')
			} catch (err) {
				if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Uang muka supplier tidak dapat dihapus')
			}
		}
	)
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Uang Muka Supplier" subtitle="Pembelian">
			<template #actions>
				<div class="flex flex-wrap items-center gap-2">
					<Badge v-if="advance" :tone="advanceUsage(advance).tone" class="mr-1">{{ advanceUsage(advance).label }}</Badge>
					<Button size="sm" variant="subtle" @click="router.push('/supplier-advance')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button>
					<Button size="sm" variant="subtle" :disabled="!advance" @click="printDoc"><IconPrinter class="h-4 w-4" /> Cetak</Button>
					<template v-if="advance && !locked">
						<Button size="sm" variant="secondary" @click="router.push(`/supplier-advance/edit/${advance.id}`)">
							<IconPencil class="h-4 w-4" /> Edit
						</Button>
						<Button size="sm" variant="subtle" @click="remove"><IconTrash class="h-4 w-4" /> Hapus</Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="9" /></Panel>
		<Panel v-else-if="notFound || !advance">
			<EmptyState title="Uang muka supplier tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>
		<Panel v-else>
			<div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi Transaksi</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nomor</dt>
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
						<div class="md:col-span-2">
							<dt class="text-s text-ink-muted">Supplier</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.supplier_code }} — {{ advance.supplier_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Jenis Uang Muka</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.advance_type }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ advance.description || '–' }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Pembayaran dan Saldo</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nominal</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="advance.amount" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Terpakai</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="advance.used" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Sisa</dt>
							<dd class="mt-1 text-m font-semibold text-ink"><Amount :value="advance.remaining" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Akun Kas / Bank</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.cash_account_code }} — {{ advance.cash_account_name }}</dd>
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
									<IconPaperclip class="h-4 w-4 shrink-0" /> <span class="truncate">{{ advance.attachment.name }}</span>
								</a>
								<span v-else class="text-ink-muted">–</span>
							</dd>
						</div>
					</dl>
				</section>

				<RiwayatPemakaian :advance-id="advance.id" />
			</div>
		</Panel>
	</div>
</template>
