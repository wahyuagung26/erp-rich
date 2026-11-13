<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IconArrowLeft, IconDeviceFloppy, IconDownload, IconFileSearch, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useCompanyStore } from '@/stores/company'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Button from '@/components/base/Button.vue'
import Input from '@/components/base/Input.vue'
import FileDrop from '@/components/base/FileDrop.vue'
import FormField from '@/components/base/FormField.vue'
import Modal from '@/components/base/Modal.vue'
import Badge from '@/components/base/Badge.vue'
import { downloadBatchTemplate, readBatchFile, type BatchDepartment, type ImportPreviewItem } from '../excel'

const router = useRouter()
const toast = useToast()
const company = useCompanyStore()
const year = ref(String(new Date().getFullYear()))
const file = ref<File>()
const busy = ref(false)
const preview = ref<ImportPreviewItem[]>([])
const valid = ref(false)
const payload = ref<BatchDepartment[]>([])
const confirmOpen = ref(false)
const done = ref<{ id: number; number: string; department_name: string }[]>([])
let generation = 0
watch([year, file, () => company.activeId], () => {
	generation++
	preview.value = []
	valid.value = false
	payload.value = []
	done.value = []
	confirmOpen.value = false
})
async function template() {
	if (busy.value) return
	busy.value = true
	try {
		await downloadBatchTemplate(Number(year.value))
	} catch {
		toast.error('Gagal mengunduh template. Coba lagi.')
	} finally {
		busy.value = false
	}
}
async function inspect() {
	if (busy.value) return
	if (!file.value || !Number.isInteger(Number(year.value)) || Number(year.value) < 2000 || Number(year.value) > 2100) {
		toast.error('Pilih file dan isi tahun anggaran yang valid.')
		return
	}
	busy.value = true
	const current = generation
	try {
		const departments = await readBatchFile(file.value)
		if (generation !== current) return
		const result = (
			await api.post<{ data: { departments: ImportPreviewItem[]; valid: boolean } }>('/budgeting/import/preview', {
				year: Number(year.value),
				departments
			})
		).data.data
		if (generation !== current) return
		payload.value = departments
		preview.value = result.departments
		valid.value = result.valid
		if (!result.valid) toast.error('Ada departemen yang tidak dapat diimport. Perbaiki file lalu periksa kembali.')
		else toast.success('File diperiksa. Tinjau hasil sebelum menyimpan.')
	} catch (e) {
		if (generation === current) toast.error(e instanceof Error && !('isAxiosError' in e) ? e.message : errorMessage(e))
	} finally {
		busy.value = false
	}
}
async function commit() {
	if (busy.value || !valid.value) return
	busy.value = true
	const current = generation
	try {
		const result = await api.post<{ data: { documents: { id: number; number: string; department_name: string }[] } }>('/budgeting/import/commit', {
			year: Number(year.value),
			departments: payload.value
		})
		if (generation !== current) return
		done.value = result.data.data.documents
		confirmOpen.value = false
		preview.value = []
		valid.value = false
		toast.success('Budget multi-departemen berhasil diimport')
	} catch (e) {
		if (generation === current) {
			confirmOpen.value = false
			valid.value = false
			toast.error(errorMessage(e))
		}
	} finally {
		busy.value = false
	}
}
</script>
<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Import Budget Multi-Departemen" subtitle="Unggah anggaran beberapa departemen sekaligus dari satu file Excel"
			><template #actions
				><Button variant="subtle" @click="router.push('/budgeting/budgets')"><IconArrowLeft class="h-4 w-4" /> Kembali</Button></template
			></PageHeader
		>
		<Panel class="space-y-8">
			<section class="space-y-3">
				<h3 class="subhead">1. Persiapan</h3>
				<p class="text-s text-ink-muted">
					Satu file dapat berisi beberapa departemen. Budget berstatus Draft atau Ditolak dapat diganti; budget yang diajukan atau disetujui tidak
					dapat diganti.
				</p>
				<div class="flex flex-wrap items-end gap-3">
					<FormField label="Tahun Anggaran" required><Input v-model="year" type="number" min="2000" max="2100" /></FormField
					><Button variant="outline" :loading="busy" @click="template"><IconDownload v-if="!busy" class="h-4 w-4" /> Unduh Template Excel</Button>
				</div>
			</section>
			<section v-if="!done.length" class="space-y-3">
				<h3 class="subhead">2. Pilih File</h3>
				<FileDrop v-model="file" accept=".xlsx" hint="Maksimal 5 MB dan 2.000 rincian." />
				<div class="flex justify-end">
					<Button :loading="busy" @click="inspect"><IconFileSearch v-if="!busy" class="h-4 w-4" /> Periksa File</Button>
				</div>
			</section>
			<section v-if="preview.length" class="space-y-3">
				<h3 class="subhead">3. Tinjau Hasil</h3>
				<p class="text-s text-ink-muted">Seluruh departemen disimpan bersama. Bila ada yang ditolak, perbaiki file sebelum mengulangi pemeriksaan.</p>
				<div
					v-for="item in preview"
					:key="item.department_code"
					class="flex flex-wrap items-start justify-between gap-3 border-b border-hairline py-3"
				>
					<div>
						<p class="font-semibold">{{ item.department_code }} — {{ item.department_name || 'Tidak ditemukan' }}</p>
						<p v-if="item.number" class="text-s text-ink-muted">{{ item.number }}</p>
						<p v-for="message in item.errors" :key="message" class="text-s text-danger">{{ message }}</p>
					</div>
					<Badge :tone="item.action === 'reject' ? 'danger' : item.action === 'replace' ? 'warning' : 'success'">{{
						item.action === 'reject' ? 'Ditolak' : item.action === 'replace' ? 'Mengganti draft' : 'Budget baru'
					}}</Badge>
				</div>
				<div class="flex justify-end">
					<Button v-if="valid" @click="confirmOpen = true"><IconDeviceFloppy class="h-4 w-4" /> Simpan Semua Budget</Button>
				</div>
			</section>
			<section v-if="done.length" class="space-y-3">
				<h3 class="subhead">Import Selesai</h3>
				<div v-for="item in done" :key="item.id" class="flex justify-between gap-3 border-b border-hairline py-2">
					<span>{{ item.department_name }}</span
					><button class="text-primary-dark hover:underline" @click="router.push(`/budgeting/budgets/${item.id}`)">{{ item.number }}</button>
				</div>
				<div class="flex justify-end">
					<Button variant="outline" @click="router.push('/budgeting/budgets')"><IconArrowLeft class="h-4 w-4" /> Kembali ke Daftar</Button>
				</div>
			</section>
		</Panel>
		<Modal :open="confirmOpen" title="Simpan Semua Budget" @close="confirmOpen = false"
			><p>Import akan menyimpan {{ payload.length }} departemen. Draft atau budget ditolak yang ditandai akan diganti dengan rincian dari file.</p>
			<template #footer
				><Button variant="secondary" @click="confirmOpen = false"><IconX class="h-4 w-4" /> Batal</Button
				><Button :loading="busy" @click="commit"><IconDeviceFloppy v-if="!busy" class="h-4 w-4" /> Simpan Semua</Button></template
			></Modal
		>
	</div>
</template>
