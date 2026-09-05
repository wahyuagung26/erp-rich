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
import type { SubAccount } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const subAccount = ref<SubAccount>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: SubAccount }>(`/sub-account/${route.params.id}`)
		subAccount.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

function remove() {
	const s = subAccount.value
	if (!s) return
	ask({ title: 'Hapus sub akun', message: `Hapus "${s.code} — ${s.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/sub-account/${s.id}`)
		toast.success('Sub akun dihapus')
		router.push('/sub-account')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Sub Akun" subtitle="Master data sub akun">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/sub-account')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="subAccount">
						<Button size="sm" @click="router.push(`/sub-account/edit/${subAccount.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>

		<Panel v-else-if="notFound || !subAccount">
			<EmptyState title="Sub akun tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Informasi Sub Akun</h3>
				<dl class="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Group Perkiraan</dt>
					<dd class="text-ink">{{ subAccount.account_group_code }} — {{ subAccount.account_group_name }}</dd>
					<dt class="text-ink-muted">Kode Sub Akun</dt>
					<dd class="font-mono tnum text-ink">{{ subAccount.code }}</dd>
					<dt class="text-ink-muted">Nama Sub Akun</dt>
					<dd class="text-ink">{{ subAccount.name }}</dd>
					<dt class="text-ink-muted">Saldo Normal</dt>
					<dd class="text-ink">{{ subAccount.normal_balance === 'debit' ? 'Debit' : 'Kredit' }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
