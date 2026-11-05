<script setup lang="ts">
// Shared faktur pajak modal (Legacy `faktur_pajak/modal`): Detail mode (summary + attachment preview + "Edit Faktur")
// when a faktur exists, Edit mode (nomor, tanggal, optional file) when it does not. Mounted once in DefaultLayout and
// driven by the fakturPajak store; it only needs an endpoint that follows the contract in docs/purchase-invoice/index.md.
import { computed, ref, watch } from 'vue'
import axios from 'axios'
import * as v from 'valibot'
import { storeToRefs } from 'pinia'
import { IconDeviceFloppy, IconPaperclip, IconPencil } from '@tabler/icons-vue'
import api from '@/utils/api'
import { date } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import { useFakturPajakStore } from '@/stores/fakturPajak'
import Modal from '@/components/base/Modal.vue'
import Button from '@/components/base/Button.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import AttachmentInput from '@/components/base/AttachmentInput.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import type { JournalAttachment } from '@/utils/types'

interface TaxInvoice {
	number: string
	date: string
	file: JournalAttachment | null
}

const schema = v.object({
	number: v.pipe(v.string(), v.trim(), v.nonEmpty('Nomor faktur pajak wajib diisi'), v.maxLength(25, 'Nomor faktur pajak maksimal 25 karakter')),
	date: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal faktur pajak wajib diisi'))
})

const store = useFakturPajakStore()
const { open, request } = storeToRefs(store)
const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const mode = ref<'view' | 'edit'>('edit')
const current = ref<TaxInvoice | null>(null)
const form = ref({ number: '', date: '' })
const files = ref<JournalAttachment[]>([])
const errors = ref<Record<string, string>>({})

// What the preview shows: the saved file in Detail mode, the freshly picked one while editing.
const previewFile = computed(() => (mode.value === 'view' ? current.value?.file : files.value[0]) ?? null)

// Always read the latest faktur when opening, never the (possibly stale) list row.
watch(open, async (isOpen) => {
	if (!isOpen || !request.value) return
	loading.value = true
	errors.value = {}
	current.value = null
	form.value = { number: '', date: '' }
	files.value = []
	mode.value = 'edit'
	try {
		const res = await api.get<{ data: TaxInvoice | null }>(request.value.endpoint)
		current.value = res.data.data
		if (current.value) {
			form.value = { number: current.value.number, date: current.value.date }
			files.value = current.value.file ? [current.value.file] : []
			mode.value = 'view'
		}
	} catch (error) {
		toast.error(axios.isAxiosError(error) ? (error.response?.data?.message ?? 'Faktur pajak tidak dapat dimuat') : 'Faktur pajak tidak dapat dimuat')
		store.close()
	} finally {
		loading.value = false
	}
})

async function save() {
	if (!request.value || saving.value) return
	const result = v.safeParse(schema, form.value)
	if (!result.success) {
		const nested = v.flatten(result.issues).nested ?? {}
		errors.value = Object.fromEntries(Object.entries(nested).map(([key, messages]) => [key, (messages as string[])[0]]))
		return
	}
	errors.value = {}
	saving.value = true
	try {
		await api.put(request.value.endpoint, { number: result.output.number, date: result.output.date, file: files.value[0] ?? null })
		toast.success('Faktur pajak disimpan')
		const onSaved = request.value.onSaved
		store.close()
		await onSaved?.()
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const serverErrors = error.response?.data?.errors as Record<string, string[]> | undefined
			if (error.response?.status === 422 && serverErrors) {
				errors.value = Object.fromEntries(Object.entries(serverErrors).map(([key, messages]) => [key, messages[0]]))
				return
			}
			toast.error(error.response?.data?.message ?? 'Faktur pajak tidak dapat disimpan')
			return
		}
		throw error
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<Modal :open="open" title="Faktur Pajak" @close="store.close()">
		<p v-if="request?.kode" class="-mt-1 mb-3 text-s text-ink-muted">{{ request.kode }}</p>
		<Skeleton v-if="loading" :lines="4" />
		<template v-else>
			<dl v-if="mode === 'view' && current" class="space-y-4">
				<div>
					<dt class="text-s text-ink-muted">Nomor Faktur Pajak</dt>
					<dd class="mt-1 text-m font-semibold text-ink">{{ current.number }}</dd>
				</div>
				<div>
					<dt class="text-s text-ink-muted">Tanggal Faktur Pajak</dt>
					<dd class="mt-1 text-m text-ink">{{ date(current.date) }}</dd>
				</div>
				<div>
					<dt class="text-s text-ink-muted">File Faktur Pajak</dt>
					<dd class="mt-1 text-m">
						<a
							v-if="current.file"
							:href="current.file.data_url"
							:download="current.file.name"
							class="inline-flex items-center gap-1 text-primary-dark hover:underline"
						>
							<IconPaperclip class="h-4 w-4 shrink-0" /> <span class="truncate">{{ current.file.name }}</span>
						</a>
						<span v-else class="text-ink-muted">–</span>
					</dd>
				</div>
			</dl>

			<div v-else class="space-y-4">
				<FormField label="Nomor Faktur Pajak" required :error="errors.number">
					<Input v-model="form.number" maxlength="25" placeholder="010.000-26.00000001" />
				</FormField>
				<FormField label="Tanggal Faktur Pajak" required :error="errors.date">
					<DatePicker v-model="form.date" />
				</FormField>
				<FormField label="File Faktur Pajak" :error="errors.file" hint="PDF, JPG, atau PNG, maksimal 5 MB.">
					<AttachmentInput v-model="files" :max-files="1" />
				</FormField>
			</div>

			<div v-if="previewFile" class="mt-4 space-y-1">
				<p class="text-s text-ink-muted">Preview Faktur Pajak</p>
				<object v-if="previewFile.type === 'application/pdf'" :data="previewFile.data_url" type="application/pdf" class="h-[360px] w-full rounded-md">
					<p class="text-s text-ink-muted">Browser tidak mendukung preview PDF.</p>
				</object>
				<img v-else :src="previewFile.data_url" :alt="previewFile.name" class="mx-auto max-h-[360px] max-w-full rounded-md object-contain" />
			</div>
		</template>

		<template #footer>
			<Button variant="secondary" size="sm" @click="store.close()">Tutup</Button>
			<Button v-if="!loading && mode === 'view'" size="sm" @click="mode = 'edit'"><IconPencil class="h-4 w-4" /> Edit Faktur</Button>
			<Button v-else-if="!loading" size="sm" :loading="saving" @click="save"><IconDeviceFloppy v-if="!saving" class="h-4 w-4" /> Simpan</Button>
		</template>
	</Modal>
</template>
