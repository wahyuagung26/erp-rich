<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import { AKUN_TYPES, validateAkunPerkiraan, type AkunPerkiraanForm } from '@/views/akun-perkiraan/schema'
import type { ApiList, SubAkun } from '@/utils/types'

const props = defineProps<{
	initial?: Partial<AkunPerkiraanForm> & { code?: string }
	isEdit?: boolean
	submitLabel?: string
	loading?: boolean
}>()
const emit = defineEmits<{ submit: [AkunPerkiraanForm] }>()

const router = useRouter()

const form = reactive<AkunPerkiraanForm>({
	sub_akun_id: props.initial?.sub_akun_id ?? 0,
	code_suffix: props.initial?.code_suffix ?? props.initial?.code?.slice(-2) ?? '',
	name: props.initial?.name ?? '',
	type: props.initial?.type ?? 'asset'
})

const subAkunOptions = ref<{ label: string; value: number; code: string }[]>([])
onMounted(async () => {
	const res = await api.get<ApiList<SubAkun>>('/sub-akun', { params: { per_page: 100 } })
	subAkunOptions.value = res.data.data.map((s) => ({ label: `${s.code} — ${s.name}`, value: s.id, code: s.code }))
})

// first 5 digits of the code — derived from the selected sub akun, not user-entered
const prefix = computed(() => subAkunOptions.value.find((s) => s.value === form.sub_akun_id)?.code ?? '')

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateAkunPerkiraan(form)
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
					<FormField label="Sub Akun" required :error="errors.sub_akun_id" :hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : undefined">
						<Select
							:model-value="form.sub_akun_id || ''"
							placeholder="Pilih sub akun"
							:disabled="isEdit"
							:options="subAkunOptions"
							@update:model-value="(v) => (form.sub_akun_id = Number(v))"
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
				<Button variant="secondary" type="button" @click="router.push('/akun-perkiraan')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
