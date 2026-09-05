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
import { AKUN_TYPES } from '@/views/account/schema'
import type { Account } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const account = ref<Account>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: Account }>(`/account/${route.params.id}`)
		account.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

const typeLabel = (v: string) => AKUN_TYPES.find((t) => t.value === v)?.label ?? v

function remove() {
	const a = account.value
	if (!a) return
	ask({ title: 'Hapus akun perkiraan', message: `Hapus "${a.code} — ${a.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/account/${a.id}`)
		toast.success('Akun perkiraan dihapus')
		router.push('/account')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Akun Perkiraan" subtitle="Master data akun perkiraan">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/account')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="account">
						<Button size="sm" @click="router.push(`/account/edit/${account.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>

		<Panel v-else-if="notFound || !account">
			<EmptyState title="Akun perkiraan tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Informasi Akun Perkiraan</h3>
				<dl class="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Sub Akun</dt>
					<dd class="text-ink">{{ account.sub_account_code }} — {{ account.sub_account_name }}</dd>
					<dt class="text-ink-muted">Kode Akun Perkiraan</dt>
					<dd class="font-mono tnum text-ink">{{ account.code }}</dd>
					<dt class="text-ink-muted">Nama Akun Perkiraan</dt>
					<dd class="text-ink">{{ account.name }}</dd>
					<dt class="text-ink-muted">Tipe Akun</dt>
					<dd class="text-ink">{{ typeLabel(account.type) }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
