<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconArrowLeft, IconBuilding, IconPencil, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import Badge from '@/components/base/Badge.vue'
import { effectiveBrandHex } from '@/utils/brand'
import { companyTypeLabel } from '@/views/company/schema'
import type { Company } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()

const company = ref<Company>()
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: Company }>(`/company/${route.params.id}`)
		company.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

const dash = (v: string) => v || '–'
// The sample button shows the colour the app really uses (darkened when white text would not read on it).
const brandShown = computed(() => effectiveBrandHex(company.value?.brand_color ?? ''))

function remove() {
	const c = company.value
	if (!c) return
	ask({ title: 'Hapus company', message: `Hapus "${c.code} — ${c.short_name}"?`, type: 'danger', confirmText: 'Hapus' }, async () => {
		await api.delete(`/company/${c.id}`)
		toast.success('Perusahaan dihapus')
		router.push('/company')
	})
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Detail Perusahaan" subtitle="Master data company / badan usaha">
			<template #actions>
				<div class="flex gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/company')"> <IconArrowLeft class="h-4 w-4" /> Kembali </Button>
					<template v-if="company">
						<Button size="sm" @click="router.push(`/company/edit/${company.id}`)"> <IconPencil class="h-4 w-4" /> Edit </Button>
						<Button size="sm" variant="subtle" @click="remove"> <IconTrash class="h-4 w-4" /> Hapus </Button>
					</template>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="6" /></Panel>

		<Panel v-else-if="notFound || !company">
			<EmptyState title="Perusahaan tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>

		<Panel v-else>
			<div class="space-y-8">
				<!-- Identity first, same order as the form: logo beside name + code, then legal details. -->
				<section class="space-y-4">
					<h3 class="subhead">Informasi Perusahaan</h3>
					<div class="flex items-start gap-5">
						<img v-if="company.logo_url" :src="company.logo_url" alt="Logo perusahaan" class="h-24 w-24 shrink-0 rounded-md bg-fill object-contain" />
						<div v-else class="grid h-24 w-24 shrink-0 place-items-center rounded-md bg-fill text-ink-subtle" title="Belum ada logo">
							<IconBuilding class="h-8 w-8" />
						</div>
						<div class="min-w-0 space-y-1">
							<h2 class="text-heading-s font-semibold text-ink">{{ company.short_name }}</h2>
							<p class="text-m text-ink-muted">{{ company.code }}</p>
						</div>
					</div>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div class="md:col-span-2">
							<dt class="text-s text-ink-muted">Nama Legal / PT</dt>
							<dd class="mt-1 text-m text-ink">{{ dash(company.legal_name) }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">NPWP</dt>
							<dd class="mt-1 text-m text-ink">{{ dash(company.npwp) }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Alamat</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ dash(company.address) }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Pengaturan</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Tipe Perusahaan</dt>
							<dd class="mt-1 text-m text-ink">{{ companyTypeLabel(company.company_type) }}</dd>
						</div>
						<div class="md:col-span-2">
							<dt class="text-s text-ink-muted">Nonaktifkan Cek Stok Minus</dt>
							<dd class="mt-1 text-m text-ink">
								<!-- A temporary override is flagged so it is not forgotten after the stock migration. -->
								<Badge v-if="company.disable_minus_stock_check" tone="warning">Ya — Invoice Penjualan boleh disimpan meski stok kurang</Badge>
								<template v-else>Tidak</template>
							</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Tampilan</h3>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Warna Brand</dt>
							<dd class="mt-1.5 flex flex-wrap items-center gap-3">
								<span class="inline-block h-6 w-6 rounded-full" :style="{ backgroundColor: company.brand_color }" />
								<span class="tnum text-m text-ink">{{ company.brand_color }}</span>
								<span class="inline-flex h-7 items-center rounded-md px-2.5 text-s font-medium text-white" :style="{ backgroundColor: brandShown }"
									>Simpan</span
								>
							</dd>
						</div>
						<div class="md:col-span-2">
							<dt class="text-s text-ink-muted">Warna Header Laporan</dt>
							<dd class="mt-1.5 flex flex-wrap items-center gap-3">
								<span class="inline-block h-6 w-6 rounded-full" :style="{ backgroundColor: company.report_header_color }" />
								<span class="tnum text-m text-ink">{{ company.report_header_color }}</span>
								<span
									class="grid h-7 w-full max-w-[220px] grid-cols-[1fr_auto] items-center gap-4 rounded-md px-2.5 text-s font-semibold text-ink"
									:style="{ backgroundColor: company.report_header_color }"
								>
									<span>Nama Akun</span><span>Saldo</span>
								</span>
							</dd>
						</div>
					</dl>
				</section>
			</div>
		</Panel>
	</div>
</template>
