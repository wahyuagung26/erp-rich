<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconArrowLeft, IconPencil, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Badge from '@/components/base/Badge.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import type { Customer } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const customer = ref<Customer>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: Customer }>(`/customer/${route.params.id}`)
		customer.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

const dash = (v: string) => v || '–'
const topLabel = (d: number) => (d === 0 ? 'Tunai' : `${d} hari`)

function remove() {
	const c = customer.value
	if (!c) return
	ask({ title: 'Hapus customer', message: `Hapus "${c.code} — ${c.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/customer/${c.id}`)
		toast.success('Customer dihapus')
		router.push('/customer')
	})
}
</script>

<template>
	<!-- whole column capped so PageHeader actions line up with the Panel's right edge -->
	<div class="max-w-5xl space-y-4 p-4">
		<PageHeader title="Detail Customer" subtitle="Master data pelanggan">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/customer')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="customer">
						<Button size="sm" @click="router.push(`/customer/edit/${customer.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="6" /></Panel>

		<Panel v-else-if="notFound || !customer">
			<EmptyState title="Customer tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Identitas</h3>
					<dl class="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2.5 text-m">
						<dt class="text-ink-muted">Kode Customer</dt>
						<dd class="text-ink">{{ customer.code }}</dd>
						<dt class="text-ink-muted">Nama Customer</dt>
						<dd class="text-ink">{{ customer.name }}</dd>
						<dt class="text-ink-muted">Alamat</dt>
						<dd class="whitespace-pre-line text-ink">{{ dash(customer.address) }}</dd>
						<dt class="text-ink-muted">Kota</dt>
						<dd class="text-ink">{{ dash(customer.city) }}</dd>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Kontak</h3>
					<dl class="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2.5 text-m">
						<dt class="text-ink-muted">Telepon</dt>
						<dd class="text-ink">{{ dash(customer.phone) }}</dd>
						<dt class="text-ink-muted">Email</dt>
						<dd class="text-ink">{{ dash(customer.email) }}</dd>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Pajak &amp; Pembayaran</h3>
					<dl class="grid grid-cols-[160px_1fr] items-center gap-x-4 gap-y-2.5 text-m">
						<dt class="text-ink-muted">Status PKP</dt>
						<dd>
							<Badge :tone="customer.pkp ? 'success' : 'neutral'">{{ customer.pkp ? 'PKP' : 'Non-PKP' }}</Badge>
						</dd>
						<dt class="text-ink-muted">NPWP</dt>
						<dd class="text-ink">{{ dash(customer.npwp) }}</dd>
						<dt class="text-ink-muted">TOP</dt>
						<dd class="text-ink">{{ topLabel(customer.top_days) }}</dd>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Rekening Bank</h3>
					<dl class="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2.5 text-m">
						<dt class="text-ink-muted">Nama Bank</dt>
						<dd class="text-ink">{{ dash(customer.bank_name) }}</dd>
						<dt class="text-ink-muted">No. Rekening</dt>
						<dd class="text-ink">{{ dash(customer.bank_account) }}</dd>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Catatan</h3>
					<p class="whitespace-pre-line text-m text-ink">{{ dash(customer.notes) }}</p>
				</section>
			</div>
		</Panel>
	</div>
</template>
