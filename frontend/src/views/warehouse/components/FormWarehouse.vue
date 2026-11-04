<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import AsyncSelect from '@/components/base/AsyncSelect.vue'
import Textarea from '@/components/base/Textarea.vue'
import Button from '@/components/base/Button.vue'
import { validateWarehouse, WAREHOUSE_TYPES, type WarehouseForm } from '@/views/warehouse/schema'
import type { Warehouse } from '@/utils/types'

const props = defineProps<{ initial?: Partial<Warehouse>; isEdit?: boolean; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [WarehouseForm] }>()

const router = useRouter()

const form = reactive<WarehouseForm>({
	code: props.initial?.code ?? '',
	name: props.initial?.name ?? '',
	type: props.initial?.type ?? 'main',
	branch_id: props.initial?.branch_id ?? 0,
	address: props.initial?.address ?? ''
})

// Already-denormalized on the entity — no resolve-by-id fetch needed on edit.
const initialBranchLabel = props.initial?.branch_code ? `${props.initial.branch_code} — ${props.initial.branch_name}` : undefined
const branchLabel = (item: Record<string, unknown>) => `${item.code} — ${item.name}`

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateWarehouse(form)
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
				<h3 class="subhead">Informasi Gudang</h3>
				<div class="space-y-4">
					<FormField label="Kode Gudang" required :error="errors.code" :hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : 'Harus unik.'">
						<Input v-model="form.code" mono :disabled="isEdit" class="max-w-[200px]" placeholder="mis. GD1" />
					</FormField>
					<FormField label="Nama Gudang" required :error="errors.name">
						<Input v-model="form.name" placeholder="mis. Gudang Pusat" />
					</FormField>
					<FormField label="Jenis Gudang" required :error="errors.type">
						<Select v-model="form.type" :options="[...WAREHOUSE_TYPES]" class="max-w-[240px]" />
					</FormField>
					<FormField label="Cabang" required :error="errors.branch_id">
						<AsyncSelect
							:model-value="form.branch_id || null"
							endpoint="/branch"
							:option-label="branchLabel"
							:initial-label="initialBranchLabel"
							placeholder="Cari cabang…"
							@update:model-value="(v) => (form.branch_id = Number(v))"
						/>
					</FormField>
					<FormField label="Alamat" :error="errors.address">
						<Textarea v-model="form.address" :rows="2" placeholder="Alamat lengkap gudang" />
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/warehouse')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
