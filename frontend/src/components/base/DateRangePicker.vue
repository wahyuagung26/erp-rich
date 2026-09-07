<script setup lang="ts">
// A from–to date pair: two <DatePicker>s with a "s/d" separator. Each input
// clamps the other (from's max = to, to's min = from) so the range can't invert.
// Two v-models: <DateRangePicker v-model:from="a" v-model:to="b" @change="refetch" />
import DatePicker from './DatePicker.vue'

defineProps<{ from?: string; to?: string; disabled?: boolean }>()
const emit = defineEmits<{ 'update:from': [string]; 'update:to': [string]; change: [] }>()

function setFrom(value: string) {
	emit('update:from', value)
	emit('change')
}
function setTo(value: string) {
	emit('update:to', value)
	emit('change')
}
</script>

<template>
	<div class="flex items-center gap-2">
		<DatePicker :model-value="from" :max="to" :disabled="disabled" class="!w-40" @update:model-value="setFrom" />
		<span class="text-s text-ink-subtle">s/d</span>
		<DatePicker :model-value="to" :min="from" :disabled="disabled" class="!w-40" @update:model-value="setTo" />
	</div>
</template>
