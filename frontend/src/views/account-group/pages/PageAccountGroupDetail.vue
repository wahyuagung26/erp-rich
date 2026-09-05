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
import { ACCOUNT_GROUP_CATEGORIES } from '@/views/account-group/schema'
import type { AccountGroup } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const accountGroup = ref<AccountGroup>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: AccountGroup }>(`/account-group/${route.params.id}`)
		accountGroup.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

const categoryLabel = (v: string) => ACCOUNT_GROUP_CATEGORIES.find((c) => c.value === v)?.label ?? v

function remove() {
	const g = accountGroup.value
	if (!g) return
	ask({ title: 'Hapus group akun', message: `Hapus "${g.code} — ${g.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/account-group/${g.id}`)
		toast.success('Group akun dihapus')
		router.push('/account-group')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Group Akun" subtitle="Master data group akun">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/account-group')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="accountGroup">
						<Button size="sm" @click="router.push(`/account-group/edit/${accountGroup.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>

		<Panel v-else-if="notFound || !accountGroup">
			<EmptyState title="Group akun tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Informasi Group Akun</h3>
				<dl class="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Kode Group Akun</dt>
					<dd class="text-ink">{{ accountGroup.code }}</dd>
					<dt class="text-ink-muted">Nama Group Akun</dt>
					<dd class="text-ink">{{ accountGroup.name }}</dd>
					<dt class="text-ink-muted">Neraca / Laba Rugi</dt>
					<dd class="text-ink">{{ categoryLabel(accountGroup.category) }}</dd>
					<dt class="text-ink-muted">Saldo Normal</dt>
					<dd class="text-ink">{{ accountGroup.normal_balance === 'debit' ? 'Debit' : 'Kredit' }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
