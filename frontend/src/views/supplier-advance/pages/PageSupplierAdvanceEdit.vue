<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import FormSupplierAdvance from '@/views/supplier-advance/components/FormSupplierAdvance.vue'
import RiwayatPemakaian from '@/views/supplier-advance/components/RiwayatPemakaian.vue'
import type { SupplierAdvanceForm } from '@/views/supplier-advance/schema'
import type { SupplierAdvance } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const advance = ref<SupplierAdvance>()
const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)

onMounted(load)

async function load() {
	try {
		const res = await api.get<{ data: SupplierAdvance }>(`/supplier-advance/${route.params.id}`)
		advance.value = res.data.data
	} catch {
		notFound.value = true
	} finally {
		loading.value = false
	}
}

const toForm = (value: SupplierAdvance): SupplierAdvanceForm => ({
	number: value.number,
	date: value.date,
	department_id: value.department_id,
	department_code: value.department_code,
	department_name: value.department_name,
	supplier_id: value.supplier_id,
	supplier_code: value.supplier_code,
	supplier_name: value.supplier_name,
	amount: value.amount,
	used: value.used,
	cash_account_id: value.cash_account_id,
	cash_account_code: value.cash_account_code,
	cash_account_name: value.cash_account_name,
	advance_type: value.advance_type,
	cash_flow: value.cash_flow ?? '',
	cash_flow_name: value.cash_flow_name,
	description: value.description,
	attachment: value.attachment
})

// Business rule: an advance with usage rows ("sudah dipakai di Hutang Supplier") is immutable.
const locked = computed(() => (advance.value?.used ?? 0) > 0)

async function save(payload: SupplierAdvanceForm) {
	saving.value = true
	try {
		await api.put(`/supplier-advance/${route.params.id}`, payload)
		toast.success('Uang muka supplier diperbarui')
		router.push(`/supplier-advance/${route.params.id}`)
	} catch (err) {
		if (axios.isAxiosError(err)) toast.error(err.response?.data?.message ?? 'Uang muka supplier tidak dapat diperbarui')
		else throw err
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Uang Muka Supplier" subtitle="Pembelian" />
		<Panel v-if="loading" class="max-w-5xl"><Skeleton :lines="6" /></Panel>
		<Panel v-else-if="notFound || !advance" class="max-w-5xl">
			<EmptyState title="Uang muka supplier tidak ditemukan" description="Data mungkin sudah dihapus." />
			<div class="mt-3 flex justify-center"><Button variant="secondary" @click="router.push('/supplier-advance')">Kembali</Button></div>
		</Panel>
		<template v-else-if="locked">
			<Panel class="max-w-5xl">
				<EmptyState title="Uang muka tidak dapat diubah" description="Uang muka yang sudah dipakai di Hutang Supplier tidak boleh diubah." />
				<div class="mt-3 flex justify-center">
					<Button variant="secondary" @click="router.push(`/supplier-advance/${advance.id}`)">Lihat Detail</Button>
				</div>
			</Panel>
			<RiwayatPemakaian :advance-id="advance.id" />
		</template>
		<template v-else>
			<FormSupplierAdvance
				:initial-value="toForm(advance)"
				:loading="saving"
				:advance-id="advance.id"
				submit-label="Simpan Perubahan"
				@submit="save"
			/>
		</template>
	</div>
</template>
