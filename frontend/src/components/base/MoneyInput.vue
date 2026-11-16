<script setup lang="ts">
import { nextTick, ref, useAttrs, watch } from 'vue'
import { integerInput, parseIntegerInput } from '@/utils/format'

defineOptions({ inheritAttrs: false })

// blankZero: show an empty field (placeholder visible) instead of "0" — for entry rows.
// ghost: grid cell — no "Rp" block, plain text until hovered (tint) or focused (outline); `dense` = smaller text.
// cell: fills a whole grid cell like Excel (parent td is `relative !p-0`, pass `absolute inset-0` as class): square, inset focus ring.
const props = withDefaults(
	defineProps<{ modelValue?: number; disabled?: boolean; blankZero?: boolean; ghost?: boolean; dense?: boolean; cell?: boolean }>(),
	{
		modelValue: 0
	}
)
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
			class="flex w-full items-stretch overflow-hidden rounded-md border has-[:disabled]:bg-fill"
			:class="
				cell
					? 'h-full !rounded-none border-transparent bg-transparent hover:bg-fill focus-within:bg-panel focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary'
					: ghost
						? 'border-transparent bg-transparent hover:bg-fill focus-within:border-ink-subtle/30 focus-within:bg-panel focus-within:ring-2 focus-within:ring-primary/40'
						: 'border-ink-subtle/30 bg-panel focus-within:ring-2 focus-within:ring-primary/40'
			"
		>
			<span v-if="!ghost && !cell" class="flex select-none items-center whitespace-nowrap border-r border-hairline px-3 text-s text-ink-muted"
				>Rp</span
			>
			<input
				ref="input"
				v-bind="inputAttrs"
				type="text"
				inputmode="numeric"
				:value="displayValue"
				:disabled="disabled"
				class="w-full bg-transparent text-right tnum text-ink placeholder:text-ink-subtle outline-none disabled:opacity-50"
				:class="[cell ? 'h-full px-1.5' : ghost ? 'px-2 py-1' : 'px-3 py-2', dense ? 'text-s' : 'text-m']"
				@focus="onFocus"
				@input="onInput"
				@blur="onBlur"
			/>
		</div>
	</div>
</template>
