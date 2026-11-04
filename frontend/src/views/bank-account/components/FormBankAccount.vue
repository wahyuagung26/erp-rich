<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Button from '@/components/base/Button.vue'
import { validateBankAccount, type BankAccountForm } from '@/views/bank-account/schema'
import type { BankAccount } from '@/utils/types'

const props = defineProps<{ initial?: Partial<BankAccount>; isEdit?: boolean; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [BankAccountForm] }>()

const router = useRouter()

const form = reactive<BankAccountForm>({
	bank_code: props.initial?.bank_code ?? '',
	bank_name: props.initial?.bank_name ?? '',
	account_number: props.initial?.account_number ?? '',
	account_holder: props.initial?.account_holder ?? '',
	account_id: props.initial?.account_id ?? 0,
	notes: props.initial?.notes ?? ''
})

// Already-denormalized on the entity (see docs/bank-account/) — no resolve-by-id fetch needed on edit.
const initialAccountLabel = props.initial?.account_code ? `${props.initial.account_code} — ${props.initial.account_name}` : undefined
const accountLabel = (item: Record<string, unknown>) => `${item.code} — ${item.name}`

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateBankAccount(form)
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
	<Panel>
		<form class="space-y-8" @submit.prevent="onSubmit">
			<section class="space-y-3">
				<h3 class="subhead">Detail Rekening Bank</h3>
				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
						<FormField label="Kode Bank" required :error="errors.bank_code">
							<Input v-model="form.bank_code" mono maxlength="12" placeholder="mis. CIMB" />
						</FormField>
						<FormField label="Nama Bank" required :error="errors.bank_name">
							<Input v-model="form.bank_name" maxlength="50" placeholder="mis. Bank CIMB Niaga - 3200 (IDR)" />
						</FormField>
						<FormField label="Rekening" required :error="errors.account_number">
							<Input v-model="form.account_number" mono maxlength="50" placeholder="Nomor rekening" />
						</FormField>
						<FormField label="Atas Nama" :error="errors.account_holder">
							<Input v-model="form.account_holder" maxlength="100" placeholder="mis. PT Cakrawala Edukasi Aurora" />
						</FormField>
					</div>
					<FormField label="Akun Perkiraan" required :error="errors.account_id">
						<AsyncSelect
							:model-value="form.account_id || null"
							endpoint="/account"
							:params="{ type: 'cash_bank' }"
							:option-label="accountLabel"
							:initial-label="initialAccountLabel"
							placeholder="Cari akun perkiraan…"
							@update:model-value="(v) => (form.account_id = Number(v))"
						/>
					</FormField>
					<FormField label="Keterangan" required :error="errors.notes">
						<Input v-model="form.notes" maxlength="100" placeholder="mis. Rekening operasional" />
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/bank-account')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
