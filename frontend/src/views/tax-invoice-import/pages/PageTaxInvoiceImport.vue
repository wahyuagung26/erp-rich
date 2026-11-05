<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import axios from 'axios'
import { IconUpload, IconFileImport, IconRefresh, IconExternalLink } from '@tabler/icons-vue'
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
import { IMPORT_SOURCES, reportUrl, rowStatusLabel, rowStatusTone, validateImportFile } from '@/views/tax-invoice-import/schema'
import type { TaxInvoiceImportPreview, TaxInvoiceImportRowStatus, TaxInvoiceImportSource } from '@/utils/types'

const { ask } = useConfirm()
const toast = useToast()
const source = ref<TaxInvoiceImportSource>('purchase_invoice')
const current = computed(() => IMPORT_SOURCES.find((item) => item.value === source.value)!)
const file = ref<File>()
const fileError = ref('')
const preview = ref<TaxInvoiceImportPreview>()
const uploading = ref(false)
const importing = ref(false)
const fileInput = ref<HTMLInputElement>()

function reset() {
	file.value = undefined
	fileError.value = ''
	preview.value = undefined
	if (fileInput.value) fileInput.value.value = ''
}
// Each source has its own report/file, so switching tabs starts over.
watch(source, reset)

// ponytail: no FileUpload base component; a native file input is the whole feature. Add a dropzone when asked.
function onPick(event: Event) {
	file.value = (event.target as HTMLInputElement).files?.[0]
	fileError.value = ''
	preview.value = undefined
}

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
				const res = await api.post<{ message: string }>('/tax-invoice-import', { token: value.token })
				toast.success(res.data.message)
				reset()
			} catch (error) {
				toast.error(message(error, 'Faktur pajak tidak dapat diimpor'))
			} finally {
				importing.value = false
			}
		}
	)
}

const summaryOrder: TaxInvoiceImportRowStatus[] = ['matched', 'to_be_replaced', 'unmatched', 'skipped', 'error']
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Import Faktur Pajak" subtitle="Pembelian" />
		<Panel>
			<div class="space-y-6">
				<Tabs v-model="source" :tabs="IMPORT_SOURCES.map((item) => ({ label: item.label, value: item.value }))" />

				<section class="space-y-3">
					<div class="flex items-center justify-between gap-3">
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
					<ol class="space-y-2 text-m text-ink">
						<li><span class="font-medium">1.</span> Export Laporan {{ current.report }} untuk masa pajak yang dibutuhkan.</li>
						<li>
							<span class="font-medium">2.</span> Isi kolom Nomor Seri Faktur Pajak dan Tanggal Faktur Pajak yang masih kosong pada file hasil export.
						</li>
						<li><span class="font-medium">3.</span> Upload file yang sama, periksa pratinjau, lalu impor ke {{ current.target }}.</li>
					</ol>
					<ul class="list-disc space-y-1 pl-5 text-s text-ink-muted">
						<li>Yang diupload adalah file export laporan itu sendiri, bukan template terpisah.</li>
						<li>Jangan ubah kolom Referensi — kolom ini dipakai untuk mencocokkan dokumen.</li>
						<li>Baris yang sudah punya faktur akan diganti; baris dengan nomor seri dan tanggal kosong dilewati.</li>
					</ul>
				</section>

				<section class="space-y-3">
					<h3 class="subhead">Upload File</h3>
					<FormField label="File Laporan" :error="fileError" hint="XLSX, XLS, atau CSV · maksimal 10 MB">
						<input
							ref="fileInput"
							type="file"
							accept=".xlsx,.xls,.csv"
							class="text-s text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-fill file:px-3 file:py-1.5 file:text-s file:text-ink"
							@change="onPick"
						/>
					</FormField>
					<div class="flex justify-end">
						<Button size="sm" :loading="uploading" :disabled="!file" @click="upload"
							><IconUpload v-if="!uploading" class="h-4 w-4" /> Upload &amp; Preview</Button
						>
					</div>
				</section>

				<section v-if="preview" class="space-y-3">
					<h3 class="subhead">Pratinjau</h3>
					<div class="flex flex-wrap items-center gap-2">
						<Badge v-for="status in summaryOrder" :key="status" :tone="rowStatusTone[status]"
							>{{ rowStatusLabel[status] }}: {{ preview.summary[status] }}</Badge
						>
						<span class="text-s text-ink-muted">dari {{ preview.summary.total }} baris · {{ preview.file_name }}</span>
					</div>
					<div class="overflow-x-auto">
						<table class="w-full min-w-[820px] text-m">
							<thead>
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
								<tr v-for="item in preview.rows" :key="item.row" class="border-b border-hairline last:border-0">
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
					</div>
					<div class="flex flex-wrap justify-end gap-2 pt-2">
						<Button variant="secondary" size="sm" @click="reset"><IconRefresh class="h-4 w-4" /> Upload Ulang</Button>
						<Button size="sm" :loading="importing" :disabled="!importable" @click="submit"
							><IconFileImport v-if="!importing" class="h-4 w-4" /> Impor {{ importable }} Faktur</Button
						>
					</div>
				</section>
			</div>
		</Panel>
	</div>
</template>
