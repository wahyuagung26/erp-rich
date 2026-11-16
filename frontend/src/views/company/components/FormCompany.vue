<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import Select from '@/components/base/Select.vue'
import Switch from '@/components/base/Switch.vue'
import ImageDrop from '@/components/base/ImageDrop.vue'
import ColorField from '@/views/company/components/ColorField.vue'
import Button from '@/components/base/Button.vue'
import { DEFAULT_BRAND, effectiveBrandHex } from '@/utils/brand'
import { formatNpwp } from '@/utils/format'
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
	disable_minus_stock_check: props.initial?.disable_minus_stock_check ?? false,
	brand_color: props.initial?.brand_color ?? DEFAULT_BRAND,
	report_header_color: props.initial?.report_header_color ?? '#B0F2B1'
})

const errors = ref<Record<string, string>>({})

const MAX_LOGO = 2 * 1024 * 1024
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

// ponytail: the logo is kept as a data URL; swap logo_url for a real upload endpoint when the backend lands.
function onLogoPick(file: File) {
	if (!LOGO_TYPES.includes(file.type)) return toast.error('Logo harus JPG, PNG, GIF, atau WEBP')
	if (file.size > MAX_LOGO) return toast.error('Ukuran logo maksimal 2 MB')
	const reader = new FileReader()
	reader.onload = () => (form.logo_url = String(reader.result))
	reader.readAsDataURL(file)
}

// One-click colours (brand: strong tones that keep white text readable; report header: light backgrounds).
const BRAND_SWATCHES = [DEFAULT_BRAND, '#1D4ED8', '#4F46E5', '#7E22CE', '#BE123C', '#C2410C', '#B45309', '#334155']
const REPORT_SWATCHES = ['#B0F2B1', '#BFDBFE', '#DDD6FE', '#FBCFE8', '#FED7AA', '#FDE68A', '#A7F3D0', '#E2E8F0']
const brandPreview = computed(() => effectiveBrandHex(form.brand_color))
const validHex = (v: string) => (/^#[0-9a-fA-F]{6}$/.test(v) ? v : '#E2E8F0')

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
	<Panel>
		<form class="space-y-8" @submit.prevent="onSubmit">
			<section class="space-y-3">
				<h3 class="subhead">Informasi Perusahaan</h3>
				<div class="flex flex-col gap-5 sm:flex-row sm:items-start">
					<FormField
						label="Logo"
						:error="errors.logo_url"
						:hint="['JPG, PNG, GIF, atau WEBP.', 'Maksimal 2 MB.', 'Kosongkan untuk mempertahankan logo saat ini.']"
					>
						<ImageDrop
							:src="form.logo_url || undefined"
							alt="Logo perusahaan"
							label="Unggah logo"
							:size="140"
							accept="image/png,image/jpeg,image/gif,image/webp"
							@pick="onLogoPick"
							@remove="form.logo_url = ''"
						/>
					</FormField>
					<div class="grid min-w-0 flex-1 grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-[220px_1fr_288px]">
						<FormField label="Kode Perusahaan" required :error="errors.code" :hint="['Handle singkat, mis. RIN.', 'Harus unik.']">
							<Input v-model="form.code" mono placeholder="mis. RIN" />
						</FormField>
						<FormField class="lg:col-span-2" label="Nama Pendek" required :error="errors.short_name">
							<Input v-model="form.short_name" placeholder="mis. PT RIN" />
						</FormField>
						<FormField class="lg:col-span-2" label="Nama Legal / PT" :error="errors.legal_name">
							<Input v-model="form.legal_name" placeholder="mis. PT Rahadhyan Integrasi Nusantara" />
						</FormField>
						<FormField label="NPWP" :error="errors.npwp">
							<Input
								:model-value="form.npwp"
								mono
								inputmode="numeric"
								placeholder="00.000.000.0-000.000"
								@update:model-value="(v) => (form.npwp = formatNpwp(v))"
							/>
						</FormField>
					</div>
				</div>
				<FormField label="Alamat" :error="errors.address">
					<Textarea v-model="form.address" :rows="3" placeholder="Alamat lengkap perusahaan" />
				</FormField>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Pengaturan</h3>
				<div class="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
					<FormField label="Tipe Perusahaan" required :error="errors.company_type">
						<Select
							:model-value="form.company_type"
							:options="COMPANY_TYPES.map((o) => ({ label: o.label, value: o.value }))"
							@update:model-value="(v) => (form.company_type = v as CompanyType)"
						/>
					</FormField>
					<FormField
						label="Nonaktifkan Cek Stok Minus"
						:hint="[
							'Pengaturan sementara selama proses migrasi data stok awal berlangsung.',
							'Berlaku khusus pada modul Invoice Penjualan (Baru); modul lain tetap memvalidasi ketersediaan stok sebagaimana mestinya.'
						]"
					>
						<div class="flex h-9 items-center">
							<Switch v-model="form.disable_minus_stock_check" label="Izinkan penyimpanan Invoice Penjualan meskipun stok tidak mencukupi" />
						</div>
					</FormField>
				</div>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Tampilan</h3>
				<div class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
					<FormField
						label="Warna Brand"
						required
						:error="errors.brand_color"
						:hint="[
							'Warna utama aplikasi (tombol, tautan, status berhasil) saat perusahaan ini aktif.',
							'Warna yang terlalu terang disesuaikan otomatis agar teks tetap terbaca.'
						]"
					>
						<ColorField v-model="form.brand_color" :swatches="BRAND_SWATCHES" :placeholder="DEFAULT_BRAND">
							<template #preview>
								<span class="inline-flex h-8 items-center rounded-md px-3 text-s font-medium text-white" :style="{ backgroundColor: brandPreview }">
									Simpan
								</span>
								<span class="text-s font-medium underline" :style="{ color: brandPreview }">Tautan</span>
							</template>
						</ColorField>
					</FormField>
					<FormField
						label="Warna Header Laporan"
						required
						:error="errors.report_header_color"
						hint="Warna latar header pada semua Laporan (preview & Excel) untuk perusahaan ini."
					>
						<ColorField v-model="form.report_header_color" :swatches="REPORT_SWATCHES" placeholder="#B0F2B1">
							<template #preview>
								<div
									class="grid h-8 w-full max-w-[260px] grid-cols-[1fr_auto] items-center gap-4 rounded-md px-3 text-s font-semibold text-ink"
									:style="{ backgroundColor: validHex(form.report_header_color) }"
								>
									<span>Nama Akun</span>
									<span>Saldo</span>
								</div>
							</template>
						</ColorField>
					</FormField>
				</div>
			</section>

			<div class="flex flex-wrap justify-end gap-2 pt-2">
				<Button variant="secondary" type="button" @click="router.push('/company')"> <IconX class="h-4 w-4" /> Batal </Button>
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
			</div>
		</form>
	</Panel>
</template>
