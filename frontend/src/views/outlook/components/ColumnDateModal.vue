<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconCheck, IconTrash, IconX } from '@tabler/icons-vue'
import dayjs from 'dayjs'
import Modal from '@/components/base/Modal.vue'
import Button from '@/components/base/Button.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import FormField from '@/components/base/FormField.vue'
import { EDGE_DAYS, RANGE_FIRST_SLOT, RANGE_MAX_DAYS, RANGE_WEEK, type OutlookWeek } from '../types'

// Sets / clears the date of one day column. Week 5 columns 5–7 also take an end date (a range of up to 3 days = one column).
const props = defineProps<{ open: boolean; week: OutlookWeek | null; slot: number; year: number; month: number; saving?: boolean }>()
const emit = defineEmits<{ close: []; apply: [{ start: string; end: string }]; clear: [] }>()

const start = ref('')
const end = ref('')

const isRange = computed(() => props.week?.week_no === RANGE_WEEK && props.slot >= RANGE_FIRST_SLOT)
const filled = computed(() => !!props.week?.slots[props.slot - 1])
const first = computed(() => dayjs(`${props.year}-${String(props.month).padStart(2, '0')}-01`))
const min = computed(() => first.value.subtract(EDGE_DAYS, 'day').format('YYYY-MM-DD'))
const max = computed(() => first.value.endOf('month').add(EDGE_DAYS, 'day').format('YYYY-MM-DD'))

watch(
	() => props.open,
	(v) => {
		if (!v || !props.week) return
		start.value = props.week.slots[props.slot - 1] ?? ''
		end.value = props.week.ends[props.slot - 1] ?? ''
	}
)

const error = computed(() => {
	if (!start.value) return ''
	if (start.value < min.value || start.value > max.value) return 'Tanggal harus dalam bulan periode atau 7 hari sebelum/sesudahnya'
	if (!isRange.value || !end.value) return ''
	if (end.value < start.value) return 'Tanggal akhir tidak boleh sebelum tanggal mulai'
	if (dayjs(end.value).diff(start.value, 'day') + 1 > RANGE_MAX_DAYS) return `Rentang maksimal ${RANGE_MAX_DAYS} hari`
	return ''
})

function apply() {
	if (props.saving || !start.value || error.value) return
	emit('apply', { start: start.value, end: isRange.value ? end.value : '' })
}
</script>

<template>
	<Modal :open="open" size="sm" :title="`Tanggal kolom ${slot} · Minggu ${week?.week_no ?? ''}`" @close="emit('close')">
		<div class="space-y-3">
			<FormField
				:label="isRange ? 'Dari tanggal' : 'Tanggal'"
				:hint="`Boleh dari 7 hari terakhir bulan lalu sampai 7 hari pertama bulan depan. Tanggal boleh sama dengan kolom lain; tiap kolom punya isian sendiri.`"
				:error="error"
			>
				<DatePicker v-model="start" :min="min" :max="max" />
			</FormField>
			<FormField
				v-if="isRange"
				label="Sampai tanggal (opsional)"
				:hint="`Satu rentang (maksimal ${RANGE_MAX_DAYS} hari) menjadi satu kolom dengan satu isian actual.`"
			>
				<DatePicker v-model="end" :min="start || min" :max="max" :disabled="!start" />
			</FormField>
		</div>
		<template #footer>
			<Button v-if="filled" variant="subtle" :loading="saving" class="mr-auto text-danger" @click="emit('clear')"
				><IconTrash class="h-4 w-4" /> Kosongkan</Button
			>
			<Button variant="secondary" @click="emit('close')"><IconX class="h-4 w-4" /> Batal</Button>
			<Button :loading="saving" :disabled="!start || !!error" @click="apply"><IconCheck class="h-4 w-4" /> Terapkan</Button>
		</template>
	</Modal>
</template>
