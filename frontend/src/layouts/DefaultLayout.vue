<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppTopbar from '@/components/common/AppTopbar.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import FakturPajakModal from '@/components/common/FakturPajakModal.vue'
import HistoryModal from '@/components/common/HistoryModal.vue'
import Spinner from '@/components/base/Spinner.vue'
import { useUiStore } from '@/stores/ui'
import { useCompanyStore } from '@/stores/company'

const ui = useUiStore()
const company = useCompanyStore()

// Hold the shell until the active company (and its brand colour) is applied — avoids a default-green flash on reload.
// A failed load still opens the shell with the default palette.
const ready = ref(company.loaded)
onMounted(async () => {
	try {
		await company.load()
	} finally {
		ready.value = true
	}
})

// App shell. Rail + topbar + scrollable content. No borders anywhere —
// surfaces read apart through the canvas gap (Borderless Design).
</script>

<template>
	<div v-if="!ready" class="flex h-screen flex-col items-center justify-center gap-3 bg-canvas text-ink-muted">
		<Spinner :size="28" />
		<p class="text-s">Memuat perusahaan…</p>
	</div>
	<div v-else class="flex h-screen">
		<AppSidebar />
		<div v-if="ui.mobileNavOpen" class="fixed inset-0 z-30 bg-black/40 lg:hidden" @click="ui.toggleMobileNav(false)" />
		<div class="flex min-w-0 flex-1 flex-col gap-2">
			<AppTopbar />
			<main class="min-h-0 flex-1 overflow-y-auto">
				<RouterView v-slot="{ Component }">
					<component :is="Component" class="mx-auto max-w-[1200px]" />
				</RouterView>
			</main>
		</div>

		<ConfirmDialog />
		<FakturPajakModal />
		<HistoryModal />
		<ToastHost />
	</div>
</template>
