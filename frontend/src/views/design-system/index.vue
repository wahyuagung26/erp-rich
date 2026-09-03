<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Button from '@/components/base/Button.vue'
import Input from '@/components/base/Input.vue'
import Textarea from '@/components/base/Textarea.vue'
import Select from '@/components/base/Select.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import RadioGroup from '@/components/base/RadioGroup.vue'
import Switch from '@/components/base/Switch.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import FormField from '@/components/base/FormField.vue'
import Badge from '@/components/base/Badge.vue'
import Tabs from '@/components/base/Tabs.vue'
import Table from '@/components/base/Table.vue'
import Amount from '@/components/base/Amount.vue'
import StatTile from '@/components/base/StatTile.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import Skeleton from '@/components/base/Skeleton.vue'
import Spinner from '@/components/base/Spinner.vue'
import Modal from '@/components/base/Modal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import type { TableRow } from '@/utils/types'

const { ask } = useConfirm()
const toast = useToast()

const text = ref('')
const area = ref('')
const sel = ref('')
const check = ref(true)
const radio = ref('a')
const toggle = ref(true)
const day = ref('2026-09-03')
const tab = ref('one')
const modalOpen = ref(false)

const swatches = [
	['canvas', 'bg-canvas'],
	['panel', 'bg-panel'],
	['fill', 'bg-fill'],
	['hairline', 'bg-hairline'],
	['primary', 'bg-primary'],
	['primary-dark', 'bg-primary-dark'],
	['primary-soft', 'bg-primary-soft'],
	['danger', 'bg-danger'],
	['warning', 'bg-warning'],
	['success', 'bg-success'],
	['info', 'bg-info'],
	['ink', 'bg-ink']
]

const typeScale = [
	['heading-l', 'text-heading-l'],
	['heading-m', 'text-heading-m'],
	['heading-s', 'text-heading-s'],
	['l — 14', 'text-l'],
	['m — 13 (base)', 'text-m'],
	['s — 12', 'text-s'],
	['xs — 10', 'text-xs']
]

const tableRows: TableRow[] = [
	{ label: 'Kode', field: 'code', align: 'left', isSort: { activeSort: 'asc' } },
	{ label: 'Nama', field: 'name', align: 'left' },
	{ label: 'Nilai (Rp)', field: 'total', align: 'right', isSort: { activeSort: 'asc' } }
]
const tableData = [
	{ code: '1-1000', name: 'Kas', total: 128450000 },
	{ code: '2-2000', name: 'Utang Usaha', total: -71800000 },
	{ code: '4-4000', name: 'Pendapatan Penjualan', total: 342900000 }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Design System" subtitle="Flat · Borderless · Functional Minimalism — gunakan toggle density di topbar" />

		<Panel title="Warna">
			<div class="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
				<div v-for="[name, cls] in swatches" :key="name" class="space-y-1">
					<div class="h-12 rounded-md ring-1 ring-hairline" :class="cls" />
					<p class="text-s text-ink-muted">{{ name }}</p>
				</div>
			</div>
		</Panel>

		<Panel title="Tipografi" description="Inter untuk teks · JetBrains Mono untuk angka & kode (numeric spine)">
			<div class="space-y-2">
				<p v-for="[label, cls] in typeScale" :key="label" :class="cls">
					{{ label }} — Neraca konsolidasi
					<span class="ml-2 font-mono tnum text-ink-muted">1.234.567</span>
				</p>
			</div>
		</Panel>

		<Panel title="Tombol">
			<div class="flex flex-wrap items-center gap-2">
				<Button>Primary</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="danger">Danger</Button>
				<Button variant="subtle">Subtle</Button>
				<Button size="sm">Small</Button>
				<Button :loading="true">Loading</Button>
				<Button disabled>Disabled</Button>
			</div>
		</Panel>

		<Panel title="Kontrol Form">
			<div class="grid max-w-2xl gap-4 sm:grid-cols-2">
				<FormField label="Input" hint="Filled, borderless"><Input v-model="text" placeholder="Ketik…" /></FormField>
				<FormField label="Input (error)" error="Wajib diisi"><Input placeholder="1-1000" mono /></FormField>
				<FormField label="Select"
					><Select
						v-model="sel"
						placeholder="Pilih…"
						:options="[
							{ label: 'Satu', value: '1' },
							{ label: 'Dua', value: '2' }
						]"
				/></FormField>
				<FormField label="Tanggal"><DatePicker v-model="day" /></FormField>
				<FormField label="Textarea" class="sm:col-span-2"><Textarea v-model="area" placeholder="Catatan…" /></FormField>
				<FormField label="Checkbox & Switch">
					<div class="flex items-center gap-4">
						<Checkbox v-model="check" label="Aktif" />
						<Switch v-model="toggle" :label="toggle ? 'On' : 'Off'" />
					</div>
				</FormField>
				<FormField label="Radio">
					<RadioGroup
						v-model="radio"
						inline
						:options="[
							{ label: 'A', value: 'a' },
							{ label: 'B', value: 'b' }
						]"
					/>
				</FormField>
			</div>
		</Panel>

		<Panel title="Badge & Tabs">
			<div class="flex flex-wrap gap-2">
				<Badge>Neutral</Badge>
				<Badge tone="primary">Primary</Badge>
				<Badge tone="success">Aktif</Badge>
				<Badge tone="danger">Ditolak</Badge>
				<Badge tone="warning">Menunggu</Badge>
				<Badge tone="info">Draft</Badge>
			</div>
			<Tabs
				v-model="tab"
				class="mt-4"
				:tabs="[
					{ label: 'Ringkasan', value: 'one' },
					{ label: 'Rincian', value: 'two' }
				]"
			/>
		</Panel>

		<Panel title="Stat Tiles">
			<div class="grid grid-cols-2 divide-x divide-y divide-hairline sm:grid-cols-4">
				<StatTile label="Kas & Bank" value="Rp 128.450.000" />
				<StatTile label="Laba Bulan Ini" value="Rp 39.650.000" delta="+8,4%" delta-tone="success" />
				<StatTile label="Selisih" value="Rp (2.100.000)" delta="perlu ditinjau" delta-tone="danger" />
				<StatTile label="Posting" value="128" />
			</div>
		</Panel>

		<Panel title="Tabel">
			<Table :rows="tableRows" :columns="tableData">
				<template #table-content="{ row, column }">
					<span v-if="row.field === 'code'" class="font-mono tnum">{{ column.code }}</span>
					<Amount v-else-if="row.field === 'total'" :value="column.total as number" />
					<span v-else>{{ column[row.field] }}</span>
				</template>
			</Table>
		</Panel>

		<Panel title="Status & Umpan Balik">
			<div class="grid gap-4 sm:grid-cols-3">
				<div>
					<p class="mb-2 text-s text-ink-muted">Spinner</p>
					<Spinner />
				</div>
				<div>
					<p class="mb-2 text-s text-ink-muted">Skeleton</p>
					<Skeleton />
				</div>
				<div class="rounded-md bg-fill"><EmptyState title="Belum ada data" description="Tambahkan entri pertama" /></div>
			</div>
		</Panel>

		<Panel title="Overlay">
			<div class="flex flex-wrap gap-2">
				<Button variant="secondary" @click="modalOpen = true">Buka Modal</Button>
				<Button
					variant="secondary"
					@click="
						ask({ title: 'Hapus data', message: 'Tindakan ini permanen.', type: 'danger', confirmText: 'Hapus' }, () => toast.success('Terhapus'))
					"
				>
					Confirm Dialog
				</Button>
				<Button variant="secondary" @click="toast.success('Perubahan disimpan')">Toast sukses</Button>
				<Button variant="secondary" @click="toast.error('Gagal menyimpan')">Toast error</Button>
			</div>
			<Modal :open="modalOpen" title="Contoh Modal" @close="modalOpen = false">
				<p class="text-m text-ink-muted">Overlay adalah satu-satunya permukaan yang memakai shadow di sistem ini.</p>
				<template #footer>
					<Button variant="secondary" size="sm" @click="modalOpen = false">Tutup</Button>
				</template>
			</Modal>
		</Panel>
	</div>
</template>
