<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import FormSupplier from '@/views/supplier/components/FormSupplier.vue'
import type { Supplier } from '@/utils/types'
import type { SupplierForm } from '@/views/supplier/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const supplier = ref<Supplier>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: Supplier }>(`/supplier/${route.params.id}`)
		supplier.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: SupplierForm) {
	saving.value = true
	try {
		await api.put(`/supplier/${route.params.id}`, payload)
		toast.success('Supplier diperbarui')
		router.push('/supplier')
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Edit Supplier" subtitle="Master data vendor" />
		<Panel v-if="loading" class="max-w-5xl"><Skeleton :lines="6" /></Panel>
		<Panel v-else-if="notFound || !supplier" class="max-w-5xl">
			<EmptyState title="Supplier tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/supplier')">Kembali</Button>
			</div>
		</Panel>
		<FormSupplier v-else :initial="supplier" :code="supplier.code" :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
