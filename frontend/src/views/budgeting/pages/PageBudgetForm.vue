<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconArrowLeft, IconDeviceFloppy, IconDownload, IconSend, IconUpload, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useCompanyStore } from '@/stores/company'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Button from '@/components/base/Button.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import FormField from '@/components/base/FormField.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import { downloadTemplate } from '../excel'
import { validateBudgetHeader } from '../schema'
import BudgetMatrix from '../components/BudgetMatrix.vue'
import BudgetImportModal from '../components/BudgetImportModal.vue'
import HelpTip from '@/components/base/HelpTip.vue'
import type { ApiList } from '@/utils/types'
import { codeExample, months, type BudgetAccount, type BudgetDocument, type BudgetLine, type RevisionPeriod } from '../types'

const props = defineProps<{ kind: 'budgets' | 'revisions' }>()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()
const company = useCompanyStore()
const base = `/budgeting/${props.kind}`
const revision = props.kind === 'revisions'
const edit = !!route.params.id
// The original budget is fixed when editing, or when the form was opened from the list's "Revisi" button (?budget_id=).
const budgetLocked = edit || !!route.query.budget_id
const title = `${edit ? 'Edit' : 'Tambah'} ${revision ? 'Revisi Budget' : 'Budget'}`
const subtitle = revision
	? edit
		? 'Ubah isi revisi sebelum diajukan'
		: 'Ubah anggaran yang sudah disetujui untuk bulan yang masih berjalan'
	: edit
		? 'Ubah rencana anggaran sebelum diajukan'
		: 'Buat rencana anggaran satu tahun untuk satu departemen'
const saving = ref(false)
const excelBusy = ref(false)
const importOpen = ref(false)
async function template() {
	if (excelBusy.value) return
	excelBusy.value = true
	try {
		await downloadTemplate(Number(year.value))
	} catch (e) {
		toast.error(e instanceof Error ? e.message : 'Gagal mengunduh template. Coba lagi.')
	} finally {
		excelBusy.value = false
	}
}
function applyImport(imported: BudgetLine[]) {
	lines.value = imported
	importOpen.value = false
	toast.success(`${imported.length} rincian dimuat ke form. Periksa lalu simpan budget.`)
}
const loading = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})
const docNumber = ref('')
const description = ref('')
const parentDescription = ref('')
const year = ref(String(new Date().getFullYear()))
const departmentId = ref<number | string | null>(null)
const departmentLabel = ref('')
const budgetId = ref<number | string | null>(null)
const budgetLabel = ref('')
const accounts = ref<BudgetAccount[]>([])
async function loadAccounts() {
	if (revision) return
	const companyId = company.activeId
	let page = 1,
		lastPage = 1
	const collected: BudgetAccount[] = []
	try {
		do {
			const response = await api.get<ApiList<BudgetAccount>>('/budgeting/accounts', { params: { page, per_page: 100 } })
			collected.push(...response.data.data)
			lastPage = response.data.meta.last_page
			page++
		} while (page <= lastPage && page <= 100)
		if (company.activeId === companyId) accounts.value = collected
	} catch (e) {
		if (company.activeId === companyId) toast.error(errorMessage(e))
	}
}
const lines = ref<BudgetLine[]>([])
const initialLines = ref<BudgetLine[]>([])
const period = ref<RevisionPeriod | null>(null)
const ytd = ref<Record<string, number> | null>(null)
const allYtd = ref(false)
let ytdGeneration = 0
watch([departmentId, allYtd], async ([dept, all]) => {
	const generation = ++ytdGeneration
	ytd.value = null
	if (!dept && !all) return // company-wide YTD needs no department
	try {
		const response = await api.get<{ data: { values: Record<string, number> } }>('/budgeting/ytd', { params: { department_id: all ? 'all' : dept } })
		if (generation === ytdGeneration) ytd.value = response.data.data.values
	} catch {
		if (generation === ytdGeneration) ytd.value = null
	}
})
const start = computed(() => Math.max(period.value?.revision_month_start ?? 1, new Date().getMonth() + 1))
const rincianHelp = computed(() =>
	revision
		? [`Bulan sebelum ${months[start.value - 1]} mengikuti budget awal dan tidak dapat diubah.`]
		: [
				'Buka kelompok akun lalu tambahkan rincian dengan tombol +.',
				'Kode rincian dan deskripsi wajib diisi; nominal per bulan opsional, total dihitung otomatis.',
				`Format kode: AWALAN/OBG{tahun}/KODE_DEPT/NNN, contoh ${codeExample(year.value)}.`,
				'EXP untuk akun OPEX dan CPX untuk akun CAPEX; tahun sama dengan Tahun Anggaran; KODE_DEPT 3 karakter.',
				'Kode tidak boleh sama dengan rincian lain atau budget lain yang masih aktif.'
			]
)
const deptLabel = (row: Record<string, unknown>) => `${row.code} — ${row.name}`
const budgetOptionLabel = (row: Record<string, unknown>) => `${row.number} — ${row.department_name} (${row.year})`
const copyLines = (source: BudgetLine[]) => source.map((l) => ({ ...l, months: [...l.months] }))

// Unsaved-changes guard for Batal / Kembali (legacy asks "Tinggalkan halaman?").
const snapshot = () => JSON.stringify([description.value, departmentId.value, year.value, budgetId.value, lines.value])
const baseline = ref('')
const dirty = computed(() => !loading.value && baseline.value !== '' && snapshot() !== baseline.value)
function leave() {
	if (!dirty.value) return router.push(base)
	confirm.ask({ title: 'Tinggalkan halaman?', message: 'Perubahan belum disimpan.', confirmText: 'Ya, Tinggalkan' }, () => router.push(base))
}

let selectionGeneration = 0
async function chooseBudget(row: Record<string, unknown> | null) {
	const generation = ++selectionGeneration
	lines.value = []
	initialLines.value = []
	if (!row) {
		departmentId.value = null
		departmentLabel.value = ''
		budgetLabel.value = ''
		parentDescription.value = ''
		return
	}
	if (row.number) budgetLabel.value = budgetOptionLabel(row)
	loading.value = true
	try {
		const [res, periodRes] = await Promise.all([
			api.get<{ data: BudgetDocument }>(`/budgeting/budgets/${row.id}`),
			api.get<{ data: RevisionPeriod }>('/budgeting/period')
		])
		if (generation !== selectionGeneration) return
		const doc = res.data.data
		period.value = periodRes.data.data
		year.value = String(doc.year)
		departmentId.value = doc.department_id
		departmentLabel.value = `${doc.department_code} — ${doc.department_name}`
		parentDescription.value = doc.description
		initialLines.value = copyLines(doc.lines)
		lines.value = copyLines(doc.lines)
	} catch (e) {
		if (generation === selectionGeneration) toast.error(errorMessage(e))
	} finally {
		if (generation === selectionGeneration) loading.value = false
	}
}
async function load() {
	loading.value = true
	try {
		if (revision) period.value = (await api.get<{ data: RevisionPeriod }>('/budgeting/period')).data.data
		if (edit) {
			const doc = (await api.get<{ data: BudgetDocument }>(`${base}/${route.params.id}`)).data.data
			if (!['Draft', 'Ditolak'].includes(doc.status)) {
				error.value = 'Dokumen tidak dapat diubah pada status ini.'
				return
			}
			if (revision && (!period.value?.is_open || doc.year !== period.value.year)) {
				error.value = 'Periode revisi belum terbuka untuk dokumen ini.'
				return
			}
			docNumber.value = doc.number
			initialLines.value = copyLines(doc.initial_lines ?? [])
			year.value = String(doc.year)
			description.value = doc.description
			departmentId.value = doc.department_id
			departmentLabel.value = `${doc.department_code} — ${doc.department_name}`
			budgetId.value = doc.budget_id ?? null
			budgetLabel.value = `${doc.budget_number} — ${doc.department_name} (${doc.year})`
			if (revision && doc.budget_id)
				parentDescription.value = (await api.get<{ data: BudgetDocument }>(`/budgeting/budgets/${doc.budget_id}`)).data.data.description
			lines.value = doc.lines.map((l, index) => ({
				...l,
				months: l.months.map((value, i) => (revision && i < start.value - 1 ? (doc.initial_lines?.[index]?.months[i] ?? value) : value))
			}))
		} else if (revision && route.query.budget_id) {
			budgetId.value = String(route.query.budget_id)
			const doc = (await api.get<{ data: BudgetDocument }>(`/budgeting/budgets/${budgetId.value}`)).data.data
			budgetLabel.value = `${doc.number} — ${doc.department_name} (${doc.year})`
			await chooseBudget({ id: doc.id })
		}
	} catch {
		error.value = 'Data tidak tersedia. Kembali ke daftar lalu coba lagi.'
	} finally {
		loading.value = false
		baseline.value = snapshot()
	}
}
function valid() {
	errors.value = validateBudgetHeader({ department_id: Number(departmentId.value), year: Number(year.value), description: description.value }) ?? {}
	if (revision && !budgetId.value) errors.value.budget_id = 'Pilih budget awal'
	if (Object.keys(errors.value).length || !lines.value.length) {
		toast.error('Lengkapi data dan tambahkan rincian sebelum menyimpan.')
		return false
	}
	return true
}
async function save(submit = false) {
	if (saving.value || !valid()) return
	saving.value = true
	const companyId = company.activeId
	let savedId: number | undefined
	try {
		const payload = {
			department_id: Number(departmentId.value),
			year: Number(year.value),
			budget_id: Number(budgetId.value),
			description: description.value,
			lines: lines.value
		}
		const res = edit
			? await api.put<{ data: BudgetDocument }>(`${base}/${route.params.id}`, payload)
			: await api.post<{ data: BudgetDocument }>(base, payload)
		savedId = res.data.data.id
		baseline.value = snapshot()
		if (company.activeId !== companyId) return
		if (submit) {
			await api.post(`${base}/${savedId}/actions`, { action: 'submit' })
			toast.success(`${revision ? 'Revisi budget' : 'Budget'} disimpan dan diajukan`)
		} else toast.success(`${revision ? 'Revisi budget' : 'Budget'} disimpan sebagai draft`)
		await router.push(`${base}/${savedId}`)
	} catch (e) {
		if (company.activeId !== companyId) return
		// Saved but not submitted: keep the draft and open it so nothing is lost.
		if (savedId) {
			toast.error(`Draft tersimpan, tetapi belum dapat diajukan. ${errorMessage(e)}`)
			await router.push(`${base}/${savedId}`)
		} else toast.error(errorMessage(e))
	} finally {
		saving.value = false
	}
}
function saveAndSubmit() {
	if (saving.value || !valid()) return
	confirm.ask(
		{
			title: 'Simpan lalu ajukan?',
			message: `${revision ? 'Revisi' : 'Budget'} akan disimpan dan langsung dikirim ke approver. Setelah diajukan, dokumen tidak bisa diedit sampai disetujui atau ditolak.`,
			confirmText: 'Ya, Simpan & Ajukan'
		},
		() => save(true)
	)
}
watch(
	() => company.activeId,
	(next, previous) => {
		if (previous && next !== previous) router.push(base)
	}
)
onMounted(() => {
	load()
	loadAccounts()
})
</script>
<template>
	<div class="space-y-4 p-4">
		<PageHeader :title="title" :subtitle="subtitle"
			><template #actions
				><Button variant="subtle" @click="leave"><IconArrowLeft class="h-4 w-4" /> Kembali</Button></template
			></PageHeader
		>
		<Panel>
			<EmptyState v-if="error" :title="error" />
			<p v-else-if="loading" class="py-8 text-center text-ink-muted">Memuat data…</p>
			<form v-else class="space-y-8" @submit.prevent="save(false)">
				<section class="space-y-3">
					<h3 class="subhead">Informasi {{ revision ? 'Revisi' : 'Budget' }}</h3>
					<p v-if="revision" class="rounded-md bg-fill p-3 text-ink-muted">
						<template v-if="period?.is_open"
							>Bulan 1 s/d {{ start - 1 }} dikunci sebagai <strong class="text-ink">Budget Awal</strong>. Anda hanya dapat merevisi nominal untuk
							<strong class="text-ink">Bulan {{ start }} – 12</strong> pada kolom Revisi.</template
						>
						<template v-else>Periode revisi saat ini tertutup. Atur dan aktifkan periode revisi sebelum menyimpan.</template>
					</p>
					<div class="grid gap-4" :class="revision ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'">
						<FormField :label="revision ? 'No. Revisi' : 'No. Budget'" help="Nomor dibuat otomatis oleh sistem saat disimpan."
							><Input :model-value="docNumber || '(Otomatis saat disimpan)'" disabled
						/></FormField>
						<FormField
							v-if="revision"
							label="Budget Awal"
							:error="errors.budget_id"
							:required="!budgetLocked"
							:help="edit ? 'Budget awal tidak dapat diubah setelah revisi dibuat.' : undefined"
						>
							<!-- Chosen in the list ("Revisi" button) or fixed by an existing revision: read-only. Picker only for a bare /tambah URL. -->
							<Input v-if="budgetLocked" :model-value="budgetLabel || '—'" disabled />
							<AsyncSelect
								v-else
								v-model="budgetId"
								endpoint="/budgeting/budgets"
								:params="{ status: 'Disetujui', year: new Date().getFullYear(), revision: 'none' }"
								:option-label="budgetOptionLabel"
								:initial-label="budgetLabel"
								placeholder="Pilih budget yang disetujui"
								@select="chooseBudget"
							/>
						</FormField>
						<FormField
							v-if="!revision"
							label="Departemen"
							:error="errors.department_id"
							required
							:help="edit ? 'Departemen tidak dapat diubah setelah budget dibuat.' : undefined"
							><AsyncSelect
								v-model="departmentId"
								endpoint="/department"
								:option-label="deptLabel"
								:initial-label="departmentLabel"
								placeholder="Pilih departemen"
								:disabled="edit"
						/></FormField>
						<FormField v-else label="Departemen" help="Mengikuti budget awal dan tidak dapat diubah."
							><Input :model-value="departmentLabel || '—'" disabled
						/></FormField>
						<FormField
							label="Tahun Anggaran"
							:error="errors.year"
							:required="!edit && !revision"
							:help="edit || revision ? 'Tahun mengikuti dokumen awal dan tidak dapat diubah.' : undefined"
							><Input v-model="year" type="number" min="2000" max="2100" :disabled="edit || revision"
						/></FormField>
					</div>
					<div v-if="revision && parentDescription">
						<p class="text-s text-ink-muted">Keterangan (Budget Awal)</p>
						<p>{{ parentDescription }}</p>
					</div>
					<FormField :label="revision ? 'Alasan Revisi' : 'Deskripsi'" :error="errors.description" required
						><Textarea
							v-model="description"
							:placeholder="
								revision ? 'Contoh: perubahan rencana operasional bulan berjalan…' : 'Contoh: Rencana operasional departemen tahun berjalan…'
							"
							:rows="2"
					/></FormField>
				</section>
				<section class="space-y-3">
					<div class="flex flex-wrap items-center gap-x-1 gap-y-2">
						<h3 class="subhead">Rincian {{ revision ? 'Revisi' : 'Budget' }}</h3>
						<HelpTip :title="`Cara mengisi rincian ${revision ? 'revisi' : 'budget'}`" :text="rincianHelp" />
						<div v-if="!revision" class="ml-auto flex flex-wrap gap-2">
							<Button variant="outline" size="sm" :loading="excelBusy" @click="template"
								><IconDownload v-if="!excelBusy" class="h-4 w-4" /> Unduh Template Excel</Button
							><Button variant="outline" size="sm" @click="importOpen = true"><IconUpload class="h-4 w-4" /> Import dari Excel</Button>
						</div>
					</div>
					<BudgetMatrix
						:lines="lines"
						:initial-lines="initialLines"
						:accounts="accounts"
						:revision="revision"
						:start="start"
						:year="year"
						:ytd="ytd"
						:all-ytd="allYtd"
						@update:all-ytd="allYtd = $event"
					/>
				</section>
				<div class="flex flex-wrap justify-end gap-2">
					<Button variant="secondary" @click="leave"><IconX class="h-4 w-4" /> Batal</Button
					><Button type="submit" variant="outline" :loading="saving"
						><IconDeviceFloppy v-if="!saving" class="h-4 w-4" /> {{ revision ? 'Simpan Draf Revisi' : 'Simpan sebagai Draft' }}</Button
					><Button :loading="saving" @click="saveAndSubmit"><IconSend v-if="!saving" class="h-4 w-4" /> Simpan &amp; Ajukan</Button>
				</div>
			</form>
		</Panel>
		<BudgetImportModal
			v-if="!revision"
			:open="importOpen"
			:year="Number(year)"
			:existing="lines.length"
			@close="importOpen = false"
			@apply="applyImport"
		/>
	</div>
</template>
