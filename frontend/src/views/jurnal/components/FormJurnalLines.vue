<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconPlus, IconTrash, IconDeviceFloppy, IconX } from '@tabler/icons-vue'
import api from '@/utils/api'
import { money } from '@/utils/format'
import Panel from '@/components/base/Panel.vue'
import FormField from '@/components/base/FormField.vue'
import DatePicker from '@/components/base/DatePicker.vue'
import Input from '@/components/base/Input.vue'
import Select from '@/components/base/Select.vue'
import Button from '@/components/base/Button.vue'
import type { AkunPerkiraan, ApiList, JurnalLine } from '@/utils/types'

const emit = defineEmits<{ submit: [{ date: string; description: string; lines: JurnalLine[] }] }>()
defineProps<{ loading?: boolean }>()

const router = useRouter()

const form = reactive({
	date: new Date().toISOString().slice(0, 10),
	description: ''
})

const blank = (): JurnalLine => ({ akun_id: 0, debit: 0, credit: 0 })
const lines = ref<JurnalLine[]>([blank(), blank()])

const akunOptions = ref<{ label: string; value: number }[]>([])
onMounted(async () => {
	const res = await api.get<ApiList<AkunPerkiraan>>('/akun-perkiraan', { params: { per_page: 100 } })
	akunOptions.value = res.data.data.map((a) => ({ label: `${a.code} — ${a.name}`, value: a.id }))
})

const totalDebit = computed(() => lines.value.reduce((s, l) => s + Number(l.debit || 0), 0))
const totalCredit = computed(() => lines.value.reduce((s, l) => s + Number(l.credit || 0), 0))
const balanced = computed(() => totalDebit.value > 0 && totalDebit.value === totalCredit.value)
const filled = computed(() => lines.value.every((l) => l.akun_id && (Number(l.debit) > 0 || Number(l.credit) > 0)))

const errorText = computed(() => {
	if (!filled.value) return 'Setiap baris butuh akun dan salah satu nilai debit / kredit.'
	if (!balanced.value) return `Belum seimbang — selisih ${money(Math.abs(totalDebit.value - totalCredit.value))}.`
	return ''
})

// one side only per line
function onDebit(line: JurnalLine, val: string) {
	line.debit = Number(val) || 0
	if (line.debit) line.credit = 0
}
function onCredit(line: JurnalLine, val: string) {
	line.credit = Number(val) || 0
	if (line.credit) line.debit = 0
}

function submit() {
	if (!filled.value || !balanced.value) return
	emit('submit', {
		...form,
		lines: lines.value.map((l) => ({ akun_id: Number(l.akun_id), debit: Number(l.debit), credit: Number(l.credit) }))
	})
}
</script>

<template>
	<Panel class="max-w-5xl">
		<form class="space-y-8" @submit.prevent="submit">
			<section class="space-y-4">
				<div class="grid max-w-xl grid-cols-2 gap-4">
					<FormField label="Tanggal" required>
						<DatePicker v-model="form.date" />
					</FormField>
				</div>
				<FormField label="Keterangan" required>
					<Input v-model="form.description" placeholder="mis. Pembayaran sewa kantor" />
				</FormField>
			</section>

			<section class="space-y-3">
				<h3 class="subhead">Baris Jurnal</h3>
				<table class="w-full text-m">
					<thead>
						<tr class="border-b border-hairline text-s text-ink-muted">
							<th class="py-1.5 text-left font-semibold">Akun</th>
							<th class="py-1.5 text-right font-semibold">Debit (Rp)</th>
							<th class="py-1.5 text-right font-semibold">Kredit (Rp)</th>
							<th class="w-8" />
						</tr>
					</thead>
					<tbody class="divide-y divide-hairline">
						<tr v-for="(line, i) in lines" :key="i">
							<td class="py-1.5 pr-2">
								<Select
									:model-value="line.akun_id || ''"
									placeholder="Pilih akun"
									:options="akunOptions"
									@update:model-value="(v) => (line.akun_id = Number(v))"
								/>
							</td>
							<td class="py-1.5 pl-2">
								<Input :model-value="line.debit || ''" type="number" align="right" mono @update:model-value="(v) => onDebit(line, v)" />
							</td>
							<td class="py-1.5 pl-2">
								<Input :model-value="line.credit || ''" type="number" align="right" mono @update:model-value="(v) => onCredit(line, v)" />
							</td>
							<td class="py-1.5 text-center">
								<button
									type="button"
									class="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-danger-soft hover:text-danger disabled:opacity-30"
									:disabled="lines.length <= 2"
									@click="lines.splice(i, 1)"
								>
									<IconTrash class="h-4 w-4" />
								</button>
							</td>
						</tr>
					</tbody>
					<tfoot>
						<tr class="border-t border-hairline font-mono tnum">
							<td class="py-2 text-right text-s text-ink-muted">Total</td>
							<td class="py-2 text-right" :class="balanced ? 'text-ink' : 'text-danger'">{{ money(totalDebit) }}</td>
							<td class="py-2 text-right" :class="balanced ? 'text-ink' : 'text-danger'">{{ money(totalCredit) }}</td>
							<td />
						</tr>
					</tfoot>
				</table>

				<Button type="button" variant="subtle" size="sm" @click="lines.push(blank())"> <IconPlus class="h-4 w-4" /> Tambah baris </Button>

				<p v-if="errorText" class="text-s text-danger">{{ errorText }}</p>
			</section>

			<div class="flex gap-2 pt-2">
				<Button type="submit" :loading="loading" :disabled="!balanced || !filled">
					<IconDeviceFloppy v-if="!loading" class="h-4 w-4" /> Simpan Jurnal
				</Button>
				<Button variant="secondary" type="button" @click="router.push('/jurnal')"> <IconX class="h-4 w-4" /> Batal </Button>
			</div>
		</form>
	</Panel>
</template>
