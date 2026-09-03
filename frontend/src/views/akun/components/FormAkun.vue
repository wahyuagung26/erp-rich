<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import RadioGroup from '@/components/base/RadioGroup.vue'
import Switch from '@/components/base/Switch.vue'
import Button from '@/components/base/Button.vue'
import { AKUN_TYPES, validateAkun, type AkunForm } from '@/views/akun/schema'

const props = defineProps<{ initial?: Partial<AkunForm>; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [AkunForm] }>()

const router = useRouter()

const form = reactive<AkunForm>({
	code: props.initial?.code ?? '',
	name: props.initial?.name ?? '',
	type: props.initial?.type ?? 'asset',
	normal_balance: props.initial?.normal_balance ?? 'debit',
	active: props.initial?.active ?? true
})

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateAkun(form)
	errors.value = found ?? {}
	if (!found) emit('submit', { ...form })
}
</script>

<template>
	<Panel class="max-w-xl">
		<form class="space-y-8" @submit.prevent="onSubmit">
			<section class="space-y-3">
				<h3 class="subhead">Identitas Akun</h3>
				<div class="grid grid-cols-2 gap-x-4 gap-y-4">
					<FormField label="Kode Akun" required :error="errors.code">
						<Input v-model="form.code" mono placeholder="1-1000" />
					</FormField>
					<FormField label="Tipe" required :error="errors.type">
						<Select v-model="form.type" :options="[...AKUN_TYPES]" />
					</FormField>
					<FormField class="col-span-2" label="Nama Akun" required :error="errors.name">
						<Input v-model="form.name" placeholder="mis. Kas Kecil" />
					</FormField>
				</div>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Perilaku</h3>
				<div class="space-y-4">
					<FormField label="Saldo Normal" :error="errors.normal_balance">
						<RadioGroup
							v-model="form.normal_balance"
							inline
							:options="[
								{ label: 'Debit', value: 'debit' },
								{ label: 'Kredit', value: 'credit' }
							]"
						/>
					</FormField>
					<FormField label="Status">
						<Switch v-model="form.active" :label="form.active ? 'Aktif' : 'Nonaktif'" />
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading">{{ submitLabel ?? 'Simpan' }}</Button>
				<Button variant="secondary" type="button" @click="router.push('/akun')">Batal</Button>
			</div>
		</form>
	</Panel>
</template>
