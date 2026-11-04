<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Button from '@/components/base/Button.vue'
import { AKUN_TYPES, validateAccount, type AccountForm } from '@/views/account/schema'
import type { Account } from '@/utils/types'

const props = defineProps<{
	initial?: Partial<Account>
	isEdit?: boolean
	submitLabel?: string
	loading?: boolean
}>()
const emit = defineEmits<{ submit: [AccountForm] }>()

const router = useRouter()

const form = reactive<AccountForm>({
	sub_account_id: props.initial?.sub_account_id ?? 0,
	code_suffix: props.initial?.code?.slice(-2) ?? '',
	name: props.initial?.name ?? '',
	type: props.initial?.type ?? 'asset'
})

// Already-denormalized on the entity — no resolve-by-id fetch needed on edit.
const initialSubAccountLabel = props.initial?.sub_account_code ? `${props.initial.sub_account_code} — ${props.initial.sub_account_name}` : undefined
const subAccountLabel = (item: Record<string, unknown>) => `${item.code} — ${item.name}`

// first 5 digits of the code — derived from the selected sub account, not user-entered
const prefix = ref(props.initial?.sub_account_code ?? '')

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateAccount(form)
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
				<h3 class="subhead">Informasi Akun Perkiraan</h3>
				<div class="space-y-4">
					<FormField label="Sub Akun" required :error="errors.sub_account_id" :hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : undefined">
						<AsyncSelect
							:model-value="form.sub_account_id || null"
							endpoint="/sub-account"
							:option-label="subAccountLabel"
							:initial-label="initialSubAccountLabel"
							placeholder="Cari sub akun…"
							:disabled="isEdit"
							@select="(item) => (prefix = (item?.code as string) ?? '')"
							@update:model-value="(v) => (form.sub_account_id = Number(v))"
						/>
					</FormField>

					<FormField
						label="Kode Akun Perkiraan"
						required
						:error="errors.code_suffix"
						:hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : '5 digit pertama otomatis dari kode sub akun — isi 2 digit sisanya.'"
					>
						<Input v-if="isEdit" :model-value="initial?.code ?? ''" mono disabled class="max-w-[220px]" />
						<div v-else class="flex max-w-[220px] items-stretch gap-1">
							<Input :model-value="prefix" mono disabled align="right" class="w-24" />
							<Input v-model="form.code_suffix" mono inputmode="numeric" maxlength="2" placeholder="01" />
						</div>
					</FormField>

					<FormField label="Nama Akun Perkiraan" required :error="errors.name">
						<Input v-model="form.name" placeholder="mis. Kas Kecil" />
					</FormField>

					<FormField label="Tipe Akun" required :error="errors.type">
						<Select v-model="form.type" :options="[...AKUN_TYPES]" />
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/account')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
