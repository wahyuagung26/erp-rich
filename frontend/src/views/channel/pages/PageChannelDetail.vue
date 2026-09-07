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
import type { Channel } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const channel = ref<Channel>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: Channel }>(`/channel/${route.params.id}`)
		channel.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

const dash = (v: string) => v || '–'

function remove() {
	const c = channel.value
	if (!c) return
	ask({ title: 'Hapus channel', message: `Hapus "${c.code} — ${c.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/channel/${c.id}`)
		toast.success('Channel dihapus')
		router.push('/channel')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Channel" subtitle="Master data channel penjualan">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/channel')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="channel">
						<Button size="sm" @click="router.push(`/channel/edit/${channel.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>

		<Panel v-else-if="notFound || !channel">
			<EmptyState title="Channel tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Informasi Channel</h3>
				<dl class="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Kode Channel</dt>
					<dd class="text-ink">{{ channel.code }}</dd>
					<dt class="text-ink-muted">Nama Channel</dt>
					<dd class="text-ink">{{ channel.name }}</dd>
					<dt class="text-ink-muted">Keterangan</dt>
					<dd class="whitespace-pre-line text-ink">{{ dash(channel.notes) }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
