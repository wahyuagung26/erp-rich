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
import type { Satuan } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const satuan = ref<Satuan>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: Satuan }>(`/satuan/${route.params.id}`)
		satuan.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

function remove() {
	const s = satuan.value
	if (!s) return
	ask({ title: 'Hapus satuan', message: `Hapus "${s.code} — ${s.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/satuan/${s.id}`)
		toast.success('Satuan dihapus')
		router.push('/satuan')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Satuan" subtitle="Master data satuan produk">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/satuan')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="satuan">
						<Button size="sm" @click="router.push(`/satuan/edit/${satuan.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>

		<Panel v-else-if="notFound || !satuan">
			<EmptyState title="Satuan tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Informasi Satuan</h3>
				<dl class="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Kode Satuan</dt>
					<dd class="text-ink">{{ satuan.code }}</dd>
					<dt class="text-ink-muted">Nama Satuan</dt>
					<dd class="text-ink">{{ satuan.name }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
