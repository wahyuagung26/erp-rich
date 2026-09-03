<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
	defineProps<{
		variant?: 'primary' | 'secondary' | 'danger' | 'subtle'
		size?: 'sm' | 'md'
		type?: 'button' | 'submit'
		disabled?: boolean
		loading?: boolean
		block?: boolean
	}>(),
	{ variant: 'primary', size: 'md', type: 'button' }
)

defineEmits<{ click: [MouseEvent] }>()

const variants: Record<string, string> = {
	primary: 'bg-primary text-ink-invert hover:bg-primary-dark',
	secondary: 'bg-fill text-ink hover:bg-hairline',
	danger: 'bg-danger text-ink-invert hover:opacity-90',
	subtle: 'text-ink-muted hover:bg-fill'
}
const sizes: Record<string, string> = {
	sm: 'h-8 px-3 text-s gap-1.5',
	md: 'h-9 px-4 text-m gap-2'
}

const classes = computed(() => [
	'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
	variants[props.variant],
	sizes[props.size],
	props.block && 'w-full'
])
</script>

<template>
	<button :type="type" :class="classes" :disabled="disabled || loading" @click="$emit('click', $event)">
		<span v-if="loading" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
		<slot />
	</button>
</template>
