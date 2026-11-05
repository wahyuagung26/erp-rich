<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
	IconAlertCircle,
	IconAlertTriangle,
	IconArrowRight,
	IconCircleCheck,
	IconExternalLink,
	IconFileImport,
	IconPlayerSkipForward,
	IconRefresh,
	IconReplace,
	IconUpload
} from '@tabler/icons-vue'
import api from '@/utils/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { date } from '@/utils/format'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Tabs from '@/components/base/Tabs.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import FormField from '@/components/base/FormField.vue'
import FileDrop from '@/components/base/FileDrop.vue'
import KpiFilter, { type KpiItem } from '@/components/base/KpiFilter.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import { IMPORT_SOURCES, reportUrl, rowStatusLabel, rowStatusTone, validateImportFile } from '@/views/tax-invoice-import/schema'
import type { TaxInvoiceImportPreview, TaxInvoiceImportRowStatus, TaxInvoiceImportSource } from '@/utils/types'

const router = useRouter()
const { ask } = useConfirm()
const toast = useToast()
const source = ref<TaxInvoiceImportSource>('purchase_invoice')
const current = computed(() => IMPORT_SOURCES.find((item) => item.value === source.value)!)
const file = ref<File>()
const fileError = ref('')
const preview = ref<TaxInvoiceImportPreview>()
const result = ref<{ imported: number; skipped: number }>()
const uploading = ref(false)
const importing = ref(false)
const statusFilter = ref<string | null>(null)
const PAGE_SIZE = 100
const visible = ref(PAGE_SIZE)

function reset() {
	file.value = undefined
	fileError.value = ''
	preview.value = undefined
	result.value = undefined
	statusFilter.value = null
	visible.value = PAGE_SIZE
}
// Each source has its own report/file, so switching tabs starts over.
watch(source, reset)

// A new file invalidates the previous preview.
watch(file, () => {
	fileError.value = ''
	preview.value = undefined
	statusFilter.value = null
	visible.value = PAGE_SIZE
})

const message = (error: unknown, fallback: string) => (axios.isAxiosError(error) ? (error.response?.data?.message ?? fallback) : fallback)

async function upload() {
	const error = validateImportFile(file.value)
	fileError.value = error ?? ''
	if (error || !file.value || uploading.value) return
	uploading.value = true
	try {
		const body = new FormData()
		body.append('source', source.value)
		body.append('file', file.value)
		const res = await api.post<{ data: TaxInvoiceImportPreview }>('/tax-invoice-import/preview', body, {
			// the shared instance defaults to JSON, which would serialise the FormData and drop the file
			headers: { 'Content-Type': 'multipart/form-data' }
		})
		preview.value = res.data.data
	} catch (e) {
		if (axios.isAxiosError(e) && e.response?.status === 422 && e.response.data?.errors?.file) fileError.value = e.response.data.errors.file[0]
		else toast.error(message(e, 'File tidak dapat diproses'))
	} finally {
		uploading.value = false
	}
}

const importable = computed(() => (preview.value?.summary.matched ?? 0) + (preview.value?.summary.to_be_replaced ?? 0))

function submit() {
	const value = preview.value
	if (!value || !importable.value) return
	ask(
		{
			title: 'Impor faktur pajak',
			message: `Impor ${importable.value} faktur pajak ke ${current.value.target}? Faktur yang sudah ada pada dokumen akan diganti.`,
			type: 'info',
			confirmText: 'Impor'
		},
		async () => {
			importing.value = true
			try {
				const res = await api.post<{ data: { imported: number; skipped: number }; message: string }>('/tax-invoice-import', { token: value.token })
				toast.success(res.data.message)
				reset()
				result.value = res.data.data
			} catch (error) {
				toast.error(message(error, 'Faktur pajak tidak dapat diimpor'))
			} finally {
				importing.value = false
			}
		}
	)
}

// Summary tiles double as the row filter (same pattern as the list pages' KPI tiles).
const summaryDefs: { status: TaxInvoiceImportRowStatus; icon: KpiItem['icon']; tone?: KpiItem['tone']; attention?: boolean; emptyText: string }[] = [
	{ status: 'matched', icon: IconCircleCheck, tone: 'success', emptyText: 'Tidak ada' },
	{ status: 'to_be_replaced', icon: IconReplace, tone: 'info', emptyText: 'Tidak ada' },
	{ status: 'unmatched', icon: IconAlertTriangle, tone: 'warning', attention: true, emptyText: 'Semua referensi cocok' },
	{ status: 'skipped', icon: IconPlayerSkipForward, tone: 'muted', emptyText: 'Tidak ada' },
	{ status: 'error', icon: IconAlertCircle, tone: 'danger', attention: true, emptyText: 'Tidak ada error' }
]
const kpiItems = computed<KpiItem[]>(() =>
	summaryDefs.map((def) => ({
		key: def.status,
		label: rowStatusLabel[def.status],
		count: preview.value?.summary[def.status],
		icon: def.icon,
		tone: def.tone,
		attention: def.attention,
		emptyText: def.emptyText
	}))
)
const filteredRows = computed(() => (preview.value?.rows ?? []).filter((item) => !statusFilter.value || item.status === statusFilter.value))
const shownRows = computed(() => filteredRows.value.slice(0, visible.value))
function selectStatus(key: string | null) {
	statusFilter.value = key
	visible.value = PAGE_SIZE
}

const steps = computed(() => [
	{ title: `Export Laporan ${current.value.report}`, text: 'Ambil file export untuk masa pajak yang dibutuhkan.' },
	{ title: 'Isi nomor seri & tanggal', text: 'Lengkapi Nomor Seri dan Tanggal Faktur Pajak yang masih kosong. Jangan ubah kolom Referensi.' },
	{ title: 'Upload & impor', text: `Upload file yang sama, periksa pratinjau, lalu impor ke ${current.value.target}.` }
])
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Import Faktur Pajak" subtitle="Pembelian" />
		<Panel>
			<div class="space-y-8">
				<Tabs v-model="source" :tabs="IMPORT_SOURCES.map((item) => ({ label: item.label, value: item.value }))" />

				<section class="space-y-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<h3 class="subhead">Cara Import</h3>
						<a
							:href="reportUrl(current.reportTab)"
							target="_blank"
							rel="noopener"
							class="inline-flex items-center gap-1.5 rounded-md bg-fill px-3 py-1.5 text-s font-medium text-ink hover:bg-hairline"
						>
							<IconExternalLink class="h-4 w-4" /> Buka Laporan Pajak
						</a>
					</div>
					<ol class="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
						<li v-for="(step, index) in steps" :key="step.title" class="flex gap-3">
							<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-s font-semibold text-primary-dark">{{
								index + 1
							}}</span>
							<div class="min-w-0">
								<p class="text-m font-medium text-ink">{{ step.title }}</p>
								<p class="mt-0.5 text-s text-ink-muted">{{ step.text }}</p>
							</div>
						</li>
					</ol>
				</section>

				<section v-if="result" class="flex flex-col items-center gap-3 py-6 text-center">
					<span class="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success"
						><IconCircleCheck class="h-7 w-7"
					/></span>
					<div>
						<p class="text-heading-s text-ink">{{ result.imported }} faktur pajak berhasil diimpor</p>
						<p v-if="result.skipped" class="mt-1 text-s text-ink-muted">{{ result.skipped }} baris dilewati</p>
					</div>
					<div class="flex flex-wrap justify-center gap-2 pt-1">
						<Button variant="secondary" size="sm" @click="reset"><IconUpload class="h-4 w-4" /> Import Lagi</Button>
						<Button size="sm" @click="router.push(current.route)">Lihat {{ current.target }} <IconArrowRight class="h-4 w-4" /></Button>
					</div>
				</section>

				<template v-else>
					<section class="space-y-3">
						<h3 class="subhead">Upload File</h3>
						<FormField label="File Laporan" :error="fileError">
							<FileDrop v-model="file" accept=".xlsx,.xls,.csv" hint="XLSX, XLS, atau CSV · maksimal 10 MB" :error="fileError" />
						</FormField>
						<div class="flex justify-end">
							<Button size="sm" :loading="uploading" :disabled="!file" @click="upload"
								><IconUpload v-if="!uploading" class="h-4 w-4" /> Upload &amp; Preview</Button
							>
						</div>
					</section>

					<section v-if="preview" class="space-y-3">
						<div class="flex flex-wrap items-baseline justify-between gap-2">
							<h3 class="subhead">Pratinjau</h3>
							<span class="text-s text-ink-muted">{{ preview.file_name }} · {{ preview.summary.total }} baris</span>
						</div>
						<KpiFilter :items="kpiItems" :active="statusFilter" @select="selectStatus" />
						<div class="max-h-[480px] overflow-auto">
							<table class="w-full min-w-[820px] text-m">
								<thead class="sticky top-0 z-10">
									<tr class="bg-fill text-left text-s font-medium text-ink-muted [&>th:first-child]:rounded-l-md [&>th:last-child]:rounded-r-md">
										<th class="px-3 py-2">Baris</th>
										<th class="px-3 py-2">Referensi</th>
										<th class="px-3 py-2">Nama</th>
										<th class="px-3 py-2">Nomor Seri Faktur Pajak</th>
										<th class="px-3 py-2">Tanggal Faktur Pajak</th>
										<th class="px-3 py-2">Status</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="item in shownRows" :key="item.row" class="border-b border-hairline last:border-0">
										<td class="tnum px-3 py-3 text-ink-muted">{{ item.row }}</td>
										<td class="whitespace-nowrap px-3 py-3 text-ink">{{ item.reference }}</td>
										<td class="px-3 py-3 text-ink">{{ item.name }}</td>
										<td class="whitespace-nowrap px-3 py-3 text-ink">{{ item.number || '–' }}</td>
										<td class="tnum whitespace-nowrap px-3 py-3 text-ink-muted">{{ item.date ? date(item.date) : '–' }}</td>
										<td class="px-3 py-3">
											<Badge class="whitespace-nowrap" :tone="rowStatusTone[item.status]">{{ rowStatusLabel[item.status] }}</Badge>
											<p v-if="item.message" class="mt-1 text-s text-ink-muted">{{ item.message }}</p>
										</td>
									</tr>
								</tbody>
							</table>
							<EmptyState v-if="!filteredRows.length" title="Tidak ada baris" description="Tidak ada baris dengan status ini." />
						</div>
						<div v-if="filteredRows.length > shownRows.length" class="flex justify-center">
							<Button variant="subtle" size="sm" @click="visible += PAGE_SIZE">
								Tampilkan lebih banyak ({{ shownRows.length }} dari {{ filteredRows.length }})
							</Button>
						</div>
						<div class="flex flex-wrap items-center justify-between gap-3 pt-2">
							<p class="text-s text-ink-muted">Baris yang sudah punya faktur akan diganti; baris dengan nomor seri dan tanggal kosong dilewati.</p>
							<div class="flex flex-wrap gap-2">
								<Button variant="secondary" size="sm" @click="reset"><IconRefresh class="h-4 w-4" /> Upload Ulang</Button>
								<Button size="sm" :loading="importing" :disabled="!importable" @click="submit"
									><IconFileImport v-if="!importing" class="h-4 w-4" /> Impor {{ importable }} Faktur</Button
								>
							</div>
						</div>
					</section>
				</template>
			</div>
		</Panel>
	</div>
</template>
