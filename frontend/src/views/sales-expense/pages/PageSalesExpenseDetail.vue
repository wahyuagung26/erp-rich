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
import type { SalesExpense } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const salesExpense = ref<SalesExpense>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: SalesExpense }>(`/sales-expense/${route.params.id}`)
		salesExpense.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

function remove() {
	const t = salesExpense.value
	if (!t) return
	ask({ title: 'Hapus biaya penjualan', message: `Hapus "${t.code} — ${t.name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/sales-expense/${t.id}`)
		toast.success('Biaya penjualan dihapus')
		router.push('/sales-expense')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Biaya Penjualan" subtitle="Master data biaya penjualan">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/sales-expense')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="salesExpense">
						<Button size="sm" @click="router.push(`/sales-expense/edit/${salesExpense.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="4" /></Panel>

		<Panel v-else-if="notFound || !salesExpense">
			<EmptyState title="Biaya penjualan tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<section class="space-y-3">
				<h3 class="subhead">Detail Biaya</h3>
				<dl class="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2.5 text-m">
					<dt class="text-ink-muted">Kode</dt>
					<dd class="text-ink">{{ salesExpense.code }}</dd>
					<dt class="text-ink-muted">Nama Biaya</dt>
					<dd class="text-ink">{{ salesExpense.name }}</dd>
					<dt class="text-ink-muted">Akun Biaya</dt>
					<dd class="text-ink">{{ salesExpense.account_code }} — {{ salesExpense.account_name }}</dd>
					<dt class="text-ink-muted">Catatan</dt>
					<dd class="whitespace-pre-line text-ink">{{ salesExpense.notes || '—' }}</dd>
				</dl>
			</section>
		</Panel>
	</div>
</template>
