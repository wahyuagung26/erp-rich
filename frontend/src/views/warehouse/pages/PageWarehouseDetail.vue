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
import type { Warehouse } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const warehouse = ref<Warehouse>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: Warehouse }>(`/warehouse/${route.params.id}`)
		warehouse.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

function remove() {
	const w = warehouse.value
	if (!w) return
	ask({ title: 'Hapus gudang', message: `Hapus "${w.code} — ${w.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/warehouse/${w.id}`)
		toast.success('Gudang dihapus')
		router.push('/warehouse')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Gudang" subtitle="Master data gudang">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/warehouse')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="warehouse">
						<Button size="sm" @click="router.push(`/warehouse/edit/${warehouse.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>

		<Panel v-else-if="notFound || !warehouse">
			<EmptyState title="Gudang tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Informasi Gudang</h3>
				<dl class="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Kode Gudang</dt>
					<dd class="text-ink">{{ warehouse.code }}</dd>
					<dt class="text-ink-muted">Nama Gudang</dt>
					<dd class="text-ink">{{ warehouse.name }}</dd>
					<dt class="text-ink-muted">Cabang</dt>
					<dd class="text-ink">{{ warehouse.branch_code }} — {{ warehouse.branch_name }}</dd>
					<dt class="text-ink-muted">Alamat</dt>
					<dd class="text-ink">{{ warehouse.address || '—' }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
