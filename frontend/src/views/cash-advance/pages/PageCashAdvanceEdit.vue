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
import FormCashAdvance from '@/views/cash-advance/components/FormCashAdvance.vue'
import HistoryPenyelesaian from '@/views/cash-advance/components/HistoryPenyelesaian.vue'
import { journalStatusLabel, journalStatusTone, type CashAdvanceForm } from '@/views/cash-advance/schema'
import type { CashAdvance } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const advance = ref<CashAdvance>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)

onMounted(load)

async function load() {
	try {
		const res = await api.get<{ data: CashAdvance }>(`/cash-advance/${route.params.id}`)
		advance.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}

const toForm = (value: CashAdvance): CashAdvanceForm => ({
	number: value.number,
	date: value.date,
	department_id: value.department_id,
	department_code: value.department_code,
	department_name: value.department_name,
	recipient: value.recipient,
	description: value.description,
	amount: value.amount,
	used: value.used,
	cash_account_id: value.cash_account_id,
	cash_account_code: value.cash_account_code,
	cash_account_name: value.cash_account_name,
	advance_account_id: value.advance_account_id,
	advance_account_code: value.advance_account_code,
	advance_account_name: value.advance_account_name,
	cash_flow: value.cash_flow ?? '',
	cash_flow_name: value.cash_flow_name,
	attachment: value.attachment
})

async function save(payload: CashAdvanceForm) {
	saving.value = true
	try {
		await api.put(`/cash-advance/${route.params.id}`, payload)
		toast.success('Uang muka operasional diperbarui')
		router.push(`/cash-advance/${route.params.id}`)
	} catch (err) {
		if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Uang muka operasional tidak dapat diperbarui')
		else throw err
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Edit Uang Muka Operasional" subtitle="Akuntansi">
			<template v-if="advance" #actions>
				<div class="flex items-center gap-2">
					<Badge :tone="journalStatusTone[advance.status]">{{ journalStatusLabel[advance.status] }}</Badge>
				</div>
			</template>
		</PageHeader>
		<Panel v-if="loading" class="max-w-5xl"><Skeleton :lines="5" /></Panel>
		<Panel v-else-if="notFound || !advance" class="max-w-5xl">
			<EmptyState title="Uang muka operasional tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center"><Button variant="secondary" @click="router.push('/cash-advance')">Kembali</Button></div>
		</Panel>
		<template v-else-if="advance.status !== 'submitted'">
			<Panel class="max-w-5xl">
				<EmptyState title="Uang muka tidak dapat diedit" description="Hanya uang muka dengan status Menunggu Persetujuan yang dapat diedit." />
				<div class="mt-3 flex justify-center">
					<Button variant="secondary" @click="router.push(`/cash-advance/${advance.id}`)">Lihat Detail</Button>
				</div>
			</Panel>
			<HistoryPenyelesaian :advance="advance" @changed="load" />
		</template>
		<template v-else>
			<FormCashAdvance :initial-value="toForm(advance)" :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
			<HistoryPenyelesaian :advance="advance" @changed="load" />
		</template>
	</div>
</template>
