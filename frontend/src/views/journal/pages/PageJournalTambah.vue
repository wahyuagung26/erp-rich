<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormJournalLines from '@/views/journal/components/FormJournalLines.vue'
import type { JournalLine } from '@/utils/types'

const router = useRouter()
const toast = useToast()
const saving = ref(false)

async function save(payload: { date: string; description: string; lines: JournalLine[] }) {
	saving.value = true
	try {
		await api.post('/journal', payload)
		toast.success('Jurnal disimpan')
		router.push('/journal')
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Buat Jurnal" subtitle="Jurnal Umum" />
		<FormJournalLines :loading="saving" @submit="save" />
	</div>
</template>
