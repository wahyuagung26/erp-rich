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
import FormAccountGroup from '@/views/account-group/components/FormAccountGroup.vue'
import type { AccountGroup } from '@/utils/types'
import type { AccountGroupForm } from '@/views/account-group/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountGroup = ref<AccountGroup>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormAccountGroup>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: AccountGroup }>(`/account-group/${route.params.id}`)
		accountGroup.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: AccountGroupForm) {
	saving.value = true
	try {
		await api.put(`/account-group/${route.params.id}`, payload)
		toast.success('Group akun diperbarui')
		router.push('/account-group')
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
		<PageHeader title="Edit Group Akun" subtitle="Master data group akun" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !accountGroup">
			<EmptyState title="Group akun tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/account-group')">Kembali</Button>
			</div>
		</Panel>
		<FormAccountGroup v-else ref="formRef" :initial="accountGroup" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
