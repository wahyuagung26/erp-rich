<script setup lang="ts">
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppTopbar from '@/components/common/AppTopbar.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import ToastHost from '@/components/common/ToastHost.vue'

// App shell. Rail + topbar + scrollable content. No borders anywhere —
// surfaces read apart through the canvas gap (Borderless Design).
</script>

<template>
	<div class="flex h-screen">
		<AppSidebar />
		<div class="flex min-w-0 flex-1 flex-col gap-2">
			<AppTopbar />
			<main class="min-h-0 flex-1 overflow-y-auto">
				<RouterView v-slot="{ Component }">
					<component :is="Component" class="mx-auto max-w-[1200px]" />
				</RouterView>
			</main>
		</div>

		<ConfirmDialog />
		<ToastHost />
	</div>
</template>
