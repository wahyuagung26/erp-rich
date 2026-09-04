<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import RadioGroup from '@/components/base/RadioGroup.vue'
import Button from '@/components/base/Button.vue'
import { GROUP_AKUN_CATEGORIES, validateGroupAkun, type GroupAkunForm } from '@/views/group-akun/schema'

const props = defineProps<{ initial?: Partial<GroupAkunForm>; isEdit?: boolean; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [GroupAkunForm] }>()

const router = useRouter()

const form = reactive<GroupAkunForm>({
	code: props.initial?.code ?? '',
	name: props.initial?.name ?? '',
	category: props.initial?.category ?? 'neraca',
	normal_balance: props.initial?.normal_balance ?? 'debit'
})

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateGroupAkun(form)
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
				<h3 class="subhead">Informasi Group Akun</h3>
				<div class="space-y-4">
					<FormField
						label="Kode Group Akun"
						required
						:error="errors.code"
						:hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : 'Angka, maksimal 2 digit. Harus unik.'"
					>
						<Input v-model="form.code" mono inputmode="numeric" maxlength="2" :disabled="isEdit" class="max-w-[200px]" placeholder="mis. 10" />
					</FormField>
					<FormField label="Nama Group Akun" required :error="errors.name">
						<Input v-model="form.name" placeholder="mis. Aset" />
					</FormField>
					<FormField label="Neraca / Laba Rugi" required :error="errors.category">
						<RadioGroup v-model="form.category" inline :options="[...GROUP_AKUN_CATEGORIES]" />
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
				<Button variant="secondary" type="button" @click="router.push('/group-akun')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
