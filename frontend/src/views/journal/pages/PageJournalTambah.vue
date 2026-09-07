<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Badge from '@/components/base/Badge.vue'
import FormJournalLines from '@/views/journal/components/FormJournalLines.vue'
import type { JournalForm } from '@/views/journal/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)

async function save(payload: JournalForm) {
	saving.value = true
	try {
		await api.post('/journal', payload)
		toast.success('Jurnal diajukan')
		router.push('/journal')
	} catch (err) {
		if (axios.isAxiosError(err)) {
			toast.error(err.response?.data?.message ?? 'Jurnal tidak dapat disimpan')
			return
		}
		throw err
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Buat Jurnal" subtitle="Jurnal Umum">
			<template #actions>
				<div class="flex items-center gap-2"><Badge tone="warning">Belum Disetujui</Badge></div>
			</template>
		</PageHeader>
		<FormJournalLines :loading="saving" @submit="save" />
	</div>
</template>
