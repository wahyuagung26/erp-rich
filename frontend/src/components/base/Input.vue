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
		addon?: string
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
		<!-- with `addon`, input + trailing label share one filled pill (Bootstrap input-group) -->
		<div :class="['flex w-full items-stretch', addon && 'overflow-hidden rounded-md bg-fill focus-within:ring-2 focus-within:ring-primary/40']">
			<input
				v-bind="inputAttrs"
				:type="type"
				:value="modelValue"
				:placeholder="placeholder"
				:disabled="disabled"
				:class="[
					'w-full px-3 py-2 text-m text-ink placeholder:text-ink-subtle disabled:opacity-50',
					addon ? 'bg-transparent focus-visible:ring-0' : 'rounded-md bg-fill',
					align === 'right' && 'text-right',
					mono && 'font-mono tnum',
					hasSuffix && 'pr-9'
				]"
				@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
			/>
			<span v-if="addon" class="flex select-none items-center whitespace-nowrap border-l border-hairline px-2.5 text-s text-ink-muted">
				{{ addon }}
			</span>
		</div>
		<span v-if="hasSuffix" class="absolute right-2 top-1/2 flex -translate-y-1/2 items-center text-ink-subtle">
			<slot name="suffix" />
		</span>
	</div>
</template>
