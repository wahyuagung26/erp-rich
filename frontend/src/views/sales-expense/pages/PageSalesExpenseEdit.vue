<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import FormSalesExpense from '@/views/sales-expense/components/FormSalesExpense.vue'
import type { SalesExpense } from '@/utils/types'
import type { SalesExpenseForm } from '@/views/sales-expense/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const salesExpense = ref<SalesExpense>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormSalesExpense>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: SalesExpense }>(`/sales-expense/${route.params.id}`)
		salesExpense.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: SalesExpenseForm) {
	saving.value = true
	try {
		await api.put(`/sales-expense/${route.params.id}`, payload)
		toast.success('Biaya penjualan diperbarui')
		router.push('/sales-expense')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) {
			const errors = err.response.data?.errors
			if (errors) formRef.value?.setServerErrors(errors)
			else toast.error(err.response.data?.message ?? 'Pilih perusahaan aktif terlebih dahulu')
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
		<PageHeader title="Edit Biaya Penjualan" subtitle="Master data biaya penjualan" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !salesExpense">
			<EmptyState title="Biaya penjualan tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/sales-expense')">Kembali</Button>
			</div>
		</Panel>
		<FormSalesExpense v-else ref="formRef" :initial="salesExpense" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
