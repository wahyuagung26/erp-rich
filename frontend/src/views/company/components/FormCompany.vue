<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import Select from '@/components/base/Select.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import Button from '@/components/base/Button.vue'
import { useToast } from '@/composables/useToast'
import type { CompanyType } from '@/utils/types'
import { validateCompany, COMPANY_TYPES, type CompanyForm } from '@/views/company/schema'

const props = defineProps<{ initial?: Partial<CompanyForm>; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [CompanyForm] }>()

const router = useRouter()
const toast = useToast()

const form = reactive<CompanyForm>({
	code: props.initial?.code ?? '',
	short_name: props.initial?.short_name ?? '',
	legal_name: props.initial?.legal_name ?? '',
	npwp: props.initial?.npwp ?? '',
	logo_url: props.initial?.logo_url ?? '',
	address: props.initial?.address ?? '',
	company_type: props.initial?.company_type ?? 'pt',
	hr_enabled: props.initial?.hr_enabled ?? false,
	report_header_color: props.initial?.report_header_color ?? '#B0F2B1'
})

const errors = ref<Record<string, string>>({})

const MAX_LOGO = 2 * 1024 * 1024

// ponytail: no FileUpload base component exists; raw input + FileReader to a data
// URL is the whole feature. Swap logo_url for a real upload endpoint when the backend lands.
function onLogoPick(e: Event) {
	const file = (e.target as HTMLInputElement).files?.[0]
	if (!file) return
	if (file.size > MAX_LOGO) {
		toast.error('Ukuran logo maksimal 2 MB')
		;(e.target as HTMLInputElement).value = ''
		return
	}
	const reader = new FileReader()
	reader.onload = () => (form.logo_url = String(reader.result))
	reader.readAsDataURL(file)
}

function onSubmit() {
	const found = validateCompany(form)
	errors.value = found ?? {}
	if (!found) emit('submit', { ...form })
}

// server-side errors (e.g. duplicate code) — parent calls this on a 422
function setServerErrors(serverErrors: Record<string, string[]>) {
	errors.value = { ...errors.value, ...Object.fromEntries(Object.entries(serverErrors).map(([k, msgs]) => [k, msgs[0]])) }
}
defineExpose({ setServerErrors })
</script>

<template>
	<!-- Left edge aligns with the breadcrumb / page title / list panel. -->
	<Panel class="max-w-5xl">
		<form class="space-y-8" @submit.prevent="onSubmit">
			<section class="space-y-3">
				<h3 class="subhead">Informasi Perusahaan</h3>
				<div class="grid grid-cols-2 gap-x-5 gap-y-4">
					<FormField label="Kode Perusahaan" required :error="errors.code" hint="Handle singkat, mis. RIN. Harus unik.">
						<Input v-model="form.code" mono placeholder="RIN" />
					</FormField>
					<FormField label="Nama Pendek" required :error="errors.short_name">
						<Input v-model="form.short_name" placeholder="mis. PT RIN" />
					</FormField>
					<FormField label="Nama Legal / PT" :error="errors.legal_name">
						<Input v-model="form.legal_name" placeholder="mis. PT Rahadhyan Integrasi Nusantara" />
					</FormField>
					<FormField label="NPWP" :error="errors.npwp">
						<Input v-model="form.npwp" mono placeholder="00.000.000.0-000.000" />
					</FormField>
					<FormField
						class="col-span-2"
						label="Logo Perusahaan"
						:error="errors.logo_url"
						hint="JPG, PNG, GIF, atau WEBP. Maksimal 2 MB. Kosongkan untuk mempertahankan logo saat ini."
					>
						<div class="flex items-center gap-3">
							<img v-if="form.logo_url" :src="form.logo_url" alt="Logo perusahaan" class="h-14 w-14 rounded-md object-contain" />
							<div v-else class="grid h-14 w-14 place-items-center rounded-md bg-fill text-xs text-ink-subtle">Logo</div>
							<input
								type="file"
								accept="image/png,image/jpeg,image/gif,image/webp"
								class="text-s text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-fill file:px-3 file:py-1.5 file:text-s file:text-ink"
								@change="onLogoPick"
							/>
							<button v-if="form.logo_url" type="button" class="text-s text-danger hover:underline" @click="form.logo_url = ''">Hapus</button>
						</div>
					</FormField>
					<FormField class="col-span-2" label="Alamat" :error="errors.address">
						<Textarea v-model="form.address" :rows="3" placeholder="Alamat lengkap perusahaan" />
					</FormField>
				</div>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Pengaturan</h3>
				<div class="grid grid-cols-2 gap-x-5 gap-y-4">
					<FormField class="col-span-2" label="Tipe Perusahaan" required :error="errors.company_type">
						<Select
							:model-value="form.company_type"
							:options="COMPANY_TYPES.map((o) => ({ label: o.label, value: o.value }))"
							class="max-w-xs"
							@update:model-value="(v) => (form.company_type = v as CompanyType)"
						/>
					</FormField>
					<FormField class="col-span-2" label="Pendataan Karyawan?">
						<Checkbox v-model="form.hr_enabled" label="Ya, aktifkan untuk modul HR" />
					</FormField>
					<FormField
						class="col-span-2"
						label="Warna Header Laporan"
						required
						:error="errors.report_header_color"
						hint="Warna latar header pada semua Laporan (preview & Excel) untuk perusahaan ini."
					>
						<div class="flex items-center gap-3">
							<input type="color" v-model="form.report_header_color" class="h-9 w-12 cursor-pointer rounded-md bg-fill" />
							<Input v-model="form.report_header_color" mono class="max-w-[140px]" placeholder="#B0F2B1" />
						</div>
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/company')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
