<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Badge from '@/components/base/Badge.vue'
import FormCashAdvance from '@/views/cash-advance/components/FormCashAdvance.vue'
import type { CashAdvanceRequest } from '@/views/cash-advance/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormCashAdvance>>()

async function save(payload: CashAdvanceRequest) {
	saving.value = true
	try {
		await api.post('/cash-advance', payload)
		toast.success('Uang muka operasional diajukan')
		router.push('/cash-advance')
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 422) {
			const errors = err.response.data?.errors
			if (errors) formRef.value?.setServerErrors(errors)
			else toast.error(err.response.data?.message ?? 'Uang muka operasional tidak dapat disimpan')
			return
		}
		if (axios.isAxiosError(err)) {
			toast.error(err.response?.data?.message ?? 'Uang muka operasional tidak dapat disimpan')
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
		<PageHeader title="Tambah Uang Muka Operasional" subtitle="Akuntansi">
			<template #actions>
				<div class="flex items-center gap-2"><Badge tone="warning">Belum Disetujui</Badge></div>
			</template>
		</PageHeader>
		<FormCashAdvance ref="formRef" :loading="saving" @submit="save" />
	</div>
</template>
