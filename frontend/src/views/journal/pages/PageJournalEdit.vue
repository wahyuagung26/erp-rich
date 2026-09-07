<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import FormJournalLines from '@/views/journal/components/FormJournalLines.vue'
import type { Journal, JournalLine } from '@/utils/types'
import { journalStatusLabel, journalStatusTone, type JournalForm } from '@/views/journal/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const journal = ref<Journal>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: Journal }>(`/journal/${route.params.id}`)
		journal.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

const toForm = (value: Journal): JournalForm => ({
	number: value.number,
	date: value.date,
	voucher: value.voucher,
	description: value.description,
	attachment: value.attachment,
	lines: value.lines.map((line: JournalLine) => ({ ...line }))
})

async function save(payload: JournalForm) {
	saving.value = true
	try {
		await api.put(`/journal/${route.params.id}`, payload)
		toast.success('Jurnal diperbarui')
		router.push(`/journal/${route.params.id}`)
	} catch (err) {
		if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Jurnal tidak dapat diperbarui')
		else throw err
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Edit Jurnal" subtitle="Jurnal Umum">
			<template v-if="journal" #actions>
				<div class="flex items-center gap-2">
					<Badge :tone="journalStatusTone[journal.status]">{{ journalStatusLabel[journal.status] }}</Badge>
				</div>
			</template>
		</PageHeader>
		<Panel v-if="loading" class="max-w-5xl"><Skeleton :lines="5" /></Panel>
		<Panel v-else-if="notFound || !journal" class="max-w-5xl">
			<EmptyState title="Jurnal tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center"><Button variant="secondary" @click="router.push('/journal')">Kembali</Button></div>
		</Panel>
		<Panel v-else-if="journal.status !== 'submitted'" class="max-w-5xl">
			<EmptyState title="Jurnal tidak dapat diedit" description="Hanya jurnal dengan status Menunggu Persetujuan yang dapat diedit." />
			<div class="mt-3 flex justify-center"><Button variant="secondary" @click="router.push(`/journal/${journal.id}`)">Lihat Detail</Button></div>
		</Panel>
		<FormJournalLines v-else :initial-value="toForm(journal)" :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
