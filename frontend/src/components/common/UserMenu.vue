<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@/composables/onClickOutside'
import { IconChevronDown, IconLogout } from '@tabler/icons-vue'
import { useUserStore } from '@/stores/user'

const user = useUserStore()
const router = useRouter()
const open = ref(false)

function logout() {
	user.logout()
	router.push('/login')
}
const root = ref<HTMLElement>()
onClickOutside(root, () => (open.value = false))

const initials = (name: string) =>
	name
		.split(' ')
		.map((w) => w[0])
		.slice(0, 2)
		.join('')
</script>

<template>
	<div ref="root" class="relative">
		<button class="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-fill" @click="open = !open">
			<span class="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-s font-semibold text-primary-dark">
				{{ initials(user.getUser?.name ?? '?') }}
			</span>
			<span class="hidden text-m text-ink sm:block">{{ user.getUser?.name }}</span>
			<IconChevronDown class="h-4 w-4 text-ink-subtle" />
		</button>

		<div v-if="open" class="absolute right-0 mt-1 w-52 rounded-md bg-panel p-1 shadow-overlay">
			<div class="px-2.5 py-2">
				<p class="text-m font-medium text-ink">{{ user.getUser?.name }}</p>
				<p class="text-s text-ink-subtle">{{ user.getUser?.email }}</p>
			</div>
			<button class="flex w-full items-center gap-2 rounded px-2.5 py-2 text-m text-ink-muted hover:bg-fill" @click="logout">
				<IconLogout class="h-4 w-4" />
				Keluar
			</button>
		</div>
	</div>
</template>
