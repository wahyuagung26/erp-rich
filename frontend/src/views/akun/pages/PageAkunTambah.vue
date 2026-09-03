<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/base/PageHeader.vue'
import FormAkun from '@/views/akun/components/FormAkun.vue'
import type { AkunForm } from '@/views/akun/schema'

const router = useRouter()
const toast = useToast()
const saving = ref(false)

async function save(payload: AkunForm) {
	saving.value = true
	try {
		await api.post('/akun', payload)
		toast.success('Akun ditambahkan')
		router.push('/akun')
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Tambah Akun" subtitle="Bagan Akun" />
		<FormAkun :loading="saving" submit-label="Simpan Akun" @submit="save" />
	</div>
</template>
