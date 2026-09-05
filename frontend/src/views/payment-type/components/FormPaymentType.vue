<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import RadioGroup from '@/components/base/RadioGroup.vue'
import Button from '@/components/base/Button.vue'
import { TRANSACTION_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS, validatePaymentType, type PaymentTypeForm } from '@/views/payment-type/schema'
import type { ApiList, Account } from '@/utils/types'

const props = defineProps<{ initial?: Partial<PaymentTypeForm>; isEdit?: boolean; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [PaymentTypeForm] }>()

const router = useRouter()

const form = reactive<PaymentTypeForm>({
	code: props.initial?.code ?? '',
	name: props.initial?.name ?? '',
	account_id: props.initial?.account_id ?? 0,
	transaction_type: props.initial?.transaction_type ?? 'sale',
	method: props.initial?.method ?? 'cash'
})

const accountOptions = ref<{ label: string; value: number }[]>([])
onMounted(async () => {
	const res = await api.get<ApiList<Account>>('/account', { params: { per_page: 100 } })
	accountOptions.value = res.data.data.map((a) => ({ label: `${a.code} — ${a.name}`, value: a.id }))
})

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validatePaymentType(form)
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
				<h3 class="subhead">Informasi Tipe Pembayaran</h3>
				<div class="space-y-4">
					<FormField label="Kode" required :error="errors.code" :hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : 'Harus unik.'">
						<Input v-model="form.code" mono :disabled="isEdit" class="max-w-[200px]" placeholder="mis. TP01" />
					</FormField>
					<FormField label="Nama" required :error="errors.name">
						<Input v-model="form.name" placeholder="mis. Tunai" />
					</FormField>
					<FormField label="Akun Perkiraan" required :error="errors.account_id">
						<Select
							:model-value="form.account_id || ''"
							placeholder="Pilih akun perkiraan"
							:options="accountOptions"
							@update:model-value="(v) => (form.account_id = Number(v))"
						/>
					</FormField>
					<FormField label="Transaksi" required :error="errors.transaction_type">
						<RadioGroup v-model="form.transaction_type" inline :options="[...TRANSACTION_TYPE_OPTIONS]" />
					</FormField>
					<FormField label="Jenis" required :error="errors.method">
						<RadioGroup v-model="form.method" inline :options="[...PAYMENT_METHOD_OPTIONS]" />
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/payment-type')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
