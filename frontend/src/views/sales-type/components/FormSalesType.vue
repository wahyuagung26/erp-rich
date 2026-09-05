<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import { validateSalesType, type SalesTypeForm } from '@/views/sales-type/schema'
import type { ApiList, Account } from '@/utils/types'

const props = defineProps<{ initial?: Partial<SalesTypeForm>; isEdit?: boolean; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [SalesTypeForm] }>()

const router = useRouter()

const form = reactive<SalesTypeForm>({
	code: props.initial?.code ?? '',
	name: props.initial?.name ?? '',
	revenue_account_id: props.initial?.revenue_account_id ?? 0,
	cogs_account_id: props.initial?.cogs_account_id ?? 0,
	inventory_account_id: props.initial?.inventory_account_id ?? 0,
	expense_account_id: props.initial?.expense_account_id ?? 0
})

// shared by all account pickers below — one fetch, reused
const accountOptions = ref<{ label: string; value: number }[]>([])
onMounted(async () => {
	const res = await api.get<ApiList<Account>>('/account', { params: { per_page: 100 } })
	accountOptions.value = res.data.data.map((a) => ({ label: `${a.code} — ${a.name}`, value: a.id }))
})

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
					<FormField label="Kode Jenis" required :error="errors.code" :hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : 'Harus unik.'">
						<Input v-model="form.code" mono :disabled="isEdit" class="max-w-[200px]" placeholder="mis. RC0007" />
					</FormField>
					<FormField label="Jenis" required :error="errors.name">
						<Input v-model="form.name" placeholder="mis. Bahan Baku" />
					</FormField>
					<FormField label="Akun Pendapatan" required :error="errors.revenue_account_id">
						<Select
							:model-value="form.revenue_account_id || ''"
							placeholder="Pilih akun pendapatan"
							:options="accountOptions"
							@update:model-value="(v) => (form.revenue_account_id = Number(v))"
						/>
					</FormField>
					<FormField label="Akun HPP" required :error="errors.cogs_account_id">
						<Select
							:model-value="form.cogs_account_id || ''"
							placeholder="Pilih akun HPP"
							:options="accountOptions"
							@update:model-value="(v) => (form.cogs_account_id = Number(v))"
						/>
					</FormField>
					<FormField label="Akun Persediaan" required :error="errors.inventory_account_id">
						<Select
							:model-value="form.inventory_account_id || ''"
							placeholder="Pilih akun persediaan"
							:options="accountOptions"
							@update:model-value="(v) => (form.inventory_account_id = Number(v))"
						/>
					</FormField>
					<FormField label="Akun Biaya" required :error="errors.expense_account_id">
						<Select
							:model-value="form.expense_account_id || ''"
							placeholder="Pilih akun biaya"
							:options="accountOptions"
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
