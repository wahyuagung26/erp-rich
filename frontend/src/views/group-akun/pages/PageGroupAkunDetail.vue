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
import { GROUP_AKUN_CATEGORIES } from '@/views/group-akun/schema'
import type { GroupAkun } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const groupAkun = ref<GroupAkun>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: GroupAkun }>(`/group-akun/${route.params.id}`)
		groupAkun.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

const categoryLabel = (v: string) => GROUP_AKUN_CATEGORIES.find((c) => c.value === v)?.label ?? v

function remove() {
	const g = groupAkun.value
	if (!g) return
	ask({ title: 'Hapus group akun', message: `Hapus "${g.code} — ${g.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/group-akun/${g.id}`)
		toast.success('Group akun dihapus')
		router.push('/group-akun')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Group Akun" subtitle="Master data group akun">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/group-akun')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="groupAkun">
						<Button size="sm" @click="router.push(`/group-akun/edit/${groupAkun.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>

		<Panel v-else-if="notFound || !groupAkun">
			<EmptyState title="Group akun tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Informasi Group Akun</h3>
				<dl class="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Kode Group Akun</dt>
					<dd class="text-ink">{{ groupAkun.code }}</dd>
					<dt class="text-ink-muted">Nama Group Akun</dt>
					<dd class="text-ink">{{ groupAkun.name }}</dd>
					<dt class="text-ink-muted">Neraca / Laba Rugi</dt>
					<dd class="text-ink">{{ categoryLabel(groupAkun.category) }}</dd>
					<dt class="text-ink-muted">Saldo Normal</dt>
					<dd class="text-ink">{{ groupAkun.normal_balance === 'debit' ? 'Debit' : 'Kredit' }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
