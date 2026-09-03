import type { Akun } from '@/utils/types'

export const akunSeed: Akun[] = [
	{ id: 'a-1000', code: '1-1000', name: 'Kas', type: 'asset', normal_balance: 'debit', active: true },
	{ id: 'a-1100', code: '1-1100', name: 'Bank BCA', type: 'asset', normal_balance: 'debit', active: true },
	{ id: 'a-1200', code: '1-1200', name: 'Piutang Usaha', type: 'asset', normal_balance: 'debit', active: true },
	{ id: 'a-1300', code: '1-1300', name: 'Persediaan Barang', type: 'asset', normal_balance: 'debit', active: true },
	{ id: 'a-1500', code: '1-1500', name: 'Peralatan Kantor', type: 'asset', normal_balance: 'debit', active: true },
	{ id: 'a-2000', code: '2-2000', name: 'Utang Usaha', type: 'liability', normal_balance: 'credit', active: true },
	{ id: 'a-2100', code: '2-2100', name: 'Utang Pajak', type: 'liability', normal_balance: 'credit', active: true },
	{ id: 'a-2200', code: '2-2200', name: 'Utang Bank', type: 'liability', normal_balance: 'credit', active: false },
	{ id: 'a-3000', code: '3-3000', name: 'Modal Disetor', type: 'equity', normal_balance: 'credit', active: true },
	{ id: 'a-3100', code: '3-3100', name: 'Laba Ditahan', type: 'equity', normal_balance: 'credit', active: true },
	{ id: 'a-4000', code: '4-4000', name: 'Pendapatan Penjualan', type: 'revenue', normal_balance: 'credit', active: true },
	{ id: 'a-4100', code: '4-4100', name: 'Pendapatan Jasa', type: 'revenue', normal_balance: 'credit', active: true },
	{ id: 'a-5000', code: '5-5000', name: 'Harga Pokok Penjualan', type: 'expense', normal_balance: 'debit', active: true },
	{ id: 'a-6000', code: '6-6000', name: 'Beban Gaji', type: 'expense', normal_balance: 'debit', active: true },
	{ id: 'a-6100', code: '6-6100', name: 'Beban Sewa', type: 'expense', normal_balance: 'debit', active: true },
	{ id: 'a-6200', code: '6-6200', name: 'Beban Listrik & Air', type: 'expense', normal_balance: 'debit', active: true },
	{ id: 'a-6300', code: '6-6300', name: 'Beban Penyusutan', type: 'expense', normal_balance: 'debit', active: true },
	{ id: 'a-6400', code: '6-6400', name: 'Beban Administrasi Bank', type: 'expense', normal_balance: 'debit', active: true }
]
