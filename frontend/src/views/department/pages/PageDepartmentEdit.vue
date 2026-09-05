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
import FormDepartment from '@/views/department/components/FormDepartment.vue'
import type { Department } from '@/utils/types'
import type { DepartmentForm } from '@/views/department/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const department = ref<Department>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormDepartment>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Department }>(`/department/${route.params.id}`)
		department.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: DepartmentForm) {
	saving.value = true
	try {
		await api.put(`/department/${route.params.id}`, payload)
		toast.success('Departemen diperbarui')
		router.push('/department')
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
		<PageHeader title="Edit Departemen" subtitle="Master data departemen" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !department">
			<EmptyState title="Departemen tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/department')">Kembali</Button>
			</div>
		</Panel>
		<FormDepartment v-else ref="formRef" :initial="department" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
