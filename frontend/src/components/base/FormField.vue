<script setup lang="ts">
import HelpTip from '@/components/base/HelpTip.vue'

// `help` = tooltip beside the label; use it to explain WHY a field is disabled / auto-filled (checklist: frontend skill §5a.5)
defineProps<{ label?: string; hint?: string; help?: string; error?: string; required?: boolean }>()
</script>

<template>
	<div class="space-y-1">
		<div v-if="label || $slots.label" class="flex items-center gap-1">
			<!-- `#label` slot for a label that needs inline controls (e.g. an "aktifkan" toggle) -->
			<label class="block text-s font-medium text-ink-muted">
				<slot name="label">{{ label }}</slot>
				<span v-if="required" class="text-danger">*</span>
			</label>
			<HelpTip v-if="help" :text="help" />
		</div>
		<slot />
		<p v-if="error" class="text-s text-danger">{{ error }}</p>
		<p v-else-if="hint" class="text-s text-ink-subtle">{{ hint }}</p>
	</div>
</template>
