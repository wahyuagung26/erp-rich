<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Button from '@/components/base/Button.vue'
import { validateSalesType, type SalesTypeForm } from '@/views/sales-type/schema'
import type { SalesType } from '@/utils/types'

const props = defineProps<{ initial?: Partial<SalesType>; isEdit?: boolean; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [SalesTypeForm] }>()

const router = useRouter()

const form = reactive<SalesTypeForm>({
	code: props.initial?.code ?? '',
	name: props.initial?.name ?? '',
	revenue_account_id: props.initial?.revenue_account_id ?? 0,
	discount_account_id: props.initial?.discount_account_id ?? 0,
	cogs_account_id: props.initial?.cogs_account_id ?? 0,
	inventory_account_id: props.initial?.inventory_account_id ?? 0,
	expense_account_id: props.initial?.expense_account_id ?? 0
})

// Already-denormalized on the entity — no resolve-by-id fetch needed on edit.
const accountLabel = (item: Record<string, unknown>) => `${item.code} — ${item.name}`
const initialLabel = (kind: 'revenue' | 'discount' | 'cogs' | 'inventory' | 'expense') => {
	const code = props.initial?.[`${kind}_account_code`]
	return code ? `${code} — ${props.initial?.[`${kind}_account_name`]}` : undefined
}

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateSalesType(form)
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
				<h3 class="subhead">Informasi Jenis Penjualan</h3>
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-x-5 gap-y-4">
						<FormField label="Kode Jenis" required :error="errors.code" :hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : 'Harus unik.'">
							<Input v-model="form.code" mono :disabled="isEdit" placeholder="mis. RC0007" />
						</FormField>
						<FormField label="Jenis" required :error="errors.name">
							<Input v-model="form.name" placeholder="mis. Bahan Baku" />
						</FormField>
					</div>
					<div class="grid grid-cols-2 gap-x-5 gap-y-4">
						<FormField label="Akun Pendapatan" required :error="errors.revenue_account_id">
							<AsyncSelect
								:model-value="form.revenue_account_id || null"
								endpoint="/account"
								:option-label="accountLabel"
								:initial-label="initialLabel('revenue')"
								placeholder="Cari akun pendapatan…"
								@update:model-value="(v) => (form.revenue_account_id = Number(v))"
							/>
						</FormField>
						<FormField label="Akun Diskon" required :error="errors.discount_account_id">
							<AsyncSelect
								:model-value="form.discount_account_id || null"
								endpoint="/account"
								:option-label="accountLabel"
								:initial-label="initialLabel('discount')"
								placeholder="Cari akun diskon…"
								@update:model-value="(v) => (form.discount_account_id = Number(v))"
							/>
						</FormField>
					</div>
					<div class="grid grid-cols-2 gap-x-5 gap-y-4">
						<FormField label="Akun HPP" required :error="errors.cogs_account_id">
							<AsyncSelect
								:model-value="form.cogs_account_id || null"
								endpoint="/account"
								:option-label="accountLabel"
								:initial-label="initialLabel('cogs')"
								placeholder="Cari akun HPP…"
								@update:model-value="(v) => (form.cogs_account_id = Number(v))"
							/>
						</FormField>
						<FormField label="Akun Persediaan" required :error="errors.inventory_account_id">
							<AsyncSelect
								:model-value="form.inventory_account_id || null"
								endpoint="/account"
								:option-label="accountLabel"
								:initial-label="initialLabel('inventory')"
								placeholder="Cari akun persediaan…"
								@update:model-value="(v) => (form.inventory_account_id = Number(v))"
							/>
						</FormField>
					</div>
					<FormField label="Akun Biaya" required :error="errors.expense_account_id">
						<AsyncSelect
							:model-value="form.expense_account_id || null"
							endpoint="/account"
							:option-label="accountLabel"
							:initial-label="initialLabel('expense')"
							placeholder="Cari akun biaya…"
							@update:model-value="(v) => (form.expense_account_id = Number(v))"
						/>
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/sales-type')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
