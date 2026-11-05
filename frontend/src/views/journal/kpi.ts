import { IconCircleCheck, IconCircleX, IconClockHour4 } from '@tabler/icons-vue'
import type { KpiDef } from '@/composables/useKpiTiles'

// KPI tiles shared by every list with the submitted → approved / rejected flow (Jurnal Umum / Pemasukan / Pengeluaran,
// Uang Muka Operasional). Each tile presets the page's `status` filter — see docs/conventions.md (list KPI summary).
export const journalKpiDefs: KpiDef[] = [
	{
		key: 'pending',
		label: 'Menunggu Persetujuan',
		filters: { status: 'submitted' },
		icon: IconClockHour4,
		tone: 'warning',
		attention: true,
		emptyText: 'Semua sudah diproses'
	},
	{ key: 'approved', label: 'Disetujui', filters: { status: 'approved' }, icon: IconCircleCheck, tone: 'success', emptyText: 'Belum ada' },
	{
		key: 'rejected',
		label: 'Ditolak',
		filters: { status: 'rejected' },
		icon: IconCircleX,
		tone: 'danger',
		attention: true,
		emptyText: 'Tidak ada yang ditolak'
	}
]
