<script setup lang="ts">
import { computed } from 'vue'
import HelpTip from '@/components/base/HelpTip.vue'

// Help text never sits under the field: `help` (why it is disabled / auto-filled) and `hint` (what to enter) both render as
// one HelpTip right of the label (owner rule 2026-11-15; frontend skill §5a.5). Only `error` is shown as text below.
const props = defineProps<{ label?: string; hint?: string | string[]; help?: string | string[]; error?: string; required?: boolean }>()
// help first (why disabled), then hint; each string is one point — HelpTip numbers them when there is more than one.
const points = computed(() => [props.help, props.hint].flat().filter((t): t is string => !!t))
</script>

<template>
	<div class="space-y-1">
		<div v-if="label || $slots.label || points.length" class="flex items-center gap-1">
			<!-- `#label` slot for a label that needs inline controls (e.g. an "aktifkan" toggle) -->
			<label class="block text-s font-medium text-ink-muted">
				<slot name="label">{{ label }}</slot>
				<span v-if="required" class="text-danger">*</span>
			</label>
			<HelpTip v-if="points.length" :text="points" />
		</div>
		<slot />
		<p v-if="error" class="text-s text-danger">{{ error }}</p>
	</div>
</template>
