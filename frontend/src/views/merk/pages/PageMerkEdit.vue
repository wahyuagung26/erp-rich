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
import FormMerk from '@/views/merk/components/FormMerk.vue'
import type { Merk } from '@/utils/types'
import type { MerkForm } from '@/views/merk/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const merk = ref<Merk>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const formRef = ref<InstanceType<typeof FormMerk>>()

onMounted(async () => {
	try {
		const res = await api.get<{ data: Merk }>(`/merk/${route.params.id}`)
		merk.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
})

async function save(payload: MerkForm) {
	saving.value = true
	try {
		await api.put(`/merk/${route.params.id}`, payload)
		toast.success('Merk diperbarui')
		router.push('/merk')
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
		<PageHeader title="Edit Merk" subtitle="Master data merk produk" />
		<Panel v-if="loading" class="max-w-xl"><Skeleton :lines="3" /></Panel>
		<Panel v-else-if="notFound || !merk" class="max-w-xl">
			<EmptyState title="Merk tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center">
				<Button variant="secondary" @click="router.push('/merk')">Kembali</Button>
			</div>
		</Panel>
		<FormMerk v-else ref="formRef" :initial="merk" is-edit :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
