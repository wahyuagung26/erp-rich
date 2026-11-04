<script setup lang="ts">
import { nextTick, ref, useAttrs, watch } from 'vue'
import { integerInput, parseIntegerInput } from '@/utils/format'

defineOptions({ inheritAttrs: false })

// blankZero: show an empty field (placeholder visible) instead of "0" — for entry rows.
const props = withDefaults(defineProps<{ modelValue?: number; disabled?: boolean; blankZero?: boolean }>(), { modelValue: 0 })
const show = (value: number) => (props.blankZero && !value ? '' : integerInput(value))
const emit = defineEmits<{ 'update:modelValue': [number] }>()

const attrs = useAttrs()
const input = ref<HTMLInputElement>()
const displayValue = ref(show(props.modelValue))
const editing = ref(false)

watch(
	() => props.modelValue,
	(value) => {
		if (!editing.value) displayValue.value = show(value)
	}
)

async function onInput(event: Event) {
	const target = event.target as HTMLInputElement
	const cursor = target.selectionStart ?? target.value.length
	const digitsBeforeCursor = target.value.slice(0, cursor).replace(/\D/g, '').length
	const digits = target.value.replace(/\D/g, '')

	editing.value = true
	displayValue.value = digits ? integerInput(Number(digits)) : ''
	emit('update:modelValue', parseIntegerInput(target.value))

	await nextTick()
	if (!input.value) return

	let nextCursor = 0
	let digitCount = 0
	while (nextCursor < displayValue.value.length && digitCount < digitsBeforeCursor) {
		if (/\d/.test(displayValue.value[nextCursor])) digitCount++
		nextCursor++
	}
	input.value.setSelectionRange(nextCursor, nextCursor)
}

function onBlur() {
	editing.value = false
	displayValue.value = show(props.modelValue)
}

function onFocus() {
	editing.value = true
	if (displayValue.value === '0') nextTick(() => input.value?.select())
}

const { class: className, style, ...inputAttrs } = attrs
</script>

<template>
	<div class="relative w-full" :class="className" :style="style">
		<div
			class="flex w-full items-stretch overflow-hidden rounded-md border border-ink-subtle/30 bg-panel focus-within:ring-2 focus-within:ring-primary/40 has-[:disabled]:bg-fill"
		>
			<span class="flex select-none items-center whitespace-nowrap border-r border-hairline px-3 text-s text-ink-muted">Rp</span>
			<input
				ref="input"
				v-bind="inputAttrs"
				type="text"
				inputmode="numeric"
				:value="displayValue"
				:disabled="disabled"
				class="w-full bg-transparent px-3 py-2 text-right tnum text-m text-ink placeholder:text-ink-subtle outline-none disabled:opacity-50"
				@focus="onFocus"
				@input="onInput"
				@blur="onBlur"
			/>
		</div>
	</div>
</template>
