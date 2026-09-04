<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { IconChevronDown, IconBuilding, IconCheck } from '@tabler/icons-vue'
import { onClickOutside } from '@/composables/onClickOutside'
import { useCompanyStore } from '@/stores/company'

// Replaces the breadcrumb in the topbar: shows the active company and doubles
// as the company switcher.
const company = useCompanyStore()
const open = ref(false)
const root = ref<HTMLElement>()
onClickOutside(root, () => (open.value = false))

onMounted(() => company.load())

function pick(id: number) {
	company.setActive(id)
	open.value = false
}
</script>

<template>
	<div ref="root" class="relative">
		<button class="flex max-w-[260px] items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-fill" @click="open = !open">
			<span class="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-dark">
				<IconBuilding class="h-4 w-4" />
			</span>
			<span class="min-w-0 truncate text-m font-medium text-ink">
				{{ company.active ? company.active.legal_name || company.active.short_name : 'Pilih Perusahaan' }}
			</span>
			<IconChevronDown class="h-4 w-4 shrink-0 text-ink-subtle" />
		</button>

		<div v-if="open" class="absolute left-0 z-20 mt-1 w-72 rounded-md bg-panel p-1 shadow-overlay">
			<p class="px-2.5 py-1.5 text-s font-medium text-ink-subtle">Perusahaan Aktif</p>
			<button
				v-for="c in company.companies"
				:key="c.id"
				class="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left hover:bg-fill"
				@click="pick(c.id)"
			>
				<span class="min-w-0 flex-1">
					<span class="block truncate text-m text-ink">{{ c.short_name }}</span>
					<span class="block truncate text-s text-ink-subtle">{{ c.code }} · {{ c.legal_name }}</span>
				</span>
				<IconCheck v-if="c.id === company.activeId" class="h-4 w-4 shrink-0 text-primary" />
			</button>
			<p v-if="!company.companies.length" class="px-2.5 py-2 text-s text-ink-subtle">Belum ada perusahaan</p>
		</div>
	</div>
</template>
