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
		dense?: boolean // compact height for in-grid entry
		ghost?: boolean // grid cell: looks like plain text until hovered (tint) or focused (outline)
		cell?: boolean // fills a whole grid cell like Excel: square, no padding or border, inset focus ring (parent td has no padding)
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
		<div
			:class="[
				'flex w-full items-stretch',
				addon && 'overflow-hidden rounded-md border border-ink-subtle/30 bg-panel focus-within:ring-2 focus-within:ring-primary/40'
			]"
		>
			<input
				v-bind="inputAttrs"
				:type="type"
				:value="modelValue"
				:placeholder="placeholder"
				:disabled="disabled"
				:class="[
					'w-full text-ink placeholder:text-ink-subtle disabled:opacity-50',
					cell ? 'px-1.5' : ghost ? 'px-2' : 'px-3',
					dense ? 'py-1 text-s' : ghost ? 'py-1 text-m' : 'py-2 text-m',
					addon
						? 'bg-transparent focus-visible:ring-0'
						: cell
							? '!rounded-none border-0 bg-transparent hover:bg-fill focus:bg-panel focus-visible:ring-inset focus-visible:ring-primary'
							: ghost
								? 'rounded-md border border-transparent bg-transparent hover:bg-fill focus:border-ink-subtle/30 focus:bg-panel'
								: 'rounded-md border border-ink-subtle/30 bg-panel disabled:bg-fill',
					align === 'right' && 'text-right',
					mono && 'tnum',
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
