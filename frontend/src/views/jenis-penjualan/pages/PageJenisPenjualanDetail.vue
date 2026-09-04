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
import type { JenisPenjualan } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const jenisPenjualan = ref<JenisPenjualan>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: JenisPenjualan }>(`/jenis-penjualan/${route.params.id}`)
		jenisPenjualan.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

function remove() {
	const j = jenisPenjualan.value
	if (!j) return
	ask({ title: 'Hapus jenis penjualan', message: `Hapus "${j.code} — ${j.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/jenis-penjualan/${j.id}`)
		toast.success('Jenis penjualan dihapus')
		router.push('/jenis-penjualan')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Jenis Penjualan" subtitle="Master data jenis penjualan">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/jenis-penjualan')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="jenisPenjualan">
						<Button size="sm" @click="router.push(`/jenis-penjualan/edit/${jenisPenjualan.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="5" /></Panel>

		<Panel v-else-if="notFound || !jenisPenjualan">
			<EmptyState title="Jenis penjualan tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Informasi Jenis Penjualan</h3>
				<dl class="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Kode Jenis</dt>
					<dd class="text-ink">{{ jenisPenjualan.code }}</dd>
					<dt class="text-ink-muted">Jenis</dt>
					<dd class="text-ink">{{ jenisPenjualan.name }}</dd>
					<dt class="text-ink-muted">Akun Pendapatan</dt>
					<dd class="text-ink">{{ jenisPenjualan.akun_pendapatan_code }} — {{ jenisPenjualan.akun_pendapatan_name }}</dd>
					<dt class="text-ink-muted">Akun HPP</dt>
					<dd class="text-ink">{{ jenisPenjualan.akun_hpp_code }} — {{ jenisPenjualan.akun_hpp_name }}</dd>
					<dt class="text-ink-muted">Akun Persediaan</dt>
					<dd class="text-ink">{{ jenisPenjualan.akun_persediaan_code }} — {{ jenisPenjualan.akun_persediaan_name }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
