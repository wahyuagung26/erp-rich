<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconCopy, IconX } from '@tabler/icons-vue'
import Modal from '@/components/base/Modal.vue'
import Button from '@/components/base/Button.vue'
import Select from '@/components/base/Select.vue'
import Input from '@/components/base/Input.vue'
import FormField from '@/components/base/FormField.vue'
import { MONTHS } from '../types'

// "Duplikasi Untuk Periode Selanjutnya": pick the target month/year (default: the month after the current one).
const props = defineProps<{ open: boolean; year: number; month: number; saving?: boolean }>()
const emit = defineEmits<{ close: []; submit: [{ target_year: number; target_month: number }] }>()

const month = ref('1')
const year = ref('')
const error = ref('')

watch(
	() => props.open,
	(v) => {
		if (!v) return
		month.value = String(props.month === 12 ? 1 : props.month + 1)
		year.value = String(props.month === 12 ? props.year + 1 : props.year)
		error.value = ''
	}
)

function submit() {
	if (props.saving) return
	if (!/^\d{4}$/.test(year.value.trim()) || Number(year.value) < 2000 || Number(year.value) > 2100) {
		error.value = 'Tahun tujuan harus 4 digit antara 2000 dan 2100'
		return
	}
	error.value = ''
	emit('submit', { target_year: Number(year.value), target_month: Number(month.value) })
}
</script>

<template>
	<Modal :open="open" size="md" title="Duplikasi Untuk Periode Selanjutnya" @close="emit('close')">
		<div class="space-y-4">
			<p class="text-m text-ink-muted">
				Hanya struktur kategori yang disalin ke periode tujuan. Target OL, actual, saldo awal, tanggal kolom, dan status closing tidak ikut disalin. Bila periode
				tujuan sudah ada, Anda akan diminta mengonfirmasi penggantian template.
			</p>
			<FormField label="Periode tujuan" :error="error">
				<!-- sized wrappers: Select / Input are `w-full` themselves, so a flex-1 / w-28 class on them loses and the month box collapses to ~46px -->
				<div class="flex gap-2">
					<div class="min-w-0 flex-1"><Select v-model="month" :options="MONTHS.map((m, i) => ({ label: m, value: String(i + 1) }))" /></div>
					<div class="w-28 shrink-0">
						<Input v-model="year" type="number" inputmode="numeric" aria-label="Tahun tujuan" mono @keydown.enter.prevent="submit" />
					</div>
				</div>
			</FormField>
		</div>
		<template #footer>
			<Button variant="secondary" @click="emit('close')"><IconX class="h-4 w-4" /> Batal</Button>
			<Button :loading="saving" @click="submit"><IconCopy class="h-4 w-4" /> Duplikasi</Button>
		</template>
	</Modal>
</template>
