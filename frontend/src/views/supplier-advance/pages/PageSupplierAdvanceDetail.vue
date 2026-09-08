<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { IconArrowLeft, IconPaperclip, IconPencil, IconPrinter, IconTrash } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { date, money } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import Amount from '@/components/base/Amount.vue'
import RiwayatPemakaian from '@/views/supplier-advance/components/RiwayatPemakaian.vue'
import type { SupplierAdvance } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const advance = ref<SupplierAdvance>()
const loading = ref(true)
const notFound = ref(false)

onMounted(load)

async function load() {
	try {
		const res = await api.get<{ data: SupplierAdvance }>(`/supplier-advance/${route.params.id}`)
		advance.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}

const locked = computed(() => (advance.value?.used ?? 0) > 0)

function cetak() {
	const value = advance.value
	if (!value) return
	const win = window.open('', '_blank', 'width=900,height=700')
	if (!win) {
		toast.info('Cetak tersedia di aplikasi prototype')
		return
	}
	win.document.open()
	win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Uang Muka Supplier ${value.number}</title>
<style>body{font-family:ui-sans-serif,system-ui,sans-serif;padding:32px;color:#111}table{border-collapse:collapse;width:100%}td,th{padding:6px 8px;border-bottom:1px solid #ddd;text-align:left}th{text-align:right}</style>
</head><body><h2>Uang Muka Supplier</h2>
<p><strong>${value.number}</strong> &middot; ${date(value.date)} &middot; ${value.department_name ?? ''}</p>
<table>${[
		['Supplier', `${value.supplier_code ?? ''} — ${value.supplier_name ?? ''}`],
		['Nominal', `Rp ${money(value.amount)}`],
		['Terpakai', `Rp ${money(value.used)}`],
		['Saldo Tersedia', `Rp ${money(value.remaining)}`],
		['Akun Kas / Bank', `${value.cash_account_code ?? ''} — ${value.cash_account_name ?? ''}`],
		['Jenis Uang Muka', value.advance_type],
		['Arus Kas', value.cash_flow_name ?? value.cash_flow ?? ''],
		['Keterangan', value.description || ''],
		['No Hutang Terakhir', value.last_payable_number ?? '-']
	]
		.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
		.join('')}
</table></body></html>`)
	win.document.close()
	win.focus()
	win.print()
}

function remove() {
	const value = advance.value
	if (!value) return
	ask(
		{ title: 'Hapus uang muka supplier', message: `Hapus uang muka supplier "${value.number}"?`, type: 'danger', confirmText: 'Hapus' },
		async () => {
			try {
				await api.delete(`/supplier-advance/${value.id}`)
				toast.success('Uang muka supplier dihapus')
				router.push('/supplier-advance')
			} catch (err) {
				if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Uang muka supplier tidak dapat dihapus')
			}
		}
	)
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Uang Muka Supplier" subtitle="Pembelian">
			<template #actions>
				<div class="flex flex-wrap items-center gap-2">
					<Button size="sm" variant="subtle" @click="router.push('/supplier-advance')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button>
					<Button size="sm" variant="secondary" @click="cetak"><IconPrinter class="h-4 w-4" /> Cetak</Button>
					<Button size="sm" variant="secondary" @click="router.push(`/supplier-advance/edit/${advance!.id}`)">
						<IconPencil class="h-4 w-4" /> Edit
					</Button>
					<Button
						size="sm"
						variant="subtle"
						:disabled="locked"
						:title="locked ? 'Uang muka yang sudah dipakai tidak boleh dihapus' : undefined"
						@click="remove"
					>
						<IconTrash class="h-4 w-4" /> Hapus
					</Button>
				</div>
			</template>
		</PageHeader>

		<Panel v-if="loading"><Skeleton :lines="9" /></Panel>
		<Panel v-else-if="notFound || !advance">
			<EmptyState title="Uang muka supplier tidak ditemukan" description="Data mungkin sudah dihapus." />
		</Panel>
		<Panel v-else>
			<div class="space-y-8">
				<section class="space-y-3">
					<h3 class="subhead">Informasi Transaksi</h3>
					<p class="text-s text-ink-subtle">Identitas transaksi dan konteks pencatatan.</p>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nomor Transaksi</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.number }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Tanggal</dt>
							<dd class="mt-1 text-m text-ink">{{ date(advance.date) }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Departemen</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.department_name }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Supplier</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.supplier_code }} — {{ advance.supplier_name }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Keterangan</dt>
							<dd class="mt-1 whitespace-pre-line text-m text-ink">{{ advance.description || '–' }}</dd>
						</div>
					</dl>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Pembayaran dan Saldo</h3>
					<p class="text-s text-ink-subtle">Nilai uang muka, sumber dana, dan klasifikasi arus kas.</p>
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
						<div>
							<dt class="text-s text-ink-muted">Nominal</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="advance.amount" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Terpakai</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="advance.used" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Saldo Tersedia</dt>
							<dd class="mt-1 text-m text-ink"><Amount :value="advance.remaining" /></dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Akun Kas / Bank</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.cash_account_code }} — {{ advance.cash_account_name }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Jenis Uang Muka</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.advance_type }}</dd>
						</div>
						<div>
							<dt class="text-s text-ink-muted">Arus Kas</dt>
							<dd class="mt-1 text-m text-ink">{{ advance.cash_flow_name ?? advance.cash_flow ?? '–' }}</dd>
						</div>
						<div class="md:col-span-3">
							<dt class="text-s text-ink-muted">Lampiran</dt>
							<dd class="mt-1 text-m">
								<a
									v-if="advance.attachment"
									:href="advance.attachment.data_url"
									:download="advance.attachment.name"
									target="_blank"
									class="inline-flex items-center gap-1 text-primary-dark hover:underline"
								>
									<IconPaperclip class="h-4 w-4" /> {{ advance.attachment.name }}
								</a>
								<span v-else class="text-ink-muted">–</span>
							</dd>
						</div>
					</dl>
				</section>

				<RiwayatPemakaian :advance-id="advance.id" />
			</div>
		</Panel>
	</div>
</template>
