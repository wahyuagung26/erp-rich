<script setup lang="ts">
import { IconRefresh, IconX } from '@tabler/icons-vue'
import { computed, ref, watch } from 'vue'
import Modal from '@/components/base/Modal.vue'
import FileDrop from '@/components/base/FileDrop.vue'
import Button from '@/components/base/Button.vue'
import Badge from '@/components/base/Badge.vue'
import Amount from '@/components/base/Amount.vue'
import { previewBudgetFile, type ImportPreview, type ImportRow } from '../excel'
import type { BudgetLine } from '../types'

const props = defineProps<{ open: boolean; year: number; existing: number }>()
const emit = defineEmits<{ close: []; apply: [lines: BudgetLine[]] }>()
const file = ref<File>()
const busy = ref(false)
const error = ref('')
const result = ref<ImportPreview | null>(null)
let generation = 0
const errors = computed(() => result.value?.rows.filter((r) => r.status === 'error').length ?? 0)
const warnings = computed(() => result.value?.rows.filter((r) => r.status === 'warning').length ?? 0)
const importable = computed(() => result.value?.lines.length ?? 0)
const statusTone: Record<ImportRow['status'], 'success' | 'warning' | 'danger'> = { valid: 'success', warning: 'warning', error: 'danger' }
const statusLabel: Record<ImportRow['status'], string> = { valid: 'OK', warning: 'Peringatan', error: 'Error' }

function reset() {
	generation++
	file.value = undefined
	result.value = null
	error.value = ''
	busy.value = false
}
// Reading starts as soon as a file is picked, like the legacy importer.
watch(file, async (picked) => {
	const current = ++generation
	result.value = null
	error.value = ''
	if (!picked) return
	busy.value = true
	try {
		const preview = await previewBudgetFile(picked, props.year)
		if (current === generation) result.value = preview
	} catch (e) {
		if (current === generation) error.value = e instanceof Error ? e.message : 'Gagal membaca file. Periksa template lalu coba lagi.'
	} finally {
		if (current === generation) busy.value = false
	}
})
watch(
	() => props.open,
	(open) => {
		if (!open) reset()
	}
)
function apply() {
	if (result.value?.lines.length) emit('apply', result.value.lines)
}
</script>
<template>
	<Modal :open="open" title="Import Rincian dari Excel" size="xl" @close="emit('close')">
		<div class="space-y-4">
			<FileDrop v-model="file" accept=".xlsx" hint="Gunakan template XLSX, maksimal 5 MB dan 2.000 rincian." />
			<p v-if="busy" class="py-4 text-center text-ink-muted">Memproses file…</p>
			<p v-else-if="error" class="rounded-md bg-danger-soft p-3 text-danger">{{ error }}</p>
			<template v-else-if="result">
				<p
					class="rounded-md p-3"
					:class="!importable ? 'bg-danger-soft text-danger' : errors ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success'"
				>
					{{
						!importable
							? 'Tidak ada baris yang dapat diimpor. Perbaiki file lalu coba lagi.'
							: errors
								? `${errors} baris bermasalah akan dilewati; ${importable} baris akan diimpor.`
								: `${importable} baris siap diimpor.`
					}}
				</p>
				<div class="flex flex-wrap gap-x-6 gap-y-1 text-s text-ink-muted">
					<span
						><strong class="text-ink">{{ result.rows.length }}</strong> baris file</span
					><span
						><strong class="text-success">{{ importable }}</strong> dapat diimpor</span
					><span
						><strong class="text-danger">{{ errors }}</strong> error</span
					><span
						><strong class="text-warning">{{ warnings }}</strong> peringatan</span
					><span
						>Laba Rugi Setelah Belanja Modal <strong class="text-ink"><Amount :value="result.total" /></strong
					></span>
				</div>
				<p v-if="importable" class="rounded-md bg-warning-soft p-3 text-warning">
					Import akan menghapus seluruh {{ existing }} rincian yang ada di form ini (semua akun, OPEX &amp; CAPEX) lalu menggantinya dengan
					{{ importable }} baris dari file.
				</p>
				<div class="max-h-80 overflow-auto">
					<table class="w-full text-m">
						<thead>
							<tr class="sticky top-0 bg-fill text-left text-ink-muted">
								<th class="px-3 py-2">#</th>
								<th class="px-3 py-2">Akun</th>
								<th class="px-3 py-2">Kode Rincian</th>
								<th class="px-3 py-2">Deskripsi</th>
								<th class="px-3 py-2 text-right">Total</th>
								<th class="px-3 py-2">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-hairline">
							<tr v-for="item in result.rows" :key="item.row" class="align-top">
								<td class="px-3 py-2 text-ink-muted">{{ item.row }}</td>
								<td class="px-3 py-2">{{ item.account || '—' }}</td>
								<td class="whitespace-nowrap px-3 py-2">{{ item.code || '—' }}</td>
								<td class="px-3 py-2">
									{{ item.description || '—' }}
									<ul v-if="item.issues.length" class="mt-1 list-disc pl-4 text-s" :class="item.status === 'error' ? 'text-danger' : 'text-warning'">
										<li v-for="issue in item.issues" :key="issue">{{ issue }}</li>
									</ul>
								</td>
								<td class="px-3 py-2 text-right"><Amount :value="item.total" /></td>
								<td class="px-3 py-2">
									<Badge :tone="statusTone[item.status]">{{ statusLabel[item.status] }}</Badge>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</template>
		</div>
		<template #footer
			><Button variant="secondary" @click="emit('close')"><IconX class="h-4 w-4" /> Batal</Button
			><Button :disabled="!importable" @click="apply"><IconRefresh class="h-4 w-4" /> Ganti Semua Rincian</Button></template
		>
	</Modal>
</template>
