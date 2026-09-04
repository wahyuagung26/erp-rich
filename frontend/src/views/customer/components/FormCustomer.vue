<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import Button from '@/components/base/Button.vue'
import { validateCustomer, type CustomerForm } from '@/views/customer/schema'

const props = defineProps<{ initial?: Partial<CustomerForm>; code?: string; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [CustomerForm] }>()

const router = useRouter()

const form = reactive<CustomerForm>({
	name: props.initial?.name ?? '',
	phone: props.initial?.phone ?? '',
	email: props.initial?.email ?? '',
	address: props.initial?.address ?? '',
	city: props.initial?.city ?? '',
	bank_name: props.initial?.bank_name ?? '',
	bank_account: props.initial?.bank_account ?? '',
	npwp: props.initial?.npwp ?? '',
	pkp: props.initial?.pkp ?? false,
	top_days: props.initial?.top_days ?? 0,
	notes: props.initial?.notes ?? ''
})

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateCustomer(form)
	errors.value = found ?? {}
	if (!found) emit('submit', { ...form })
}
</script>

<template>
	<!-- Left edge aligns with the breadcrumb / page title / list panel; fills most of the page frame. -->
	<Panel class="max-w-5xl">
		<form class="space-y-8" @submit.prevent="onSubmit">
			<!-- Sections are separated by whitespace + a light heading, not a grey bar. -->
			<section class="space-y-3">
				<h3 class="subhead">Identitas</h3>
				<div class="grid grid-cols-2 gap-x-5 gap-y-4">
					<FormField v-if="code" class="col-span-2" label="Kode Customer">
						<Input :model-value="code" mono disabled class="max-w-[180px]" />
					</FormField>
					<FormField class="col-span-2" label="Nama Customer" required :error="errors.name">
						<Input v-model="form.name" placeholder="mis. PT Samudra Edukasi Raya" />
					</FormField>
					<FormField class="col-span-2" label="Alamat" :error="errors.address">
						<Textarea v-model="form.address" :rows="2" placeholder="Alamat lengkap customer" />
					</FormField>
					<FormField class="col-span-2" label="Kota" :error="errors.city">
						<Input v-model="form.city" class="max-w-xs" placeholder="mis. Madiun" />
					</FormField>
				</div>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Kontak</h3>
				<div class="grid grid-cols-2 gap-x-5 gap-y-4">
					<FormField label="Telepon" :error="errors.phone">
						<Input v-model="form.phone" mono placeholder="0812-3456-7890" />
					</FormField>
					<FormField label="Email" :error="errors.email">
						<Input v-model="form.email" type="email" placeholder="nama@contoh.co.id" />
					</FormField>
				</div>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Pajak &amp; Pembayaran</h3>
				<div class="space-y-4">
					<Checkbox v-model="form.pkp" label="Pengusaha Kena Pajak (PKP)" />
					<!-- NPWP and TOP sit side by side, each sized to its content. -->
					<div class="flex flex-wrap gap-x-5 gap-y-4">
						<FormField class="w-72" label="NPWP" :error="errors.npwp">
							<Input v-model="form.npwp" mono placeholder="0000-0000-0000-0000" />
						</FormField>
						<FormField class="w-32" label="TOP" required :error="errors.top_days">
							<Input
								:model-value="form.top_days"
								type="number"
								mono
								align="right"
								addon="hari"
								@update:model-value="(v) => (form.top_days = Number(v))"
							/>
						</FormField>
					</div>
					<p class="text-s text-ink-subtle">TOP = jatuh tempo pembayaran piutang. 0 = tunai.</p>
				</div>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Rekening Bank</h3>
				<div class="grid grid-cols-2 gap-x-5 gap-y-4">
					<FormField label="Nama Bank" :error="errors.bank_name">
						<Input v-model="form.bank_name" placeholder="mis. BCA" />
					</FormField>
					<FormField label="No. Rekening" :error="errors.bank_account">
						<Input v-model="form.bank_account" mono placeholder="1234567890" />
					</FormField>
				</div>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Catatan</h3>
				<FormField label="Keterangan" :error="errors.notes">
					<Textarea v-model="form.notes" :rows="2" placeholder="Catatan internal (opsional)" />
				</FormField>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/customer')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
