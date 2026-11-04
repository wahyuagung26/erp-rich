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
import type { BankAccount } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const bankAccount = ref<BankAccount>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: BankAccount }>(`/bank-account/${route.params.id}`)
		bankAccount.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

function remove() {
	const t = bankAccount.value
	if (!t) return
	ask({ title: 'Hapus rekening bank', message: `Hapus "${t.bank_code} — ${t.bank_name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/bank-account/${t.id}`)
		toast.success('Rekening bank dihapus')
		router.push('/bank-account')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Rekening Bank" subtitle="Master data rekening bank">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/bank-account')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="bankAccount">
						<Button size="sm" @click="router.push(`/bank-account/edit/${bankAccount.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="4" /></Panel>

		<Panel v-else-if="notFound || !bankAccount">
			<EmptyState title="Rekening bank tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Detail Rekening Bank</h3>
				<dl class="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Kode Bank</dt>
					<dd class="text-ink">{{ bankAccount.bank_code }}</dd>
					<dt class="text-ink-muted">Nama Bank</dt>
					<dd class="text-ink">{{ bankAccount.bank_name }}</dd>
					<dt class="text-ink-muted">Rekening</dt>
					<dd class="text-ink">{{ bankAccount.account_number }}</dd>
					<dt class="text-ink-muted">Atas Nama</dt>
					<dd class="text-ink">{{ bankAccount.account_holder || '—' }}</dd>
					<dt class="text-ink-muted">Akun Perkiraan</dt>
					<dd class="text-ink">{{ bankAccount.account_code }} — {{ bankAccount.account_name }}</dd>
					<dt class="text-ink-muted">Keterangan</dt>
					<dd class="text-ink">{{ bankAccount.notes }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
