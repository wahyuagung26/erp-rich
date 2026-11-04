<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Textarea from '@/components/base/Textarea.vue'
import Button from '@/components/base/Button.vue'
import { validateSalesExpense, type SalesExpenseForm } from '@/views/sales-expense/schema'
import type { SalesExpense } from '@/utils/types'

const props = defineProps<{ initial?: Partial<SalesExpense>; isEdit?: boolean; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [SalesExpenseForm] }>()

const router = useRouter()

const form = reactive<SalesExpenseForm>({
	code: props.initial?.code ?? '',
	name: props.initial?.name ?? '',
	account_id: props.initial?.account_id ?? 0,
	notes: props.initial?.notes ?? ''
})

// Already-denormalized on the entity (see docs/sales-expense/) — no resolve-by-id fetch needed on edit.
const initialAccountLabel = props.initial?.account_code ? `${props.initial.account_code} — ${props.initial.account_name}` : undefined
const accountLabel = (item: Record<string, unknown>) => `${item.code} — ${item.name}`

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateSalesExpense(form)
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
				<h3 class="subhead">Detail Biaya</h3>
				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
						<FormField label="Kode" required :error="errors.code" :hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : 'Harus unik.'">
							<Input v-model="form.code" mono :disabled="isEdit" placeholder="mis. BP01" />
						</FormField>
						<FormField label="Nama Biaya" required :error="errors.name">
							<Input v-model="form.name" placeholder="mis. Biaya Pengiriman" />
						</FormField>
					</div>
					<FormField label="Akun Biaya" required :error="errors.account_id">
						<AsyncSelect
							:model-value="form.account_id || null"
							endpoint="/account"
							:option-label="accountLabel"
							:initial-label="initialAccountLabel"
							placeholder="Cari akun biaya…"
							@update:model-value="(v) => (form.account_id = Number(v))"
						/>
					</FormField>
					<FormField label="Catatan" :error="errors.notes">
						<Textarea v-model="form.notes" :rows="2" placeholder="Catatan (opsional)" />
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/sales-expense')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
