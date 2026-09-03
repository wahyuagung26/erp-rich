<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import Button from '@/components/base/Button.vue'
import { validateSupplier, type SupplierForm } from '@/views/supplier/schema'

const props = defineProps<{ initial?: Partial<SupplierForm>; code?: string; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [SupplierForm] }>()

const router = useRouter()

const form = reactive<SupplierForm>({
	name: props.initial?.name ?? '',
	address: props.initial?.address ?? '',
	city: props.initial?.city ?? '',
	phone: props.initial?.phone ?? '',
	fax: props.initial?.fax ?? '',
	email: props.initial?.email ?? '',
	contact_person: props.initial?.contact_person ?? '',
	npwp: props.initial?.npwp ?? '',
	pkp: props.initial?.pkp ?? false,
	bank_name: props.initial?.bank_name ?? '',
	bank_account: props.initial?.bank_account ?? '',
	top_days: props.initial?.top_days ?? 0,
	notes: props.initial?.notes ?? ''
})

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateSupplier(form)
	errors.value = found ?? {}
	if (!found) emit('submit', { ...form })
}
</script>

<template>
	<Panel>
		<form class="max-w-3xl space-y-4" @submit.prevent="onSubmit">
			<p class="subhead">Identitas Supplier</p>
			<div class="grid grid-cols-2 gap-x-4 gap-y-4">
				<FormField v-if="code" label="Kode Supplier">
					<Input :model-value="code" mono disabled />
				</FormField>
				<FormField label="Nama Supplier" :required="true" :error="errors.name" :class="code ? '' : 'col-span-2'">
					<Input v-model="form.name" placeholder="mis. PT Sumber Rejeki" />
				</FormField>
				<FormField label="Kota" :error="errors.city">
					<Input v-model="form.city" placeholder="mis. Surabaya" />
				</FormField>
			</div>
			<FormField label="Alamat" :required="true" :error="errors.address">
				<Textarea v-model="form.address" :rows="2" placeholder="Alamat lengkap supplier" />
			</FormField>

			<p class="subhead">Kontak</p>
			<div class="grid grid-cols-2 gap-x-4 gap-y-4">
				<FormField label="Telepon" :required="true" :error="errors.phone">
					<Input v-model="form.phone" mono placeholder="031-5551000" />
				</FormField>
				<FormField label="Fax" :error="errors.fax">
					<Input v-model="form.fax" mono placeholder="031-5551001" />
				</FormField>
				<FormField label="Email" :error="errors.email">
					<Input v-model="form.email" type="email" placeholder="sales@contoh.co.id" />
				</FormField>
				<FormField label="Contact Person (CP)" :error="errors.contact_person">
					<Input v-model="form.contact_person" placeholder="Nama narahubung" />
				</FormField>
			</div>

			<p class="subhead">Pajak &amp; Pembayaran</p>
			<div class="grid grid-cols-2 gap-x-4 gap-y-4">
				<FormField label="Status Pajak">
					<div class="h-9 pt-2">
						<Checkbox v-model="form.pkp" label="Pengusaha Kena Pajak (PKP)" />
					</div>
				</FormField>
				<FormField label="NPWP" :required="true" :error="errors.npwp">
					<Input v-model="form.npwp" mono placeholder="00.000.000.0-000.000" />
				</FormField>
				<FormField label="TOP (hari)" :required="true" hint="0 = tunai / COD" :error="errors.top_days">
					<Input :model-value="form.top_days" type="number" mono align="right" @update:model-value="(v) => (form.top_days = Number(v))" />
				</FormField>
			</div>

			<p class="subhead">Rekening Bank</p>
			<div class="grid grid-cols-2 gap-x-4 gap-y-4">
				<FormField label="Nama Bank" :error="errors.bank_name">
					<Input v-model="form.bank_name" placeholder="mis. BCA" />
				</FormField>
				<FormField label="No. Rekening" :error="errors.bank_account">
					<Input v-model="form.bank_account" mono placeholder="1234567890" />
				</FormField>
			</div>

			<p class="subhead">Lain-lain</p>
			<FormField label="Keterangan" :error="errors.notes">
				<Textarea v-model="form.notes" :rows="2" placeholder="Catatan internal (opsional)" />
			</FormField>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading">{{ submitLabel ?? 'Simpan' }}</Button>
				<Button variant="secondary" type="button" @click="router.push('/supplier')">Batal</Button>
			</div>
		</form>
	</Panel>
</template>
