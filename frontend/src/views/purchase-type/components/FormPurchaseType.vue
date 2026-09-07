<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import Button from '@/components/base/Button.vue'
import { validatePurchaseType, type PurchaseTypeForm } from '@/views/purchase-type/schema'

const props = defineProps<{ initial?: Partial<PurchaseTypeForm>; isEdit?: boolean; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [PurchaseTypeForm] }>()

const router = useRouter()

const form = reactive<PurchaseTypeForm>({
	code: props.initial?.code ?? '',
	name: props.initial?.name ?? '',
	notes: props.initial?.notes ?? ''
})

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validatePurchaseType(form)
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
	<!-- Full-width panel, same as the list. Only the short code identifier stays capped -->
	<!-- (max-w-[200px]); free-text fields stretch full, same as FormSupplier. -->
	<Panel>
		<form class="space-y-8" @submit.prevent="onSubmit">
			<section class="space-y-3">
				<h3 class="subhead">Informasi Jenis Pembelian</h3>
				<div class="space-y-4">
					<FormField
						label="Kode Jenis Pembelian"
						required
						:error="errors.code"
						:hint="isEdit ? 'Tidak bisa diubah setelah dibuat.' : 'Huruf kapital A-Z, maksimal 5 karakter. Harus unik.'"
					>
						<Input v-model="form.code" mono maxlength="5" :disabled="isEdit" class="max-w-[200px]" placeholder="mis. LOKAL" />
					</FormField>
					<FormField label="Nama Jenis Pembelian" required :error="errors.name">
						<Input v-model="form.name" placeholder="mis. Pembelian Lokal" />
					</FormField>
					<FormField label="Keterangan" :error="errors.notes">
						<Textarea v-model="form.notes" :rows="2" placeholder="Keterangan jenis pembelian" />
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/purchase-type')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
