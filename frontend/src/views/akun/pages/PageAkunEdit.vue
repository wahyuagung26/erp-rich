<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import FormAkun from '@/views/akun/components/FormAkun.vue'
import type { Akun } from '@/utils/types'
import type { AkunForm } from '@/views/akun/schema'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const akun = ref<Akun>()
const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
	try {
		const res = await api.get<{ data: Akun }>(`/akun/${route.params.id}`)
		akun.value = res.data.data
	} finally {
		loading.value = false
	}
})

async function save(payload: AkunForm) {
	saving.value = true
	try {
		await api.put(`/akun/${route.params.id}`, payload)
		toast.success('Akun diperbarui')
		router.push('/akun')
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Edit Akun" subtitle="Bagan Akun" />
		<Panel v-if="loading"><Skeleton :lines="5" /></Panel>
		<FormAkun v-else-if="akun" :initial="akun" :loading="saving" submit-label="Simpan Perubahan" @submit="save" />
	</div>
</template>
