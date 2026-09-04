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
import FormGroupAkun from '@/views/group-akun/components/FormGroupAkun.vue'
import type { GroupAkun } from '@/utils/types'
import type { GroupAkunForm } from '@/views/group-akun/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const groupAkun = ref<GroupAkun>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormGroupAkun>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: GroupAkun }>(`/group-akun/${route.params.id}`)
		groupAkun.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: GroupAkunForm) {
	saving.value = true
	try {
		await api.put(`/group-akun/${route.params.id}`, payload)
		toast.success('Group akun diperbarui')
		router.push('/group-akun')
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
		<Panel v-else-if="notFound || !groupAkun">
			<EmptyState title="Group akun tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/group-akun')">Kembali</Button>
			</div>
		</Panel>
		<FormGroupAkun v-else ref="formRef" :initial="groupAkun" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
