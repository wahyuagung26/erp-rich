<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { IconArrowLeft } from '@tabler/icons-vue'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessage'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import FormCustomerDeposit from '@/views/customer-deposit/components/FormCustomerDeposit.vue'
import { depositUsage, type CustomerDepositDraft, type CustomerDepositRequest } from '@/views/customer-deposit/schema'
import type { CustomerDeposit } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const deposit = ref<CustomerDeposit>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormCustomerDeposit>>()

onMounted(load)

async function load() {
	try {
		const res = await api.get<{ data: CustomerDeposit }>(`/customer-deposit/${route.params.id}`)
		deposit.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}

const toForm = (value: CustomerDeposit): CustomerDepositDraft => ({
	number: value.number,
	date: value.date,
	department_id: value.department_id,
	department_code: value.department_code,
	department_name: value.department_name,
	customer_id: value.customer_id,
	customer_code: value.customer_code,
	customer_name: value.customer_name,
	amount: value.amount,
	used: value.used,
	cash_account_id: value.cash_account_id,
	cash_account_code: value.cash_account_code,
	cash_account_name: value.cash_account_name,
	cash_flow: value.cash_flow ?? '',
	cash_flow_name: value.cash_flow_name,
	description: value.description,
	attachment: value.attachment
})

async function save(payload: CustomerDepositRequest) {
	if (saving.value) return
	saving.value = true
	try {
		await api.put(`/customer-deposit/${route.params.id}`, payload)
		toast.success('Titipan customer diperbarui')
		router.push(`/customer-deposit/${route.params.id}`)
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422 && err.response.data?.errors) {
			formRef.value?.setServerErrors(err.response.data.errors)
			toast.error('Data belum tersimpan. Periksa isian yang ditandai merah.')
			return
		}
		toast.error(errorMessage(err, 'Titipan customer tidak dapat diperbarui'))
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Edit Titipan Customer" subtitle="Penjualan">
			<template #actions>
				<div class="flex flex-wrap items-center gap-2">
					<Badge v-if="deposit" :tone="depositUsage(deposit).tone">{{ depositUsage(deposit).label }}</Badge>
					<Button size="sm" variant="subtle" @click="router.push(deposit ? `/customer-deposit/${deposit.id}` : '/customer-deposit')">
						<IconArrowLeft class="h-4 w-4" /> Kembali
					</Button>
				</div>
			</template>
		</PageHeader>
		<Panel v-if="loading"><Skeleton :lines="6" /></Panel>
		<Panel v-else-if="notFound || !deposit">
			<EmptyState title="Titipan customer tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center"><Button variant="secondary" @click="router.push('/customer-deposit')">Kembali ke Daftar</Button></div>
		</Panel>
		<Panel v-else-if="deposit.locked">
			<EmptyState title="Titipan tidak dapat diubah" description="Periode titipan sudah closing, titipan tidak bisa diubah." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push(`/customer-deposit/${deposit.id}`)">Detail</Button>
			</div>
		</Panel>
		<FormCustomerDeposit v-else ref="formRef" :initial-value="toForm(deposit)" :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
