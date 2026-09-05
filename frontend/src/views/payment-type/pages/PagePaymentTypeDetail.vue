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
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import { TRANSACTION_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/views/payment-type/schema'
import type { PaymentType } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const paymentType = ref<PaymentType>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: PaymentType }>(`/payment-type/${route.params.id}`)
		paymentType.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

const transactionTypeLabel = (v: string) => TRANSACTION_TYPE_OPTIONS.find((t) => t.value === v)?.label ?? v
const methodLabel = (v: string) => PAYMENT_METHOD_OPTIONS.find((j) => j.value === v)?.label ?? v

function remove() {
	const t = paymentType.value
	if (!t) return
	ask({ title: 'Hapus tipe pembayaran', message: `Hapus "${t.code} — ${t.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/payment-type/${t.id}`)
		toast.success('Tipe pembayaran dihapus')
		router.push('/payment-type')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Tipe Pembayaran" subtitle="Master data tipe pembayaran">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/payment-type')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="paymentType">
						<Button size="sm" @click="router.push(`/payment-type/edit/${paymentType.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="4" /></Panel>

		<Panel v-else-if="notFound || !paymentType">
			<EmptyState title="Tipe pembayaran tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Informasi Tipe Pembayaran</h3>
				<dl class="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Kode</dt>
					<dd class="text-ink">{{ paymentType.code }}</dd>
					<dt class="text-ink-muted">Nama</dt>
					<dd class="text-ink">{{ paymentType.name }}</dd>
					<dt class="text-ink-muted">Akun Perkiraan</dt>
					<dd class="text-ink">{{ paymentType.account_code }} — {{ paymentType.account_name }}</dd>
					<dt class="text-ink-muted">Transaksi</dt>
					<dd class="text-ink">{{ transactionTypeLabel(paymentType.transaction_type) }}</dd>
					<dt class="text-ink-muted">Jenis</dt>
					<dd class="text-ink">{{ methodLabel(paymentType.method) }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
