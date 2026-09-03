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
import { companyTypeLabel } from '@/views/perusahaan/schema'
import type { Perusahaan } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const perusahaan = ref<Perusahaan>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: Perusahaan }>(`/perusahaan/${route.params.id}`)
		perusahaan.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

const dash = (v: string) => v || '–'

function remove() {
	const c = perusahaan.value
	if (!c) return
	ask({ title: 'Hapus perusahaan', message: `Hapus "${c.code} — ${c.short_name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/perusahaan/${c.id}`)
		toast.success('Perusahaan dihapus')
		router.push('/perusahaan')
	})
}
</script>

<template>
	<!-- whole column capped so PageHeader actions line up with the Panel's right edge -->
	<div class="max-w-5xl space-y-4 p-4">
		<PageHeader title="Detail Perusahaan" subtitle="Master data perusahaan / badan usaha">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/perusahaan')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="perusahaan">
						<Button size="sm" @click="router.push(`/perusahaan/edit/${perusahaan.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="6" /></Panel>

		<Panel v-else-if="notFound || !perusahaan">
			<EmptyState title="Perusahaan tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi Perusahaan</h3>
					<dl class="grid grid-cols-[180px_1fr] gap-x-4 gap-y-2.5 text-m">
						<dt class="text-ink-muted">Kode Perusahaan</dt>
						<dd class="text-ink">{{ perusahaan.code }}</dd>
						<dt class="text-ink-muted">Nama Pendek</dt>
						<dd class="text-ink">{{ perusahaan.short_name }}</dd>
						<dt class="text-ink-muted">Nama Legal / PT</dt>
						<dd class="text-ink">{{ dash(perusahaan.legal_name) }}</dd>
						<dt class="text-ink-muted">NPWP</dt>
						<dd class="text-ink">{{ dash(perusahaan.npwp) }}</dd>
						<dt class="text-ink-muted">Logo</dt>
						<dd>
							<img v-if="perusahaan.logo_url" :src="perusahaan.logo_url" alt="Logo perusahaan" class="h-16 w-16 rounded-md object-contain" />
							<span v-else class="text-ink">–</span>
						</dd>
						<dt class="text-ink-muted">Alamat</dt>
						<dd class="whitespace-pre-line text-ink">{{ dash(perusahaan.address) }}</dd>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Pengaturan</h3>
					<dl class="grid grid-cols-[180px_1fr] items-center gap-x-4 gap-y-2.5 text-m">
						<dt class="text-ink-muted">Tipe Perusahaan</dt>
						<dd class="text-ink">{{ companyTypeLabel(perusahaan.company_type) }}</dd>
						<dt class="text-ink-muted">Pendataan Karyawan</dt>
						<dd class="text-ink">{{ perusahaan.hr_enabled ? 'Ya, aktif untuk modul HR' : 'Tidak' }}</dd>
						<dt class="text-ink-muted">Warna Header Laporan</dt>
						<dd class="flex items-center gap-2">
							<span class="inline-block h-5 w-8 rounded" :style="{ backgroundColor: perusahaan.report_header_color }" />
							<span class="font-mono tnum text-ink">{{ perusahaan.report_header_color }}</span>
						</dd>
					</dl>
				</section>
			</div>
		</Panel>
	</div>
</template>
