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
import type { Gudang } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const gudang = ref<Gudang>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: Gudang }>(`/gudang/${route.params.id}`)
		gudang.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

function remove() {
	const g = gudang.value
	if (!g) return
	ask({ title: 'Hapus gudang', message: `Hapus "${g.code} — ${g.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/gudang/${g.id}`)
		toast.success('Gudang dihapus')
		router.push('/gudang')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Gudang" subtitle="Master data gudang">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/gudang')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="gudang">
						<Button size="sm" @click="router.push(`/gudang/edit/${gudang.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>

		<Panel v-else-if="notFound || !gudang">
			<EmptyState title="Gudang tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Informasi Gudang</h3>
				<dl class="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Kode Gudang</dt>
					<dd class="text-ink">{{ gudang.code }}</dd>
					<dt class="text-ink-muted">Nama Gudang</dt>
					<dd class="text-ink">{{ gudang.name }}</dd>
					<dt class="text-ink-muted">Cabang</dt>
					<dd class="text-ink">{{ gudang.cabang_code }} — {{ gudang.cabang_name }}</dd>
					<dt class="text-ink-muted">Alamat</dt>
					<dd class="text-ink">{{ gudang.address || '—' }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
