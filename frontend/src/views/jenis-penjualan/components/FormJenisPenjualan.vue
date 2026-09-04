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
import { validateJenisPenjualan, type JenisPenjualanForm } from '@/views/jenis-penjualan/schema'
import type { ApiList, AkunPerkiraan } from '@/utils/types'

const props = defineProps<{ initial?: Partial<JenisPenjualanForm>; isEdit?: boolean; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [JenisPenjualanForm] }>()

const router = useRouter()

const form = reactive<JenisPenjualanForm>({
	code: props.initial?.code ?? '',
	name: props.initial?.name ?? '',
	akun_pendapatan_id: props.initial?.akun_pendapatan_id ?? 0,
	akun_hpp_id: props.initial?.akun_hpp_id ?? 0,
	akun_persediaan_id: props.initial?.akun_persediaan_id ?? 0
})

// shared by all three account pickers below — one fetch, reused
const akunOptions = ref<{ label: string; value: number }[]>([])
onMounted(async () => {
	const res = await api.get<ApiList<AkunPerkiraan>>('/akun-perkiraan', { params: { per_page: 100 } })
	akunOptions.value = res.data.data.map((a) => ({ label: `${a.code} — ${a.name}`, value: a.id }))
})

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateJenisPenjualan(form)
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
					<FormField label="Akun Pendapatan" required :error="errors.akun_pendapatan_id">
						<Select
							:model-value="form.akun_pendapatan_id || ''"
							placeholder="Pilih akun pendapatan"
							:options="akunOptions"
							@update:model-value="(v) => (form.akun_pendapatan_id = Number(v))"
						/>
					</FormField>
					<FormField label="Akun HPP" required :error="errors.akun_hpp_id">
						<Select
							:model-value="form.akun_hpp_id || ''"
							placeholder="Pilih akun HPP"
							:options="akunOptions"
							@update:model-value="(v) => (form.akun_hpp_id = Number(v))"
						/>
					</FormField>
					<FormField label="Akun Persediaan" required :error="errors.akun_persediaan_id">
						<Select
							:model-value="form.akun_persediaan_id || ''"
							placeholder="Pilih akun persediaan"
							:options="akunOptions"
							@update:model-value="(v) => (form.akun_persediaan_id = Number(v))"
						/>
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/jenis-penjualan')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
