<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import Textarea from '@/components/base/Textarea.vue'
import Button from '@/components/base/Button.vue'
import { validateWarehouse, type WarehouseForm } from '@/views/warehouse/schema'
import type { ApiList, Branch } from '@/utils/types'

const props = defineProps<{ initial?: Partial<WarehouseForm>; isEdit?: boolean; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [WarehouseForm] }>()

const router = useRouter()

const form = reactive<WarehouseForm>({
	code: props.initial?.code ?? '',
	name: props.initial?.name ?? '',
	branch_id: props.initial?.branch_id ?? 0,
	address: props.initial?.address ?? ''
})

const branchOptions = ref<{ label: string; value: number }[]>([])
onMounted(async () => {
	const res = await api.get<ApiList<Branch>>('/branch', { params: { per_page: 100 } })
	branchOptions.value = res.data.data.map((b) => ({ label: `${b.code} — ${b.name}`, value: b.id }))
})

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
					<FormField label="Cabang" required :error="errors.branch_id">
						<Select
							:model-value="form.branch_id || ''"
							placeholder="Pilih cabang"
							:options="branchOptions"
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
