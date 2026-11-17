<script setup lang="ts">
import { IconMenu2 } from '@tabler/icons-vue'
import { useUiStore } from '@/stores/ui'
import CompanyPicker from './CompanyPicker.vue'
import UserMenu from './UserMenu.vue'
import PeriodInfo from './PeriodInfo.vue'

const ui = useUiStore()

// Borderless top bar — no bottom border. Separated from content by whitespace.
</script>

<template>
	<header class="flex items-center gap-2 bg-panel px-3 py-2.5 sm:gap-4 sm:px-4">
		<button
			type="button"
			aria-label="Buka menu"
			class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-fill lg:hidden"
			@click="ui.toggleMobileNav()"
		>
			<IconMenu2 class="h-5 w-5" />
		</button>
		<CompanyPicker class="min-w-0" />
		<div class="ml-auto flex items-center gap-2">
			<PeriodInfo />
			<UserMenu />
		</div>
	</header>
</template>
