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
import { TRANSAKSI_OPTIONS, JENIS_PEMBAYARAN_OPTIONS } from '@/views/tipe-pembayaran/schema'
import type { TipePembayaran } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const tipePembayaran = ref<TipePembayaran>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: TipePembayaran }>(`/tipe-pembayaran/${route.params.id}`)
		tipePembayaran.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

const transaksiLabel = (v: string) => TRANSAKSI_OPTIONS.find((t) => t.value === v)?.label ?? v
const jenisLabel = (v: string) => JENIS_PEMBAYARAN_OPTIONS.find((j) => j.value === v)?.label ?? v

function remove() {
	const t = tipePembayaran.value
	if (!t) return
	ask({ title: 'Hapus tipe pembayaran', message: `Hapus "${t.code} — ${t.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/tipe-pembayaran/${t.id}`)
		toast.success('Tipe pembayaran dihapus')
		router.push('/tipe-pembayaran')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Tipe Pembayaran" subtitle="Master data tipe pembayaran">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/tipe-pembayaran')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="tipePembayaran">
						<Button size="sm" @click="router.push(`/tipe-pembayaran/edit/${tipePembayaran.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="4" /></Panel>

		<Panel v-else-if="notFound || !tipePembayaran">
			<EmptyState title="Tipe pembayaran tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Informasi Tipe Pembayaran</h3>
				<dl class="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Kode</dt>
					<dd class="text-ink">{{ tipePembayaran.code }}</dd>
					<dt class="text-ink-muted">Nama</dt>
					<dd class="text-ink">{{ tipePembayaran.name }}</dd>
					<dt class="text-ink-muted">Akun Perkiraan</dt>
					<dd class="text-ink">{{ tipePembayaran.akun_perkiraan_code }} — {{ tipePembayaran.akun_perkiraan_name }}</dd>
					<dt class="text-ink-muted">Transaksi</dt>
					<dd class="text-ink">{{ transaksiLabel(tipePembayaran.transaksi) }}</dd>
					<dt class="text-ink-muted">Jenis</dt>
					<dd class="text-ink">{{ jenisLabel(tipePembayaran.jenis) }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
