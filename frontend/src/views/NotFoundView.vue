<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from '@/components/base/Button.vue'
const router = useRouter()
</script>

<template>
	<div class="grid min-h-screen place-items-center p-4 text-center">
		<div>
			<p class="font-mono text-heading-l text-ink-subtle">404</p>
			<p class="mt-1 text-m text-ink-muted">Halaman tidak ditemukan.</p>
			<Button class="mt-4" variant="secondary" size="sm" @click="router.push('/dashboard')">Ke Dashboard</Button>
		</div>
	</div>
</template>
