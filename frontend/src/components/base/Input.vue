<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue'

withDefaults(
	defineProps<{
		modelValue?: string | number
		type?: string
		placeholder?: string
		disabled?: boolean
		align?: 'left' | 'right'
		mono?: boolean
	}>(),
	{ type: 'text', align: 'left' }
)

defineEmits<{ 'update:modelValue': [string] }>()

// class/style size the field (wrapper); other attrs (id, autocomplete, name…) go on the input
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const inputAttrs = computed(() => {
	const { class: _c, style: _s, ...rest } = attrs
	return rest
})
const hasSuffix = !!useSlots().suffix
</script>

<template>
	<div class="relative w-full" :class="[attrs.class]">
		<input
			v-bind="inputAttrs"
			:type="type"
			:value="modelValue"
			:placeholder="placeholder"
			:disabled="disabled"
			:class="[
				'w-full rounded-md bg-fill px-3 py-2 text-m text-ink placeholder:text-ink-subtle disabled:opacity-50',
				align === 'right' && 'text-right',
				mono && 'font-mono tnum',
				hasSuffix && 'pr-9'
			]"
			@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
		/>
		<span v-if="hasSuffix" class="absolute right-2 top-1/2 flex -translate-y-1/2 items-center text-ink-subtle">
			<slot name="suffix" />
		</span>
	</div>
</template>
