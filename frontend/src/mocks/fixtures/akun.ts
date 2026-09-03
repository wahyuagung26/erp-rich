import type { Akun } from '@/utils/types'

export const akunSeed: Akun[] = [
	{ id: 1, code: '1-1000', name: 'Kas', type: 'asset', normal_balance: 'debit', active: true },
	{ id: 2, code: '1-1100', name: 'Bank BCA', type: 'asset', normal_balance: 'debit', active: true },
	{ id: 3, code: '1-1200', name: 'Piutang Usaha', type: 'asset', normal_balance: 'debit', active: true },
	{ id: 4, code: '1-1300', name: 'Persediaan Barang', type: 'asset', normal_balance: 'debit', active: true },
	{ id: 5, code: '1-1500', name: 'Peralatan Kantor', type: 'asset', normal_balance: 'debit', active: true },
	{ id: 6, code: '2-2000', name: 'Utang Usaha', type: 'liability', normal_balance: 'credit', active: true },
	{ id: 7, code: '2-2100', name: 'Utang Pajak', type: 'liability', normal_balance: 'credit', active: true },
	{ id: 8, code: '2-2200', name: 'Utang Bank', type: 'liability', normal_balance: 'credit', active: false },
	{ id: 9, code: '3-3000', name: 'Modal Disetor', type: 'equity', normal_balance: 'credit', active: true },
	{ id: 10, code: '3-3100', name: 'Laba Ditahan', type: 'equity', normal_balance: 'credit', active: true },
	{ id: 11, code: '4-4000', name: 'Pendapatan Penjualan', type: 'revenue', normal_balance: 'credit', active: true },
	{ id: 12, code: '4-4100', name: 'Pendapatan Jasa', type: 'revenue', normal_balance: 'credit', active: true },
	{ id: 13, code: '5-5000', name: 'Harga Pokok Penjualan', type: 'expense', normal_balance: 'debit', active: true },
	{ id: 14, code: '6-6000', name: 'Beban Gaji', type: 'expense', normal_balance: 'debit', active: true },
	{ id: 15, code: '6-6100', name: 'Beban Sewa', type: 'expense', normal_balance: 'debit', active: true },
	{ id: 16, code: '6-6200', name: 'Beban Listrik & Air', type: 'expense', normal_balance: 'debit', active: true },
	{ id: 17, code: '6-6300', name: 'Beban Penyusutan', type: 'expense', normal_balance: 'debit', active: true },
	{ id: 18, code: '6-6400', name: 'Beban Administrasi Bank', type: 'expense', normal_balance: 'debit', active: true }
]
