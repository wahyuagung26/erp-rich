<script setup lang="ts">
import { IconSearch } from '@tabler/icons-vue'
import Breadcrumb from '@/components/base/Breadcrumb.vue'
import UserMenu from './UserMenu.vue'
import DensityToggle from './DensityToggle.vue'

// Borderless top bar — no bottom border. Separated from content by whitespace.
</script>

<template>
	<header class="flex items-center gap-4 bg-panel px-4 py-2.5">
		<Breadcrumb />
		<div class="ml-auto flex items-center gap-2">
			<label class="hidden items-center gap-2 rounded-md bg-fill px-2.5 py-1.5 text-m text-ink-subtle sm:flex">
				<IconSearch class="h-4 w-4" />
				<input placeholder="Cari…" class="w-40 bg-transparent text-ink placeholder:text-ink-subtle focus:outline-none" />
			</label>
			<DensityToggle />
			<UserMenu />
		</div>
	</header>
</template>
