import type { CashFlow } from '@/utils/types'

export const cashFlowSeed: CashFlow[] = [
	{ id: 'DIVIDEN_IN', code: 'DIVIDEN_IN', name: 'Dividen In', group: 'PENDANAAN', position: 'IN' },
	{ id: 'DIVIDEN_OUT', code: 'DIVIDEN_OUT', name: 'Dividen Out', group: 'PENDANAAN', position: 'OUT' },
	{ id: 'INVESTASI_COMPANY', code: 'INVESTASI_COMPANY', name: 'Investasi Company', group: 'INVESTASI', position: 'OUT' },
	{ id: 'INVESTASI_IN_ASET', code: 'INVESTASI_IN_ASET', name: 'Investasi In - Aset', group: 'INVESTASI', position: 'IN' },
	{ id: 'INVESTASI_OUT_ASET', code: 'INVESTASI_OUT_ASET', name: 'Investasi Out - Aset', group: 'INVESTASI', position: 'OUT' },
	{ id: 'MODAL_AWAL', code: 'MODAL_AWAL', name: 'Modal Awal', group: 'PENDANAAN', position: 'IN' },
	{ id: 'OPERASI_IN', code: 'OPERASI_IN', name: 'Operasi In', group: 'OPERASI', position: 'IN' },
	{ id: 'OPERASI_IN_PAJAK', code: 'OPERASI_IN_PAJAK', name: 'Operasi In - Pajak', group: 'OPERASI', position: 'IN' },
	{ id: 'OPERASI_IN_STOK', code: 'OPERASI_IN_STOK', name: 'Operasi In - Stok', group: 'OPERASI', position: 'IN' },
	{ id: 'OPERASI_OUT', code: 'OPERASI_OUT', name: 'Operasi Out', group: 'OPERASI', position: 'OUT' },
	{ id: 'OPERASI_OUT_PAJAK', code: 'OPERASI_OUT_PAJAK', name: 'Operasi Out - Pajak', group: 'OPERASI', position: 'OUT' },
	{ id: 'OPERASI_OUT_STOK', code: 'OPERASI_OUT_STOK', name: 'Operasi Out - Stok', group: 'OPERASI', position: 'OUT' },
	{ id: 'PENDANAAN_IN', code: 'PENDANAAN_IN', name: 'Pendanaan In', group: 'PENDANAAN', position: 'IN' },
	{ id: 'PENDANAAN_IN_FILM', code: 'PENDANAAN_IN_FILM', name: 'Pendanaan In - Film', group: 'PENDANAAN', position: 'IN' },
	{ id: 'PENDANAAN_OUT', code: 'PENDANAAN_OUT', name: 'Pendanaan Out', group: 'PENDANAAN', position: 'OUT' },
	{ id: 'PENDANAAN_OUT_FILM', code: 'PENDANAAN_OUT_FILM', name: 'Pendanaan Out - Film', group: 'PENDANAAN', position: 'OUT' },
	{ id: 'PINDAHBUKU_INOUT', code: 'PINDAHBUKU_INOUT', name: 'PindahBuku InOut', group: 'OPERASI', position: 'INOUT' },
	{ id: 'PRIVE', code: 'PRIVE', name: 'Prive', group: 'PENDANAAN', position: 'OUT' },
	{ id: 'REIMBURSEMENT_INOUT', code: 'REIMBURSEMENT_INOUT', name: 'Reimbursement -InOut', group: 'OPERASI', position: 'INOUT' },
	{ id: 'TAMBAHAN_MODAL', code: 'TAMBAHAN_MODAL', name: 'Tambahan Modal', group: 'PENDANAAN', position: 'IN' }
]
