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
import FormBankAccount from '@/views/bank-account/components/FormBankAccount.vue'
import type { BankAccount } from '@/utils/types'
import type { BankAccountForm } from '@/views/bank-account/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const bankAccount = ref<BankAccount>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormBankAccount>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: BankAccount }>(`/bank-account/${route.params.id}`)
		bankAccount.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: BankAccountForm) {
	saving.value = true
	try {
		await api.put(`/bank-account/${route.params.id}`, payload)
		toast.success('Rekening bank diperbarui')
		router.push('/bank-account')
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
		<PageHeader title="Edit Rekening Bank" subtitle="Master data rekening bank" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !bankAccount">
			<EmptyState title="Rekening bank tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/bank-account')">Kembali</Button>
			</div>
		</Panel>
		<FormBankAccount v-else ref="formRef" :initial="bankAccount" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
