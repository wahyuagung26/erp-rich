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
import FormWarehouse from '@/views/warehouse/components/FormWarehouse.vue'
import type { Warehouse } from '@/utils/types'
import type { WarehouseForm } from '@/views/warehouse/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const warehouse = ref<Warehouse>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormWarehouse>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Warehouse }>(`/warehouse/${route.params.id}`)
		warehouse.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: WarehouseForm) {
	saving.value = true
	try {
		await api.put(`/warehouse/${route.params.id}`, payload)
		toast.success('Gudang diperbarui')
		router.push('/warehouse')
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
		<PageHeader title="Edit Gudang" subtitle="Master data gudang" />
		<Panel v-if="loading"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !warehouse">
			<EmptyState title="Gudang tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/warehouse')">Kembali</Button>
			</div>
		</Panel>
		<FormWarehouse v-else ref="formRef" :initial="warehouse" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
