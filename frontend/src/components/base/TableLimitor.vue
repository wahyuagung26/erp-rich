<script setup lang="ts">
withDefaults(defineProps<{ defaultLimit?: number; limitOptions?: number[] }>(), {
	defaultLimit: 10,
	limitOptions: () => [10, 25, 50, 100]
})

defineEmits<{ pageTo: [{ limit: number }] }>()
</script>

<template>
	<label class="inline-flex items-center gap-2 text-s text-ink-muted">
		<span>Tampilkan</span>
		<select
			:value="defaultLimit"
			class="rounded-md bg-fill px-2 py-1 text-m text-ink"
			@change="$emit('pageTo', { limit: Number(($event.target as HTMLSelectElement).value) })"
		>
			<option v-for="n in limitOptions" :key="n" :value="n">{{ n }}</option>
		</select>
		<span>baris</span>
	</label>
</template>
