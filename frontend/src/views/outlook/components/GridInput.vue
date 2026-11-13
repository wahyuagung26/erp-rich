<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { integerInput } from '@/utils/format'

// One amount cell of the Outlook grid: shows 1.234.567, auto-saves when left (blur) if it changed, Enter = same column next row (Shift = up).
// `nullable` = empty means "not set" (null) and 0 is a real value (the opening balance).
const props = defineProps<{ value: number | null; nav: string; label: string; nullable?: boolean; placeholder?: string; wide?: boolean }>()
const emit = defineEmits<{ commit: [number | null] }>()

function show(v: number | null): string {
	if (v == null || (v === 0 && !props.nullable)) return ''
	return v < 0 ? `-${integerInput(-v)}` : integerInput(v)
}
const text = ref(show(props.value))
const input = ref<HTMLInputElement>()
const focused = ref(false)
const dirty = ref(false)

// A fresh server value never overwrites what the user is typing in this cell.
watch(
	() => props.value,
	(v) => {
		if (!(focused.value && dirty.value)) text.value = show(v)
	}
)

async function onInput(e: Event) {
	const el = e.target as HTMLInputElement
	const cursor = el.selectionStart ?? el.value.length
	const before = el.value.slice(0, cursor).replace(/\D/g, '').length
	const digits = el.value.replace(/\D/g, '').slice(0, 13)
	const neg = /^\s*-/.test(el.value)
	text.value = (neg ? '-' : '') + (digits ? integerInput(Number(digits)) : '')
	dirty.value = true
	await nextTick()
	if (!input.value) return
	let pos = 0
	let seen = 0
	while (pos < text.value.length && seen < before) if (/\d/.test(text.value[pos++])) seen++
	input.value.setSelectionRange(pos, pos)
}

function onFocus() {
	focused.value = true
	input.value?.select()
}

function onBlur() {
	focused.value = false
	if (!dirty.value) return
	dirty.value = false
	const digits = text.value.replace(/\D/g, '')
	const blank = text.value.trim() === '' || text.value.trim() === '-'
	if (!digits && !blank) {
		text.value = show(props.value)
		return
	}
	let next: number | null = props.nullable ? null : 0
	if (digits) next = (text.value.startsWith('-') ? -1 : 1) * Number(digits)
	text.value = show(next)
	const same = props.nullable ? next === props.value : (next ?? 0) === (props.value ?? 0)
	if (!same) emit('commit', next)
}

function onEnter(e: KeyboardEvent) {
	const all = [...document.querySelectorAll<HTMLInputElement>(`input[data-nav="${props.nav}"]`)]
	const target = all[all.indexOf(input.value!) + (e.shiftKey ? -1 : 1)]
	if (target) {
		target.focus()
		target.select()
	} else input.value?.blur()
}
</script>

<template>
	<input
		ref="input"
		type="text"
		inputmode="numeric"
		autocomplete="off"
		:data-nav="nav"
		:aria-label="label"
		:placeholder="placeholder"
		:value="text"
		:class="[
			'h-6 rounded border border-ink-subtle/30 bg-panel px-1.5 text-right text-s tnum text-ink placeholder:text-ink-subtle',
			wide ? 'w-[104px]' : 'w-[92px]',
			text.startsWith('-') && 'text-danger'
		]"
		@focus="onFocus"
		@input="onInput"
		@blur="onBlur"
		@keydown.enter.prevent="onEnter"
	/>
</template>
