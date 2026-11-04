<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import RadioGroup from '@/components/base/RadioGroup.vue'
import Button from '@/components/base/Button.vue'
import { validateSubAccount, type SubAccountForm } from '@/views/sub-account/schema'
import type { SubAccount } from '@/utils/types'

const props = defineProps<{
	initial?: Partial<SubAccount>
	isEdit?: boolean
	submitLabel?: string
	loading?: boolean
}>()
const emit = defineEmits<{ submit: [SubAccountForm] }>()

const router = useRouter()

const form = reactive<SubAccountForm>({
	account_group_id: props.initial?.account_group_id ?? 0,
	code_suffix: props.initial?.code?.slice(-3) ?? '',
	name: props.initial?.name ?? '',
	normal_balance: props.initial?.normal_balance ?? 'debit'
})

// Already-denormalized on the entity — no resolve-by-id fetch needed on edit.
const initialGroupLabel = props.initial?.account_group_code ? `${props.initial.account_group_code} — ${props.initial.account_group_name}` : undefined
const groupLabel = (item: Record<string, unknown>) => `${item.code} — ${item.name}`

// first 2 digits of the code — derived from the selected group, not user-entered
const groupCode = ref(props.initial?.account_group_code ?? '')
const prefix = computed(() => groupCode.value.padStart(2, '0'))

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateSubAccount(form)
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
				<h3 class="subhead">Informasi Sub Akun</h3>
				<div class="space-y-4">
					<FormField
						label="Group Perkiraan"
						required
						:error="errors.account_group_id"
						:hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : undefined"
					>
						<AsyncSelect
							:model-value="form.account_group_id || null"
							endpoint="/account-group"
							:option-label="groupLabel"
							:initial-label="initialGroupLabel"
							placeholder="Cari group perkiraan…"
							:disabled="isEdit"
							@select="(item) => (groupCode = (item?.code as string) ?? '')"
							@update:model-value="(v) => (form.account_group_id = Number(v))"
						/>
					</FormField>
					<div class="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
						<FormField
							label="Kode Sub Akun"
							required
							:error="errors.code_suffix"
							:hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : '2 digit pertama otomatis dari kode group perkiraan — isi 3 digit sisanya.'"
						>
							<Input v-if="isEdit" :model-value="initial?.code ?? ''" mono disabled />
							<div v-else class="flex items-stretch gap-1">
								<Input :model-value="prefix" mono disabled align="right" class="w-16" />
								<Input v-model="form.code_suffix" mono inputmode="numeric" maxlength="3" placeholder="001" />
							</div>
						</FormField>
						<FormField label="Nama Sub Akun" required :error="errors.name">
							<Input v-model="form.name" placeholder="mis. Kas Kecil" />
						</FormField>
					</div>
					<FormField label="Saldo Normal" required :error="errors.normal_balance">
						<RadioGroup
							v-model="form.normal_balance"
							inline
							:options="[
								{ label: 'Debit', value: 'debit' },
								{ label: 'Kredit', value: 'credit' }
							]"
						/>
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/sub-account')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
