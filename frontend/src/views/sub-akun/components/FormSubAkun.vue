<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import RadioGroup from '@/components/base/RadioGroup.vue'
import Button from '@/components/base/Button.vue'
import { validateSubAkun, type SubAkunForm } from '@/views/sub-akun/schema'
import type { ApiList, GroupAkun } from '@/utils/types'

const props = defineProps<{
	initial?: Partial<SubAkunForm> & { code?: string }
	isEdit?: boolean
	submitLabel?: string
	loading?: boolean
}>()
const emit = defineEmits<{ submit: [SubAkunForm] }>()

const router = useRouter()

const form = reactive<SubAkunForm>({
	group_akun_id: props.initial?.group_akun_id ?? 0,
	code_suffix: props.initial?.code_suffix ?? props.initial?.code?.slice(-3) ?? '',
	name: props.initial?.name ?? '',
	normal_balance: props.initial?.normal_balance ?? 'debit'
})

const groupOptions = ref<{ label: string; value: number; code: string }[]>([])
onMounted(async () => {
	const res = await api.get<ApiList<GroupAkun>>('/group-akun', { params: { per_page: 100 } })
	groupOptions.value = res.data.data.map((g) => ({ label: `${g.code} — ${g.name}`, value: g.id, code: g.code }))
})

// first 2 digits of the code — derived from the selected group, not user-entered
const prefix = computed(() => (groupOptions.value.find((g) => g.value === form.group_akun_id)?.code ?? '').padStart(2, '0'))

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateSubAkun(form)
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
					<FormField label="Group Perkiraan" required :error="errors.group_akun_id" :hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : undefined">
						<Select
							:model-value="form.group_akun_id || ''"
							placeholder="Pilih group perkiraan"
							:disabled="isEdit"
							:options="groupOptions"
							@update:model-value="(v) => (form.group_akun_id = Number(v))"
						/>
					</FormField>

					<FormField
						label="Kode Sub Akun"
						required
						:error="errors.code_suffix"
						:hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : '2 digit pertama otomatis dari kode group perkiraan — isi 3 digit sisanya.'"
					>
						<Input v-if="isEdit" :model-value="initial?.code ?? ''" mono disabled class="max-w-[200px]" />
						<div v-else class="flex max-w-[200px] items-stretch gap-1">
							<Input :model-value="prefix" mono disabled align="right" class="w-16" />
							<Input v-model="form.code_suffix" mono inputmode="numeric" maxlength="3" placeholder="001" />
						</div>
					</FormField>

					<FormField label="Nama Sub Akun" required :error="errors.name">
						<Input v-model="form.name" placeholder="mis. Kas Kecil" />
					</FormField>

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
				<Button variant="secondary" type="button" @click="router.push('/sub-akun')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
