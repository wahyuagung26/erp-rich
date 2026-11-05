<script setup lang="ts">
// Print-view shell: toolbar (screen only), loading / not-found states, the document sheet(s) in the
// default slot, then one sheet per image attachment (PDFs are not printed). `?auto=1` prints once ready.
import { computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconArrowLeft, IconPrinter } from '@tabler/icons-vue'
import Button from '@/components/base/Button.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import Spinner from '@/components/base/Spinner.vue'
import type { JournalAttachment } from '@/utils/types'

const props = defineProps<{
	loading: boolean
	notFound: boolean
	notFoundTitle: string
	docNumber?: string
	attachments?: JournalAttachment[]
	portrait?: boolean
}>()

const route = useRoute()
const router = useRouter()
const images = computed(() => props.attachments?.filter((file) => file.type.startsWith('image/')) ?? [])
const ready = computed(() => !props.loading && !props.notFound)
const print = () => window.print()

watch(
	ready,
	async (value) => {
		if (!value || route.query.auto !== '1') return
		await nextTick()
		// Wait for the attachment images, or the browser prints blank frames.
		await Promise.all([...document.querySelectorAll<HTMLImageElement>('.sheet img')].map((img) => img.decode().catch(() => undefined)))
		print()
	},
	{ immediate: true }
)
</script>

<template>
	<div class="min-h-screen bg-canvas print:min-h-0 print:bg-white">
		<component :is="'style'" v-if="portrait">@page { size: A4 portrait; margin: 0 }</component>
		<div class="sticky top-0 z-10 flex items-center gap-2 bg-panel px-4 py-2 print:hidden">
			<Button size="sm" variant="subtle" @click="router.back()"><IconArrowLeft class="h-4 w-4" /> Kembali</Button>
			<Button size="sm" :disabled="!ready" @click="print"><IconPrinter class="h-4 w-4" /> Cetak</Button>
		</div>

		<div v-if="loading" class="grid place-items-center py-24"><Spinner /></div>
		<EmptyState v-else-if="notFound" :title="notFoundTitle" description="Data mungkin sudah dihapus." />

		<div v-else class="space-y-4 p-4 print:space-y-0 print:p-0">
			<slot />

			<section
				v-for="(file, index) in images"
				:key="file.name + index"
				class="sheet mx-auto flex w-[277mm] max-w-full break-after-page flex-col items-center bg-white p-4 text-[11px] text-black last:break-after-auto print:w-full print:p-0"
			>
				<p class="mb-2 self-start text-ink-muted print:text-black">
					Lampiran {{ index + 1 }} — {{ file.name }}{{ docNumber ? ` (${docNumber})` : '' }}
				</p>
				<img :src="file.data_url" :alt="file.name" class="max-h-[185mm] max-w-full object-contain" />
			</section>
		</div>
	</div>
</template>

<style>
@page {
	size: A4 landscape;
	margin: 8mm;
}
/* body is bg-canvas (grey) app-wide; keep it off the paper */
@media print {
	body {
		background: #fff;
	}
}
</style>
