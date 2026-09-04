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
import { TRANSAKSI_OPTIONS, JENIS_PEMBAYARAN_OPTIONS, validateTipePembayaran, type TipePembayaranForm } from '@/views/tipe-pembayaran/schema'
import type { ApiList, AkunPerkiraan } from '@/utils/types'

const props = defineProps<{ initial?: Partial<TipePembayaranForm>; isEdit?: boolean; submitLabel?: string; loading?: boolean }>()
const emit = defineEmits<{ submit: [TipePembayaranForm] }>()

const router = useRouter()

const form = reactive<TipePembayaranForm>({
	code: props.initial?.code ?? '',
	name: props.initial?.name ?? '',
	akun_perkiraan_id: props.initial?.akun_perkiraan_id ?? 0,
	transaksi: props.initial?.transaksi ?? 'penjualan',
	jenis: props.initial?.jenis ?? 'tunai'
})

const akunOptions = ref<{ label: string; value: number }[]>([])
onMounted(async () => {
	const res = await api.get<ApiList<AkunPerkiraan>>('/akun-perkiraan', { params: { per_page: 100 } })
	akunOptions.value = res.data.data.map((a) => ({ label: `${a.code} — ${a.name}`, value: a.id }))
})

const errors = ref<Record<string, string>>({})

function onSubmit() {
	const found = validateTipePembayaran(form)
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
					<FormField label="Akun Perkiraan" required :error="errors.akun_perkiraan_id">
						<Select
							:model-value="form.akun_perkiraan_id || ''"
							placeholder="Pilih akun perkiraan"
							:options="akunOptions"
							@update:model-value="(v) => (form.akun_perkiraan_id = Number(v))"
						/>
					</FormField>
					<FormField label="Transaksi" required :error="errors.transaksi">
						<RadioGroup v-model="form.transaksi" inline :options="[...TRANSAKSI_OPTIONS]" />
					</FormField>
					<FormField label="Jenis" required :error="errors.jenis">
						<RadioGroup v-model="form.jenis" inline :options="[...JENIS_PEMBAYARAN_OPTIONS]" />
					</FormField>
				</div>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading"> <IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> {{ submitLabel ?? 'Simpan' }} </Button>
				<Button variant="secondary" type="button" @click="router.push('/tipe-pembayaran')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
